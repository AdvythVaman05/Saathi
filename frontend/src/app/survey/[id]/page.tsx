'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSurveyStore } from '../../../stores/surveyStore';
import { usePreferenceStore } from '../../../stores/preferenceStore';
import { SurveyContainer } from '../../../components/SurveyContainer';
import { demoSurvey } from '../../../features/survey-engine/demoSurvey';
import { getNextQuestionId } from '../../../features/survey-engine/routing/router';
import { loadSurveyDefinition, persistAnswer, completeSurveySession } from '../../../features/survey-engine/persistence/syncer';
import { validateAnswer } from '../../../features/survey-engine/validators/validator';
import { parseVoiceAnswer } from '../../../features/survey-engine/voiceParser';
import { VoiceCommandProcessor } from '../../../features/voice-engine/commands/processor';
import { useSpeechRecognition } from '../../../hooks/useSpeechRecognition';
import { useSpeechSynthesis } from '../../../hooks/useSpeechSynthesis';
import { questionResolver } from '../../../features/localization/question-localization/resolver';
import { api } from '../../../services/api';
import { announcePolitely, announceAssertively } from '../../../utils/announcer';
import { SurveyDefinition, QuestionDefinition } from '../../../features/survey-engine/models/types';
import {
  LanguageSelectionScreen,
  TutorialModeScreen,
  MicPermissionScreen,
  PermissionDeniedScreen,
  AssistedModeWelcomeScreen,
  ActiveQuestionLayout,
  HelpScreen,
  PausedScreen,
  SurveyCompletedScreen,
} from '../../../components/survey/SurveyScreens';

// VAD and Audio capture imports
import { WebAudioVad } from '../../../features/voice-engine/vad/vad';
import { calibrateNoiseFloor } from '../../../features/voice-engine/vad/calibration';
import { AudioCaptureService } from '../../../features/voice-engine/pipeline/AudioCaptureService';
import { telemetry } from '../../../features/analytics/telemetry';

