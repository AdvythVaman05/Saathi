import { create } from 'zustand';

// 1. State Definitions
export type SurveyStateName =
  | 'IDLE'
  | 'LANGUAGE_SELECTION'
  | 'TUTORIAL'
  | 'MIC_PERMISSION'
  | 'PERMISSION_DENIED'
  | 'ASSISTED_MODE'
  | 'MANUAL_RESPONSE'
  | 'QUESTION_READING'
  | 'LISTENING'
  | 'PROCESSING'
  | 'CONFIRMING'
  | 'HELP'
  | 'PAUSED'
  | 'RECOVERY'
  | 'ERROR'
  | 'COMPLETED';

// 2. Event Definitions (Tagged Union representing all FSM inputs)
export type SurveyEvent =
  | { type: 'START_SURVEY' }
  | { type: 'SELECT_LANGUAGE'; payload: { language: string } }
  | { type: 'COMPLETE_TUTORIAL' }
  | { type: 'SKIP_TUTORIAL' }
  | { type: 'RESOLVE_MIC'; payload: { granted: boolean } }
  | { type: 'RETRY_MIC' }
  | { type: 'CHOOSE_ASSISTED' }
  | { type: 'START_QUESTIONS' }
  | { type: 'TRIGGER_MANUAL' }
  | { type: 'SUBMIT_MANUAL'; payload: { hasNextQuestion: boolean; nextQuestionId?: string | null } }
  | { type: 'GO_BACK'; payload: { previousQuestionId: string } }
  | { type: 'FINISH_READING' }
  | { type: 'FINISH_LISTENING' }
  | { type: 'TIMEOUT' }
  | { type: 'RESOLVE_TRANSCRIPTION'; payload: { transcript: string; confidence: number } }
  | { type: 'API_FAILURE'; payload: { error: string } }
  | { type: 'CONFIRM_YES'; payload: { hasNextQuestion: boolean; nextQuestionId?: string | null } }
  | { type: 'CONFIRM_NO' }
  | { type: 'TRIGGER_HELP' }
  | { type: 'CLOSE_HELP' }
  | { type: 'TRIGGER_PAUSE' }
  | { type: 'TRIGGER_RESUME' }
  | { type: 'RECOVERY_COMPLETE' }
  | { type: 'RESET' }
  | { type: 'FORCE_COMPLETE' };

// 3. FSM Context (Internal state variables)
export interface SurveyFsmContext {
  currentState: SurveyStateName;
  previousState: SurveyStateName | null;
  currentLanguage: string;
  surveyId: string | null;
  currentQuestionId: string | null;
  candidateAnswer: unknown | null;
  transcriptionConfidence: number;
  lastError: string | null;
  microphoneGranted: boolean | null;
  pausedReturnState: SurveyStateName | null;
  helpReturnState: SurveyStateName | null;
}

export interface SurveyStateStore extends SurveyFsmContext {
  // Dispatch function to send events to the state machine
  send: (event: SurveyEvent) => void;
  // Initialize context
  initializeSurvey: (surveyId: string, firstQuestionId: string) => void;
  // Reset context back to default
  resetContext: () => void;
}

