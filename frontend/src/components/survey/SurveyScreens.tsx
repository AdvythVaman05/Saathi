'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useSurveyStore } from '../../stores/surveyStore';
import { usePreferenceStore } from '../../stores/preferenceStore';
import { LANGUAGE_REGISTRY } from '../../features/localization/translations';
import { questionResolver } from '../../features/localization/question-localization/resolver';
import { QuestionDefinition, SurveyDefinition } from '../../features/survey-engine/models/types';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { RadioGroup, RadioOption } from '../ui/RadioGroup';
import { CheckboxGroup, CheckboxOption } from '../ui/CheckboxGroup';
import { ProgressIndicator } from '../ui/ProgressIndicator';
import { announcePolitely, announceAssertively } from '../../utils/announcer';

// ============================================================================
// 1. LANGUAGE SELECTION SCREEN
// ============================================================================
interface LanguageSelectionScreenProps {
  onSelectLanguage: (lang: string) => void;
}

export function LanguageSelectionScreen({ onSelectLanguage }: LanguageSelectionScreenProps) {
  useEffect(() => {
    announcePolitely("Language Selection Screen. Press 1 for English, 2 for Hindi, 3 for Telugu, or select from the options below.");
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const num = parseInt(e.key, 10);
      if (num > 0 && num <= LANGUAGE_REGISTRY.length) {
        const selectedLang = LANGUAGE_REGISTRY[num - 1].code;
        onSelectLanguage(selectedLang);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onSelectLanguage]);

  return (
    <Card className="flex flex-col gap-6 text-center max-w-xl mx-auto" focusable>
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold font-hyperlegible">Select Your Language</h1>
        <p className="text-lg text-textSecondary font-hyperlegible">
          कृपया अपनी पसंदीदा भाषा चुनें / దయచేసి మీ భాషను ఎంచుకోండి
        </p>
      </header>
      <div className="flex flex-col gap-3 w-full max-w-xs mx-auto" role="group" aria-label="Available languages">
        {LANGUAGE_REGISTRY.map((lang, index) => (
          <Button
            key={lang.code}
            variant="primary"
            onClick={() => onSelectLanguage(lang.code)}
            aria-label={`Select ${lang.name} (${index + 1})`}
          >
            {lang.nativeName} ({lang.name})
          </Button>
        ))}
      </div>
    </Card>
  );
}

// ============================================================================
// 2. TUTORIAL / MODE SELECTION SCREEN
// ============================================================================
interface TutorialModeScreenProps {
  currentLanguage: string;
  onSelectMode: (mode: 'self-guided' | 'assisted') => void;
}

export function TutorialModeScreen({ currentLanguage, onSelectMode }: TutorialModeScreenProps) {
  const welcomeMessages: Record<string, string> = {
    en: "Welcome to Saathi. Choose your navigation mode below. You can choose Self-Guided Mode which uses automated voice flow and microphone prompts, or Assisted Mode which provides large visual buttons.",
    hi: "साथी में आपका स्वागत है। अपनी नेविगेशन मोड चुनें। आप स्व-निर्देशित मोड चुन सकते हैं जो आवाज प्रवाह का उपयोग करता है, या सहायता मोड जिसमें बड़े बटन होते हैं।",
    te: "సాథికి స్వాగతం. మీ నావిగేషన్ మోడ్‌ను ఎంచుకోండి. మీరు స్వయం-నావిగేషన్ మోడ్ లేదా సహాయక నావిగేషన్ మోడ్ ఎంచుకోవచ్చు.",
  };

  useEffect(() => {
    const welcomeMsg = welcomeMessages[currentLanguage] || welcomeMessages['en'];
    announcePolitely(welcomeMsg);
  }, [currentLanguage]);

  return (
    <Card className="flex flex-col gap-6 max-w-xl mx-auto" focusable>
      <header className="text-center flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold font-hyperlegible">Choose Survey Mode</h1>
        <p className="text-textSecondary font-hyperlegible">
          Select how you would like to navigate the survey questionnaire.
        </p>
      </header>
      <div className="flex flex-col md:flex-row gap-4 justify-center">
        <Button
          variant="accent"
          size="lg"
          className="flex-1 min-h-[80px]"
          onClick={() => onSelectMode('self-guided')}
          aria-label="Select Self-Guided Mode"
        >
          <div className="flex flex-col text-left">
            <span className="text-xl font-bold">Self-Guided</span>
            <span className="text-sm font-normal opacity-90 mt-1">Automatic voice flows, keyboard shortcuts, and voice entry.</span>
          </div>
        </Button>
        <Button
          variant="secondary"
          size="lg"
          className="flex-1 min-h-[80px] border-foreground"
          onClick={() => onSelectMode('assisted')}
          aria-label="Select Assisted Mode"
        >
          <div className="flex flex-col text-left">
            <span className="text-xl font-bold">Assisted Mode</span>
            <span className="text-sm font-normal opacity-90 mt-1">Large high-contrast controls, keyboard-friendly manual layout.</span>
          </div>
        </Button>
      </div>
    </Card>
  );
}

// ============================================================================
// 3. MICROPHONE PERMISSION SCREEN
// ============================================================================
interface MicPermissionScreenProps {
  currentLanguage: string;
  isSelfGuided: boolean;
  onRequestPermission: () => void;
}

export function MicPermissionScreen({ currentLanguage, isSelfGuided, onRequestPermission }: MicPermissionScreenProps) {
  const instructionMsg = isSelfGuided
    ? "Microphone access is requested. Press SPACE or ENTER to open the browser permission dialog. PressSPACE or ENTER again to grant access."
    : "Microphone access is requested to enable voice-based question answering. Click Request Microphone below.";

  useEffect(() => {
    announcePolitely(instructionMsg);
  }, [instructionMsg]);

  useEffect(() => {
    if (!isSelfGuided) return;

    let spacePressCount = 0;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        spacePressCount++;
        if (spacePressCount === 1) {
          onRequestPermission();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSelfGuided, onRequestPermission]);

  return (
    <Card className="flex flex-col gap-6 text-center max-w-xl mx-auto" focusable>
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold font-hyperlegible">Microphone Access Required</h1>
        <p className="text-lg text-textSecondary font-hyperlegible">
          {isSelfGuided
            ? "Press Space or Enter to prompt microphone access, then allow permission in the browser popup."
            : "We require microphone access to transcribe your spoken answers during this session."}
        </p>
      </header>
      <div className="flex justify-center gap-4">
        <Button
          variant="accent"
          size="lg"
          onClick={onRequestPermission}
          aria-label="Request Microphone Access"
        >
          Request Microphone
        </Button>
      </div>
    </Card>
  );
}

// ============================================================================
// 4. PERMISSION DENIED SCREEN
// ============================================================================
interface PermissionDeniedScreenProps {
  onRetry: () => void;
  onChooseAssisted: () => void;
}

export function PermissionDeniedScreen({ onRetry, onChooseAssisted }: PermissionDeniedScreenProps) {
  useEffect(() => {
    announceAssertively("Microphone permission was denied. You can retry microphone setup or choose to proceed in Assisted Mode with keyboard inputs.");
  }, []);

  return (
    <Card className="flex flex-col gap-6 text-center max-w-xl mx-auto" focusable>
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold font-hyperlegible text-red-500">Microphone Permission Denied</h1>
        <p className="text-lg text-textSecondary font-hyperlegible">
          Microphone access is blocked. Without mic access, voice-first navigation is unavailable.
        </p>
      </header>
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button
          variant="primary"
          size="md"
          onClick={onRetry}
          aria-label="Retry Microphone Permission Setup"
        >
          Retry Setup
        </Button>
        <Button
          variant="secondary"
          size="md"
          className="border-foreground"
          onClick={onChooseAssisted}
          aria-label="Proceed to Assisted Mode"
        >
          Proceed to Assisted Mode
        </Button>
      </div>
    </Card>
  );
}

// ============================================================================
// 5. ASSISTED MODE WELCOME SCREEN
// ============================================================================
interface AssistedModeWelcomeScreenProps {
  onStart: () => void;
}

export function AssistedModeWelcomeScreen({ onStart }: AssistedModeWelcomeScreenProps) {
  useEffect(() => {
    announcePolitely("Assisted Mode activated. Displaying large visible controls. Press Space or Enter to begin the survey.");
  }, []);

  return (
    <Card className="flex flex-col gap-6 text-center max-w-xl mx-auto" focusable>
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold font-hyperlegible">Assisted Mode Activated</h1>
        <p className="text-lg text-textSecondary font-hyperlegible">
          Saathi is configured for manual keyboard and screen reader inputs. Visual controls are enlarged.
        </p>
      </header>
      <div className="flex justify-center">
        <Button
          variant="accent"
          size="lg"
          onClick={onStart}
          aria-label="Begin survey questions"
        >
          Start Survey
        </Button>
      </div>
    </Card>
  );
}

// ============================================================================
// 6. QUESTION CONTAINER (READING, LISTENING, CONFIRMING, MANUAL)
// ============================================================================
interface ActiveQuestionLayoutProps {
  question: QuestionDefinition;
  totalQuestions: number;
  questionIndex: number;
  currentLanguage: string;
  isSelfGuided: boolean;
  currentState: string;
  candidateAnswer: unknown;
  onSendEvent: (event: any) => void;
  onSaveManualAnswer: (val: unknown) => void;
  onGoBack: () => void;
  onConfirmYes?: () => void;
}

export function ActiveQuestionLayout({
  question,
  totalQuestions,
  questionIndex,
  currentLanguage,
  isSelfGuided,
  currentState,
  candidateAnswer,
  onSendEvent,
  onSaveManualAnswer,
  onGoBack,
  onConfirmYes,
}: ActiveQuestionLayoutProps) {
  const [manualInputValue, setManualInputValue] = useState<any>('');
  const textInputRef = useRef<HTMLTextAreaElement>(null);

  // Sync manual input state when question changes
  useEffect(() => {
    setManualInputValue('');
  }, [question.id]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualInputValue === undefined || manualInputValue === null || manualInputValue === '') {
      alert("Please provide an answer before submitting.");
      return;
    }
    onSaveManualAnswer(manualInputValue);
  };

  const qText = questionResolver.resolve(question.question_text, currentLanguage as any);

  // Format options for Checkbox / Radio
  const radioOptions: RadioOption[] = (question.options || []).map(opt => ({
    id: opt.id,
    value: opt.id,
    label: opt.text[currentLanguage] || opt.text['en'] || '',
  }));

  const checkboxOptions: CheckboxOption[] = (question.options || []).map(opt => ({
    id: opt.id,
    value: opt.id,
    label: opt.text[currentLanguage] || opt.text['en'] || '',
  }));

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* 1. Progress Indicator */}
      <ProgressIndicator value={questionIndex + 1} max={totalQuestions} />

      {/* 2. Primary Question Card */}
      <Card className="flex flex-col gap-6" focusable>
        <header className="flex flex-col gap-2">
          <span className="sr-only">Question {questionIndex + 1}</span>
          <h2 className="text-2xl font-bold font-hyperlegible">{qText}</h2>
          {question.required && (
            <span className="text-sm font-semibold text-textSecondary uppercase tracking-wider">Required</span>
          )}
        </header>

        {/* Dynamic Controls based on FSM state */}
        <section className="flex flex-col gap-4">
          {currentState === 'QUESTION_READING' && (
            <div className="p-4 bg-bgPrimary border border-accent/20 rounded-medium text-center">
              <p className="text-xl font-medium animate-pulse text-accent">Reading Question...</p>
            </div>
          )}

          {currentState === 'LISTENING' && (
            <div className="flex flex-col items-center gap-4 py-6 bg-bgPrimary border border-green-500/20 rounded-medium">
              <div className="h-12 w-12 rounded-full bg-green-500/20 border-2 border-green-500 animate-ping flex items-center justify-center" aria-hidden="true" />
              <p className="text-xl font-bold text-green-400">Listening to Your Answer...</p>
              {!isSelfGuided && (
                <Button
                  variant="primary"
                  onClick={() => onSendEvent({ type: 'FINISH_LISTENING' })}
                  aria-label="Finish speaking and process answer"
                >
                  Done Speaking
                </Button>
              )}
            </div>
          )}

          {currentState === 'PROCESSING' && (
            <div className="p-4 bg-bgPrimary border border-accent/20 rounded-medium text-center">
              <p className="text-xl font-semibold text-accent animate-pulse">Analyzing Speech...</p>
            </div>
          )}

          {currentState === 'RECOVERY' && (
            <div className="p-4 bg-bgPrimary border border-red-500/20 rounded-medium text-center">
              <p className="text-lg text-red-400 font-semibold mb-2">Speech Not Clear</p>
              <p className="text-sm text-textSecondary">Please try speaking again. Speak clearly and close to your microphone.</p>
            </div>
          )}

          {currentState === 'CONFIRMING' && (
            <div className="flex flex-col gap-4 p-6 bg-bgPrimary border border-accent/40 rounded-medium">
              <h3 className="text-xl font-bold">Confirm Your Answer</h3>
              <p className="text-lg italic text-textSecondary">
                Did you say: <span className="text-foreground font-semibold">"{String(candidateAnswer)}"</span>?
              </p>
              <div className="flex gap-4 mt-2">
                <Button
                  variant="accent"
                  className="flex-1"
                  onClick={() => onConfirmYes?.()}
                  aria-label="Yes, confirm answer"
                >
                  Yes
                </Button>
                <Button
                  variant="secondary"
                  className="flex-1 border-foreground"
                  onClick={() => onSendEvent({ type: 'CONFIRM_NO' })}
                  aria-label="No, re-record answer"
                >
                  No
                </Button>
              </div>
            </div>
          )}

          {currentState === 'MANUAL_RESPONSE' && (
            <form onSubmit={handleManualSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-4" role="group" aria-label="Question Input Controls">
                {/* Single Choice Form Controls */}
                {question.question_type === 'single_choice' && (
                  <RadioGroup
                    name={`q-${question.id}`}
                    legend="Choose one option:"
                    options={radioOptions}
                    selectedValue={manualInputValue}
                    onChangeValue={setManualInputValue}
                    required={question.required}
                  />
                )}

                {/* Multi Choice Form Controls */}
                {question.question_type === 'multi_choice' && (
                  <CheckboxGroup
                    name={`q-${question.id}`}
                    legend="Choose one or more options:"
                    options={checkboxOptions}
                    selectedValues={manualInputValue || []}
                    onChangeValues={setManualInputValue}
                    required={question.required}
                  />
                )}

                {/* Boolean Controls */}
                {question.question_type === 'boolean' && (
                  <RadioGroup
                    name={`q-${question.id}`}
                    legend="Select an option:"
                    options={[
                      { id: 'bool_true', value: 'true', label: 'Yes' },
                      { id: 'bool_false', value: 'false', label: 'No' },
                    ]}
                    selectedValue={manualInputValue !== undefined ? String(manualInputValue) : undefined}
                    onChangeValue={(val) => setManualInputValue(val === 'true')}
                    required={question.required}
                  />
                )}

                {/* Scale Ratings Controls */}
                {question.question_type === 'scale' && (
                  <div className="flex flex-col gap-2">
                    <span className="font-semibold text-lg">Rate on a scale of 1 to 5:</span>
                    <div className="flex gap-2 justify-between max-w-md" role="group" aria-label="1 to 5 rating scale">
                      {[1, 2, 3, 4, 5].map((num) => (
                        <Button
                          key={num}
                          type="button"
                          variant={manualInputValue === num ? 'accent' : 'secondary'}
                          className="w-12 h-12 border-foreground"
                          onClick={() => setManualInputValue(num)}
                          aria-label={`Rate ${num}`}
                        >
                          {num}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Text Controls */}
                {(question.question_type === 'text' || question.question_type === 'audio_response') && (
                  <div className="flex flex-col gap-2">
                    <label htmlFor={`textarea-${question.id}`} className="font-semibold text-lg">Type your response:</label>
                    <textarea
                      id={`textarea-${question.id}`}
                      ref={textInputRef}
                      className="w-full min-h-[100px] p-3 rounded-medium bg-bgPrimary border border-muted focus:border-accent text-foreground outline-none font-hyperlegible text-lg"
                      value={manualInputValue || ''}
                      onChange={(e) => setManualInputValue(e.target.value)}
                      required={question.required}
                    />
                  </div>
                )}
              </div>

              <Button type="submit" variant="accent" className="mt-4 self-start">
                Submit Answer
              </Button>
            </form>
          )}
        </section>

        {/* Global actions row (Skip, Back, Help, Pause, Manual) */}
        <footer className="flex flex-wrap gap-3 justify-between items-center border-t border-muted pt-4 mt-2">
          <div className="flex gap-3">
            {questionIndex > 0 && (
              <Button variant="secondary" className="border-foreground" onClick={onGoBack} aria-label="Go to previous question">
                Back
              </Button>
            )}
            {!question.required && currentState !== 'MANUAL_RESPONSE' && (
              <Button variant="secondary" className="border-foreground" onClick={() => onSendEvent({ type: 'CONFIRM_YES', payload: { hasNextQuestion: questionIndex < totalQuestions - 1 } })} aria-label="Skip this question">
                Skip
              </Button>
            )}
          </div>

          <div className="flex gap-3">
            <Button variant="secondary" className="border-foreground" onClick={() => onSendEvent({ type: 'TRIGGER_HELP' })} aria-label="Get question instructions help">
              Help
            </Button>
            <Button variant="secondary" className="border-foreground" onClick={() => onSendEvent({ type: 'TRIGGER_PAUSE' })} aria-label="Pause survey session">
              Pause
            </Button>
            {currentState !== 'MANUAL_RESPONSE' && (
              <Button variant="secondary" className="border-foreground text-accent" onClick={() => onSendEvent({ type: 'TRIGGER_MANUAL' })} aria-label="Switch to typing answer manually">
                Type Answer
              </Button>
            )}
          </div>
        </footer>
      </Card>
    </div>
  );
}

// ============================================================================
// 7. HELP SCREEN
// ============================================================================
interface HelpScreenProps {
  questionType: string;
  onClose: () => void;
}

export function HelpScreen({ questionType, onClose }: HelpScreenProps) {
  useEffect(() => {
    announcePolitely("Help menu open. Read instructions for this question type. Press Space or Enter to close help and resume.");
  }, []);

  const getHelpInstructions = (type: string): string => {
    switch (type) {
      case 'boolean':
        return 'For Yes/No questions, speak the word "Yes" to agree, or "No" to disagree. You can also press Space to enter manual mode.';
      case 'single_choice':
        return 'For Multiple Choice, speak the name of your chosen option, or speak "Option 1", "Option 2" to make a selection.';
      case 'multi_choice':
        return 'For multi-select questions, speak each option name you wish to select, then speak "Submit".';
      case 'scale':
        return 'For Scale Ratings, speak a number from 1 to 5, where 1 is the lowest and 5 is the highest rating.';
      case 'text':
      case 'audio_response':
        return 'For open ended text, speak your response clearly. Speak "Submit" when you are finished.';
      default:
        return 'Speak your response clearly into your microphone, then confirm when prompted.';
    }
  };

  return (
    <Card className="flex flex-col gap-6 max-w-xl mx-auto" focusable>
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold font-hyperlegible">Help Guide</h1>
        <p className="text-lg text-textSecondary font-hyperlegible">
          Instructions for answering this question type:
        </p>
      </header>
      <div className="p-4 bg-bgPrimary border border-accent/20 rounded-medium">
        <p className="text-lg font-hyperlegible font-semibold text-accent leading-relaxed">
          {getHelpInstructions(questionType)}
        </p>
      </div>
      <Button variant="primary" onClick={onClose} aria-label="Close help menu and return to survey">
        Close Help
      </Button>
    </Card>
  );
}

// ============================================================================
// 8. PAUSED SCREEN
// ============================================================================
interface PausedScreenProps {
  onResume: () => void;
}

export function PausedScreen({ onResume }: PausedScreenProps) {
  useEffect(() => {
    announcePolitely("Survey is paused. Press Space or Enter to resume your session.");
  }, []);

  return (
    <Card className="flex flex-col gap-6 text-center max-w-xl mx-auto" focusable>
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold font-hyperlegible text-accent">Survey Paused</h1>
        <p className="text-lg text-textSecondary font-hyperlegible">
          Your responses and state are saved locally. You can resume at any time.
        </p>
      </header>
      <div className="flex justify-center">
        <Button variant="accent" size="lg" onClick={onResume} aria-label="Resume survey questionnaire">
          Resume Survey
        </Button>
      </div>
    </Card>
  );
}

// ============================================================================
// 9. SURVEY COMPLETED SCREEN
// ============================================================================
export function SurveyCompletedScreen() {
  useEffect(() => {
    announcePolitely("Survey Completed. Thank you very much for your responses. You can now close this tab.");
  }, []);

  return (
    <Card className="flex flex-col gap-6 text-center max-w-xl mx-auto" focusable>
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold font-hyperlegible text-green-400">Survey Completed</h1>
        <p className="text-xl font-hyperlegible font-semibold text-accent mt-2">
          Thank you for using Saathi!
        </p>
        <p className="text-textSecondary font-hyperlegible mt-1">
          Your answers have been stored and synchronized securely to our database.
        </p>
      </header>
    </Card>
  );
}