export default function ActiveSurveyPage() {
  const params = useParams();
  const router = useRouter();
  const surveyId = (params?.id as string) || 'demo-survey-uuid';

  const {
    currentState,
    currentLanguage,
    currentQuestionId,
    candidateAnswer,
    transcriptionConfidence,
    initializeSurvey,
    send,
  } = useSurveyStore();

  const { speechRate, speechVolume } = usePreferenceStore();

  const [survey, setSurvey] = useState<SurveyDefinition | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isSelfGuided, setIsSelfGuided] = useState(true);

  // Dynamic reference holding the current onEnd callback for the speech synthesizer
  const onEndRef = useRef<() => void>(() => {});

  // VAD dynamic noise floor calibration references
  const noiseFloorRef = useRef<number>(0.005);
  const [isCalibrating, setIsCalibrating] = useState(false);

  // 1. Initial survey loading
  useEffect(() => {
    async function loadSurvey() {
      try {
        setLoading(true);
        console.log(`[DIAGNOSTIC] Survey fetch started for ID: ${surveyId}`);
        const data = await loadSurveyDefinition(surveyId);
        console.log(`[DIAGNOSTIC] Survey fetch success for ID: ${surveyId}. Title: "${data.title}", Questions: ${data.questions.length}`);
        setSurvey(data);
        if (data.questions.length > 0) {
          console.log(`[DIAGNOSTIC] Initializing survey FSM with surveyId: ${data.id}, firstQuestionId: ${data.questions[0].id}`);
          initializeSurvey(data.id, data.questions[0].id);
          
          // Auto-start survey FSM from IDLE to LANGUAGE_SELECTION
          const freshState = useSurveyStore.getState().currentState;
          if (freshState === 'IDLE') {
            console.log(`[DIAGNOSTIC] FSM is IDLE. Dispatching START_SURVEY.`);
            send({ type: 'START_SURVEY' });
          }
        }
      } catch (err) {
        console.error(`[DIAGNOSTIC] Survey fetch failed for ID: ${surveyId}:`, err);
        console.warn("Failed to load remote survey. Using local demo survey fallback.", err);
        setSurvey(demoSurvey);
        initializeSurvey(demoSurvey.id, demoSurvey.questions[0].id);
        
        // Auto-start survey FSM from IDLE to LANGUAGE_SELECTION for fallback
        const freshState = useSurveyStore.getState().currentState;
        if (freshState === 'IDLE') {
          console.log(`[DIAGNOSTIC] FSM is IDLE after fallback initialization. Dispatching START_SURVEY.`);
          send({ type: 'START_SURVEY' });
        }
      } finally {
        setLoading(false);
        console.log(`[DIAGNOSTIC] Survey initialization completion. Loading state set to false.`);
      }
    }
    if (surveyId) {
      loadSurvey();
    }
  }, [surveyId, initializeSurvey, send]);

  // Log FSM state transitions
  useEffect(() => {
    console.log(`[DIAGNOSTIC] FSM state updated. CurrentState: "${currentState}", currentQuestionId: "${currentQuestionId}"`);
  }, [currentState, currentQuestionId]);

  // 2. Resolve active question
  const activeQuestion = survey?.questions.find((q) => q.id === currentQuestionId) || null;
  const questionIndex = survey ? survey.questions.findIndex((q) => q.id === currentQuestionId) : -1;
  const totalQuestions = survey ? survey.questions.length : 0;

  // 3. VAD dynamic noise floor calibration effect
  useEffect(() => {
    let active = true;
    async function runCalibration() {
      // Run calibration during first question playback (user is silent listening to question read)
      if (currentState === 'QUESTION_READING' && questionIndex === 0) {
        try {
          setIsCalibrating(true);
          await AudioCaptureService.getInstance().startCapture();
          const calibratedFloor = await calibrateNoiseFloor({ durationMs: 2000 });
          if (active) {
            if (isNaN(calibratedFloor) || calibratedFloor <= 0 || calibratedFloor > 0.1) {
              console.warn("VAD: Calibration determined invalid noise floor. Utilizing conservative fallback of 0.01.", calibratedFloor);
              noiseFloorRef.current = 0.01;
              window.dispatchEvent(new CustomEvent('saathi-telemetry-error', {
                detail: {
                  category: 'VAD_CALIBRATION_WARNING',
                  message: `Invalid noise floor calibrated: ${calibratedFloor}`,
                  code: 'VAD_INVALID_FLOOR'
                }
              }));
            } else {
              console.log("VAD: Calibration complete. Noise floor level:", calibratedFloor);
              noiseFloorRef.current = calibratedFloor;
            }
          }
        } catch (err: any) {
          console.warn("VAD: Calibration failed, utilizing conservative defaults.", err);
          noiseFloorRef.current = 0.01; // Conservative fallback
          window.dispatchEvent(new CustomEvent('saathi-telemetry-error', {
            detail: {
              category: 'VAD_CALIBRATION_FAILED',
              message: err.message || 'Calibration service threw exception',
              code: 'VAD_CALIBRATION_ERROR'
            }
          }));
        } finally {
          if (active) setIsCalibrating(false);
        }
      }
    }
    runCalibration();
    return () => {
      active = false;
    };
  }, [currentState, questionIndex]);

  // 3. Persist manual / voice answers
  const handleSaveAnswer = useCallback(async (value: unknown) => {
    if (!activeQuestion || !sessionId || !survey) return;

    const nextId = getNextQuestionId(activeQuestion, survey.questions, value);
    const hasNext = nextId !== null;

    console.log(`[DIAGNOSTIC] handleSaveAnswer: value="${value}", activeQuestionId="${activeQuestion.id}", nextId="${nextId}", hasNext=${hasNext}`);

    // Save locally to IndexedDB immediately, syncs to API
    await persistAnswer({
      session_id: sessionId,
      question_id: activeQuestion.id,
      answer_value: value,
      is_confirmed: true,
      confidence_score: transcriptionConfidence || 1.0,
    });

    console.log(`[DIAGNOSTIC] handleSaveAnswer: dispatching CONFIRM_YES with nextQuestionId="${nextId}"`);
    send({
      type: 'CONFIRM_YES',
      payload: {
        hasNextQuestion: hasNext,
        nextQuestionId: nextId,
      },
    });
  }, [activeQuestion, sessionId, survey, transcriptionConfidence, send]);

  const handleSaveManualAnswer = useCallback(async (value: unknown) => {
    if (!activeQuestion || !sessionId || !survey) return;

    const nextId = getNextQuestionId(activeQuestion, survey.questions, value);
    const hasNext = nextId !== null;

    console.log(`[DIAGNOSTIC] handleSaveManualAnswer: value="${value}", activeQuestionId="${activeQuestion.id}", nextId="${nextId}", hasNext=${hasNext}`);

    await persistAnswer({
      session_id: sessionId,
      question_id: activeQuestion.id,
      answer_value: value,
      is_confirmed: true,
      confidence_score: 1.0,
    });

    console.log(`[DIAGNOSTIC] handleSaveManualAnswer: dispatching SUBMIT_MANUAL with nextQuestionId="${nextId}"`);
    send({
      type: 'SUBMIT_MANUAL',
      payload: {
        hasNextQuestion: hasNext,
        nextQuestionId: nextId,
      },
    });
  }, [activeQuestion, sessionId, survey, send]);

  // 4. Voice command & answer processor
  const handleSpeechResult = useCallback((transcript: string, confidence: number) => {
    if (!activeQuestion || !survey) return;

    console.log(`[DIAGNOSTIC] handleSpeechResult: transcript="${transcript}", confidence=${confidence}, currentState="${currentState}"`);

    // A. Yes/No Confirmation parsing
    if (currentState === 'CONFIRMING') {
      const yesTerms = ['yes', 'correct', 'yeah', 'confirm', 'हाँ', 'हाँजी', 'అవును', 'avunu'];
      const noTerms = ['no', 'incorrect', 'nope', 'cancel', 'नहीं', 'ना', 'కాదు', 'kaadu'];
      const norm = transcript.trim().toLowerCase();
      
      const isYes = yesTerms.some(term => norm.includes(term));
      const isNo = noTerms.some(term => norm.includes(term));

      console.log(`[DIAGNOSTIC] handleSpeechResult CONFIRMING: norm="${norm}", isYes=${isYes}, isNo=${isNo}`);

      if (isYes && !isNo) {
        console.log(`[DIAGNOSTIC] handleSpeechResult CONFIRMING: Confirming Yes. Saving candidateAnswer="${candidateAnswer}"`);
        handleSaveAnswer(candidateAnswer);
      } else if (isNo && !isYes) {
        console.log(`[DIAGNOSTIC] handleSpeechResult CONFIRMING: Confirming No. Dispatching CONFIRM_NO.`);
        send({ type: 'CONFIRM_NO' });
      } else {
        // Did not understand confirmation -> trigger recovery state
        console.warn(`[DIAGNOSTIC] handleSpeechResult CONFIRMING: Confirmation not understood. Dispatching TIMEOUT.`);
        send({ type: 'TIMEOUT' });
      }
      return;
    }

    // B. Standard command matching
    const commandProcessor = new VoiceCommandProcessor(currentLanguage);
    const cmdResult = commandProcessor.processTranscript(transcript);

    if (cmdResult.isCommand) {
      console.log(`[DIAGNOSTIC] handleSpeechResult command matched: "${cmdResult.commandToken}"`);
      if (cmdResult.commandToken === 'repeat') {
        send({ type: 'GO_BACK', payload: { previousQuestionId: activeQuestion.id } });
      } else if (cmdResult.commandToken === 'back') {
        if (questionIndex > 0) {
          const prevQ = survey.questions[questionIndex - 1];
          send({ type: 'GO_BACK', payload: { previousQuestionId: prevQ.id } });
        } else {
          announceAssertively("This is the first question. Cannot go back.");
        }
      } else if (cmdResult.commandToken === 'skip') {
        if (!activeQuestion.required) {
          const nextId = getNextQuestionId(activeQuestion, survey.questions, null);
          send({
            type: 'CONFIRM_YES',
            payload: {
              hasNextQuestion: nextId !== null,
              nextQuestionId: nextId,
            },
          });
        } else {
          announceAssertively("This question is required. You cannot skip it.");
        }
      } else if (cmdResult.commandToken === 'help') {
        send({ type: 'TRIGGER_HELP' });
      } else if (cmdResult.commandToken === 'pause') {
        send({ type: 'TRIGGER_PAUSE' });
      } else if (cmdResult.commandToken === 'resume') {
        send({ type: 'TRIGGER_RESUME' });
      } else if (cmdResult.commandToken === 'exit') {
        router.push('/');
      }
      return;
    }

    // C. Question Answer parsing
    console.log(`[DIAGNOSTIC] handleSpeechResult: Dispatching FINISH_LISTENING.`);
    send({ type: 'FINISH_LISTENING' }); // Transitions to PROCESSING

    const parsed = parseVoiceAnswer(activeQuestion, transcript, currentLanguage);
    const validation = validateAnswer(activeQuestion, parsed.value);

    console.log(`[DIAGNOSTIC] handleSpeechResult parsing: parsedValue="${parsed.value}", parsedConfidence=${parsed.confidence}, isValid=${validation.isValid}, error="${validation.error || ''}"`);

    if (validation.isValid && parsed.value !== null && parsed.value !== undefined) {
      // Play confirmation sound cue
      window.dispatchEvent(new CustomEvent('saathi-audio-cue', { detail: { type: 'SUCCESS' } }));
      
      console.log(`[DIAGNOSTIC] handleSpeechResult parsing success: dispatching RESOLVE_TRANSCRIPTION with transcript="${String(parsed.value)}"`);
      send({
        type: 'RESOLVE_TRANSCRIPTION',
        payload: {
          transcript: String(parsed.value),
          confidence: parsed.confidence,
        },
      });
    } else {
      // Failed to match valid answer -> trigger recovery rephrase flow
      window.dispatchEvent(new CustomEvent('saathi-audio-cue', { detail: { type: 'ALERT' } }));
      console.warn(`[DIAGNOSTIC] handleSpeechResult parsing failure: dispatching RESOLVE_TRANSCRIPTION with empty transcript to trigger RECOVERY`);
      send({
        type: 'RESOLVE_TRANSCRIPTION',
        payload: {
          transcript: '',
          confidence: 0.1, // Forces RECOVERY transition
        },
      });
    }
  }, [activeQuestion, currentState, survey, currentLanguage, questionIndex, candidateAnswer, handleSaveAnswer, send, router]);

  // 5. Speech Hooks Initializations
  const { speak, cancel } = useSpeechSynthesis({
    lang: currentLanguage,
    onEnd: () => {
      onEndRef.current?.();
    },
    onError: (err) => {
      console.warn("Speech synthesis execution error:", err);
      onEndRef.current?.();
    },
  });

  const { isListening, startListening, stopListening } = useSpeechRecognition({
    lang: currentLanguage,
    onResult: (transcript, confidence) => {
      handleSpeechResult(transcript, confidence);
    },
    onError: (err) => {
      console.warn("Speech recognition error: falling back to manual mode.", err);
      send({ type: 'TRIGGER_MANUAL' });
    },
  });


  // 6. Speech synthesis playback rules
  useEffect(() => {
    if (!activeQuestion) return;

    if (currentState === 'QUESTION_READING') {
      const qText = questionResolver.resolve(activeQuestion.question_text, currentLanguage as any);
      let optionsText = '';
      if (activeQuestion.question_type === 'single_choice' || activeQuestion.question_type === 'multi_choice') {
        optionsText = '. ' + (activeQuestion.options || [])
          .map((o, idx) => `Option ${idx + 1}: ${o.text[currentLanguage] || o.text['en']}`)
          .join('. ');
      }
      onEndRef.current = () => {
        send({ type: 'FINISH_READING' });
      };
      speak(qText + optionsText, speechRate, speechVolume);
    } else if (currentState === 'RECOVERY') {
      onEndRef.current = () => {
        send({ type: 'RECOVERY_COMPLETE' });
      };
      const retryText = currentLanguage === 'hi'
        ? "क्षमा करें, मैं समझ नहीं पाया। कृपया अपना उत्तर फिर से दोहराएं।"
        : currentLanguage === 'te'
        ? "క్షమించండి, నాకు అర్థం కాలేదు. దయచేసి మీ సమాధానాన్ని మళ్ళీ చెప్పండి."
        : "Sorry, I did not catch that. Please repeat your answer.";
      speak(retryText, speechRate, speechVolume);
    } else if (currentState === 'HELP') {
      onEndRef.current = () => {};
      const helpText = getHelpInstructions(activeQuestion.question_type);
      speak(helpText, speechRate, speechVolume);
    } else {
      cancel();
    }

    return () => {
      cancel();
    };
  }, [currentState, activeQuestion, currentLanguage, speak, cancel, speechRate, speechVolume, send]);

  // Helper mapping instructions for TTS speech synthesizer
  const getHelpInstructions = (type: string): string => {
    switch (type) {
      case 'boolean':
        return 'For Yes or No questions, say Yes to confirm or No to decline.';
      case 'single_choice':
        return 'For Multiple Choice, speak the name of your selection, or speak Option 1, Option 2, Option 3 to answer.';
      case 'multi_choice':
        return 'For multi-select, speak each selection you want, then speak done.';
      case 'scale':
        return 'For Scale Ratings, speak a number from 1 to 5.';
      case 'text':
      case 'audio_response':
        return 'For open text, speak your response clearly.';
      default:
        return 'Speak your response clearly into your microphone, then confirm when prompted.';
    }
  };

  // 7. Speech recognition toggle rules
  useEffect(() => {
    if ((currentState === 'LISTENING' || currentState === 'CONFIRMING') && isSelfGuided) {
      startListening();
    } else {
      stopListening();
    }
    return () => {
      stopListening();
    };
  }, [currentState, isSelfGuided, startListening, stopListening]);

  // VAD and Watchdog integration
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if ((currentState === 'LISTENING' || currentState === 'CONFIRMING') && isSelfGuided) {
      console.log(`[DIAGNOSTIC] VAD integration: Initializing WebAudioVad for state: "${currentState}"`);
      const vad = new WebAudioVad({
        speechThresholdMargin: 0.015,
        silenceDurationMs: 2000, // 2000ms pause tolerance for slow speakers (Scenario H)
        maxListeningDurationMs: 120000, // Watchdog timer config
      });

      vad.setNoiseFloor(noiseFloorRef.current);

      vad.initialize(null, {
        onSpeechStart: () => {
          console.log(`[DIAGNOSTIC] VAD: Speech started in state: "${currentState}"`);
        },
        onSpeechEnd: () => {
          console.log(`[DIAGNOSTIC] VAD: Speech ended in state: "${currentState}".`);
          if (currentState === 'CONFIRMING') {
            console.log("[DIAGNOSTIC] VAD onSpeechEnd: calling stopListening manually for CONFIRMING state.");
            stopListening();
          } else {
            console.log("[DIAGNOSTIC] VAD onSpeechEnd: dispatching FINISH_LISTENING for LISTENING state.");
            send({ type: 'FINISH_LISTENING' });
          }
        },
        onError: (err) => {
          console.warn(`[DIAGNOSTIC] VAD error in state "${currentState}":`, err);
        }
      });

      vad.startDetection();

      // Watchdog: auto-advance to PROCESSING after maxListeningDurationMs
      const watchdogTimer = setTimeout(() => {
        console.warn(`[DIAGNOSTIC] VAD Watchdog: Max listening duration exceeded in state: "${currentState}".`);
        if (currentState === 'CONFIRMING') {
          console.log("[DIAGNOSTIC] VAD Watchdog: calling stopListening manually for CONFIRMING state.");
          stopListening();
        } else {
          console.log("[DIAGNOSTIC] VAD Watchdog: dispatching FINISH_LISTENING for LISTENING state.");
          send({ type: 'FINISH_LISTENING' });
        }
      }, vad.getMaxListeningDurationMs());

      return () => {
        console.log(`[DIAGNOSTIC] VAD integration: Cleanup WebAudioVad for state: "${currentState}"`);
        vad.stopDetection();
        vad.destroy();
        clearTimeout(watchdogTimer);
      };
    }
  }, [currentState, isSelfGuided, send, stopListening]);

  // 8. Session completion trigger
  useEffect(() => {
    if (currentState === 'COMPLETED' && sessionId) {
      completeSurveySession(sessionId);
    }
  }, [currentState, sessionId]);

  // 9. Session bootstrapping triggers
  const handleSelectLanguage = (lang: string) => {
    send({ type: 'SELECT_LANGUAGE', payload: { language: lang } });
  };

  const handleSelectMode = async (mode: 'self-guided' | 'assisted') => {
    const isSelf = mode === 'self-guided';
    setIsSelfGuided(isSelf);

    const { updatePreference, userId } = usePreferenceStore.getState();
    updatePreference('preferredLanguage', currentLanguage);

    try {
      const response = await api.post<{ id: string }>('/api/responses/sessions/start/', {
        survey: surveyId,
        user: userId || undefined,
        language: currentLanguage,
        accessibility_mode: mode,
      });
      setSessionId(response.id);
      localStorage.setItem('saathi_active_session_id', response.id);
      telemetry.init(response.id);
    } catch (err) {
      console.warn("API Session start failed. Running in local sync fallback mode.", err);
      const mockSessionId = crypto.randomUUID();
      setSessionId(mockSessionId);
      localStorage.setItem('saathi_active_session_id', mockSessionId);
      telemetry.init(mockSessionId);
    }

    send({ type: 'COMPLETE_TUTORIAL' }); // Transitions to MIC_PERMISSION
  };

  const requestMicPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      send({ type: 'RESOLVE_MIC', payload: { granted: true } });
    } catch (err) {
      console.warn("Microphone permission denied:", err);
      send({ type: 'RESOLVE_MIC', payload: { granted: false } });
    }
  };

  // 10. Render Layout Loading
  if (loading || !survey) {
    return (
      <SurveyContainer>
        <div className="flex items-center justify-center min-h-[300px]">
          <p className="text-2xl font-bold font-hyperlegible animate-pulse text-accent">
            Bootstrapping Survey Session...
          </p>
        </div>
      </SurveyContainer>
    );
  }

  // 11. Screen Routing Switch
  return (
    <SurveyContainer>
      {currentState === 'LANGUAGE_SELECTION' && (
        <LanguageSelectionScreen onSelectLanguage={handleSelectLanguage} />
      )}

      {currentState === 'TUTORIAL' && (
        <TutorialModeScreen currentLanguage={currentLanguage} onSelectMode={handleSelectMode} />
      )}

      {currentState === 'MIC_PERMISSION' && (
        <MicPermissionScreen
          currentLanguage={currentLanguage}
          isSelfGuided={isSelfGuided}
          onRequestPermission={requestMicPermission}
        />
      )}

      {currentState === 'PERMISSION_DENIED' && (
        <PermissionDeniedScreen
          onRetry={() => send({ type: 'RETRY_MIC' })}
          onChooseAssisted={() => send({ type: 'CHOOSE_ASSISTED' })}
        />
      )}

      {currentState === 'ASSISTED_MODE' && (
        <AssistedModeWelcomeScreen onStart={() => send({ type: 'START_QUESTIONS' })} />
      )}

      {(currentState === 'QUESTION_READING' ||
        currentState === 'LISTENING' ||
        currentState === 'PROCESSING' ||
        currentState === 'CONFIRMING' ||
        currentState === 'MANUAL_RESPONSE' ||
        currentState === 'RECOVERY') &&
        activeQuestion && (
          <ActiveQuestionLayout
            question={activeQuestion}
            totalQuestions={totalQuestions}
            questionIndex={questionIndex}
            currentLanguage={currentLanguage}
            isSelfGuided={isSelfGuided}
            currentState={currentState}
            candidateAnswer={candidateAnswer}
            onSendEvent={send}
            onSaveManualAnswer={handleSaveManualAnswer}
            onConfirmYes={() => handleSaveAnswer(candidateAnswer)}
            onGoBack={() => {
              if (questionIndex > 0) {
                const prevQ = survey.questions[questionIndex - 1];
                send({ type: 'GO_BACK', payload: { previousQuestionId: prevQ.id } });
              }
            }}
          />
        )}

      {currentState === 'HELP' && activeQuestion && (
        <HelpScreen
          questionType={activeQuestion.question_type}
          onClose={() => send({ type: 'CLOSE_HELP' })}
        />
      )}

      {currentState === 'PAUSED' && (
        <PausedScreen onResume={() => send({ type: 'TRIGGER_RESUME' })} />
      )}

      {currentState === 'COMPLETED' && <SurveyCompletedScreen />}
    </SurveyContainer>
  );
}