// 4. Transition Mappings (Defines legal transitions for each state by event type)
const TRANSITIONS: Record<SurveyStateName, Partial<Record<SurveyEvent['type'], SurveyStateName>>> = {
  IDLE: {
    START_SURVEY: 'LANGUAGE_SELECTION',
  },
  LANGUAGE_SELECTION: {
    SELECT_LANGUAGE: 'TUTORIAL',
  },
  TUTORIAL: {
    COMPLETE_TUTORIAL: 'MIC_PERMISSION',
    SKIP_TUTORIAL: 'MIC_PERMISSION',
  },
  MIC_PERMISSION: {
    RESOLVE_MIC: 'QUESTION_READING', // Dynamically routed to PERMISSION_DENIED if granted=false
  },
  PERMISSION_DENIED: {
    RETRY_MIC: 'MIC_PERMISSION',
    CHOOSE_ASSISTED: 'ASSISTED_MODE',
  },
  ASSISTED_MODE: {
    START_QUESTIONS: 'QUESTION_READING',
  },
  MANUAL_RESPONSE: {
    SUBMIT_MANUAL: 'QUESTION_READING',
    GO_BACK: 'QUESTION_READING',
  },
  QUESTION_READING: {
    FINISH_READING: 'LISTENING',
    TRIGGER_HELP: 'HELP',
    TRIGGER_PAUSE: 'PAUSED',
    TRIGGER_MANUAL: 'MANUAL_RESPONSE',
    GO_BACK: 'QUESTION_READING',
    API_FAILURE: 'ERROR',
  },
  LISTENING: {
    FINISH_LISTENING: 'PROCESSING',
    TIMEOUT: 'RECOVERY',
    TRIGGER_HELP: 'HELP',
    TRIGGER_PAUSE: 'PAUSED',
    TRIGGER_MANUAL: 'MANUAL_RESPONSE',
    GO_BACK: 'QUESTION_READING',
    API_FAILURE: 'ERROR',
  },
  PROCESSING: {
    RESOLVE_TRANSCRIPTION: 'CONFIRMING',
    TRIGGER_MANUAL: 'MANUAL_RESPONSE',
    API_FAILURE: 'ERROR',
  },
  CONFIRMING: {
    CONFIRM_YES: 'QUESTION_READING',
    CONFIRM_NO: 'LISTENING',
    TIMEOUT: 'RECOVERY',
    TRIGGER_PAUSE: 'PAUSED',
    TRIGGER_MANUAL: 'MANUAL_RESPONSE',
    GO_BACK: 'QUESTION_READING',
  },
  HELP: {
    CLOSE_HELP: 'QUESTION_READING',
  },
  PAUSED: {
    TRIGGER_RESUME: 'QUESTION_READING',
  },
  RECOVERY: {
    RECOVERY_COMPLETE: 'LISTENING',
    TRIGGER_MANUAL: 'MANUAL_RESPONSE',
    API_FAILURE: 'ERROR',
  },
  ERROR: {
    RESET: 'IDLE',
    FORCE_COMPLETE: 'COMPLETED',
  },
  COMPLETED: {},
};

// 5. State Machine Store Creator
export const useSurveyStore = create<SurveyStateStore>((set, get) => {
  
  // Transition Guards (returns true if transition is legally allowed)
  const canTransition = (currentState: SurveyStateName, event: SurveyEvent): boolean => {
    const nextState = TRANSITIONS[currentState]?.[event.type];
    if (!nextState) return false;

    // Custom guards
    if (event.type === 'SELECT_LANGUAGE' && !event.payload.language) {
      return false;
    }
    if (event.type === 'RESOLVE_MIC' && event.payload.granted === undefined) {
      return false;
    }
    return true;
  };

  // Exit Actions (Executed when exiting a specific state)
  const executeExitAction = (state: SurveyStateName, nextState: SurveyStateName) => {
    if (state === 'LISTENING') {
      // Clear local mic buffers or hooks (handled via standard event triggers)
    }
  };

  // Entry Actions (Executed when entering a specific state)
  const executeEntryAction = (state: SurveyStateName, prevState: SurveyStateName, event: SurveyEvent) => {
    if (state === 'LANGUAGE_SELECTION') {
      // Trigger voice locale options read announcement
    }
    if (state === 'LISTENING') {
      // Emit trigger cue event for sound engine
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('saathi-audio-cue', { detail: { type: 'WAKE' } }));
      }
    }
    if (state === 'CONFIRMING') {
      // Emit confirm speech prompts
    }
    if (state === 'COMPLETED') {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('saathi-audio-cue', { detail: { type: 'COMPLETE' } }));
      }
    }
  };

  return {
    // Initial Context State
    currentState: 'IDLE',
    previousState: null,
    currentLanguage: 'en',
    surveyId: null,
    currentQuestionId: null,
    candidateAnswer: null,
    transcriptionConfidence: 1.0,
    lastError: null,
    microphoneGranted: null,
    pausedReturnState: null,
    helpReturnState: null,

    initializeSurvey: (surveyId, firstQuestionId) => {
      set({
        surveyId,
        currentQuestionId: firstQuestionId,
        currentState: 'IDLE',
      });
    },

    resetContext: () => {
      set({
        currentState: 'IDLE',
        previousState: null,
        currentLanguage: 'en',
        surveyId: null,
        currentQuestionId: null,
        candidateAnswer: null,
        transcriptionConfidence: 1.0,
        lastError: null,
        microphoneGranted: null,
        pausedReturnState: null,
        helpReturnState: null,
      });
    },

    send: (event) => {
      const state = get();
      const current = state.currentState;
      console.log(`[DIAGNOSTIC] FSM Store: Received event "${event.type}" in state "${current}". Payload:`, 'payload' in event ? event.payload : null);

      // Validate transition validity using guards
      if (!canTransition(current, event)) {
        console.warn(`[DIAGNOSTIC] FSM Store: Invalid transition event ${event.type} in state ${current}`);
        return;
      }

      // Resolve next state destination
      let targetState = TRANSITIONS[current]![event.type]!;

      // Dynamic branching adjustments inside state transitions
      let overrides: Partial<SurveyFsmContext> = {};

      if (event.type === 'SELECT_LANGUAGE') {
        overrides.currentLanguage = event.payload.language;
      }

      if (event.type === 'RESOLVE_MIC') {
        overrides.microphoneGranted = event.payload.granted;
        if (!event.payload.granted) {
          targetState = 'PERMISSION_DENIED';
        } else {
          targetState = 'QUESTION_READING';
        }
      }

      if (event.type === 'TRIGGER_PAUSE') {
        overrides.pausedReturnState = current;
      }

      if (event.type === 'TRIGGER_RESUME') {
        targetState = state.pausedReturnState || 'QUESTION_READING';
        overrides.pausedReturnState = null;
      }

      if (event.type === 'TRIGGER_HELP') {
        overrides.helpReturnState = current;
      }

      if (event.type === 'CLOSE_HELP') {
        targetState = state.helpReturnState || 'QUESTION_READING';
        overrides.helpReturnState = null;
      }

      if (event.type === 'RESOLVE_TRANSCRIPTION') {
        overrides.candidateAnswer = event.payload.transcript;
        overrides.transcriptionConfidence = event.payload.confidence;
        
        if (event.payload.confidence < 0.80) {
          targetState = 'RECOVERY';
        }
      }

      if (event.type === 'CONFIRM_YES') {
        overrides.candidateAnswer = null;
        if (!event.payload.hasNextQuestion) {
          targetState = 'COMPLETED';
        } else if (event.payload.nextQuestionId) {
          overrides.currentQuestionId = event.payload.nextQuestionId;
          console.log(`[DIAGNOSTIC] FSM Store: CONFIRM_YES: Advancing currentQuestionId to "${event.payload.nextQuestionId}"`);
        } else {
          console.warn(`[DIAGNOSTIC] FSM Store: CONFIRM_YES received but nextQuestionId is undefined/null!`);
        }
      }

      if (event.type === 'CONFIRM_NO') {
        overrides.candidateAnswer = null;
      }

      if (event.type === 'SUBMIT_MANUAL') {
        overrides.candidateAnswer = null;
        if (!event.payload.hasNextQuestion) {
          targetState = 'COMPLETED';
        } else if (event.payload.nextQuestionId) {
          overrides.currentQuestionId = event.payload.nextQuestionId;
          targetState = 'QUESTION_READING';
          console.log(`[DIAGNOSTIC] FSM Store: SUBMIT_MANUAL: Advancing currentQuestionId to "${event.payload.nextQuestionId}"`);
        }
      }

      if (event.type === 'GO_BACK') {
        overrides.currentQuestionId = event.payload.previousQuestionId;
        overrides.candidateAnswer = null;
        targetState = 'QUESTION_READING';
      }

      if (event.type === 'API_FAILURE') {
        overrides.lastError = event.payload.error;
      }

      console.log(`[DIAGNOSTIC] FSM Store: Transitioning from "${current}" to "${targetState}". Overrides:`, overrides);

      // Execute Transition
      executeExitAction(current, targetState);
      
      set({
        currentState: targetState,
        previousState: current,
        ...overrides,
      });

      executeEntryAction(targetState, current, event);

      // Emit transition alerts for screen reader announcer hooks
      if (typeof window !== 'undefined') {
        const transitionAlert = new CustomEvent('saathi-fsm-transition', {
          detail: { from: current, to: targetState, event: event.type },
        });
        window.dispatchEvent(transitionAlert);
      }
    },
  };
});

// 6. Selectors for Visual UI / Audio Engines
export const selectCurrentState = (state: SurveyStateStore) => state.currentState;
export const selectSurveyId = (state: SurveyStateStore) => state.surveyId;
export const selectQuestionId = (state: SurveyStateStore) => state.currentQuestionId;
export const selectLanguage = (state: SurveyStateStore) => state.currentLanguage;
export const selectCandidateAnswer = (state: SurveyStateStore) => state.candidateAnswer;
export const selectLastError = (state: SurveyStateStore) => state.lastError;
export const selectIsPaused = (state: SurveyStateStore) => state.currentState === 'PAUSED';
