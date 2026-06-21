import { useSurveyStore } from '../src/stores/surveyStore';

describe('Saathi Zustand FSM Unit Tests', () => {
  beforeEach(() => {
    // Reset store before each test run
    useSurveyStore.getState().resetContext();
  });

  test('Should initialize in IDLE state', () => {
    const state = useSurveyStore.getState();
    expect(state.currentState).toBe('IDLE');
    expect(state.previousState).toBeNull();
    expect(state.surveyId).toBeNull();
  });

  test('Should handle start survey transition successfully', () => {
    useSurveyStore.getState().initializeSurvey('survey-123', 'q-1');
    useSurveyStore.getState().send({ type: 'START_SURVEY' });

    const state = useSurveyStore.getState();
    expect(state.currentState).toBe('LANGUAGE_SELECTION');
    expect(state.previousState).toBe('IDLE');
    expect(state.surveyId).toBe('survey-123');
    expect(state.currentQuestionId).toBe('q-1');
  });

  test('Should select language and advance to TUTORIAL', () => {
    useSurveyStore.getState().initializeSurvey('survey-123', 'q-1');
    useSurveyStore.getState().send({ type: 'START_SURVEY' });
    useSurveyStore.getState().send({ type: 'SELECT_LANGUAGE', payload: { language: 'hi' } });

    const state = useSurveyStore.getState();
    expect(state.currentState).toBe('TUTORIAL');
    expect(state.currentLanguage).toBe('hi');
  });

  test('Should allow skipping tutorial to enter MIC_PERMISSION', () => {
    useSurveyStore.getState().initializeSurvey('survey-123', 'q-1');
    useSurveyStore.getState().send({ type: 'START_SURVEY' });
    useSurveyStore.getState().send({ type: 'SELECT_LANGUAGE', payload: { language: 'en' } });
    useSurveyStore.getState().send({ type: 'SKIP_TUTORIAL' });

    const state = useSurveyStore.getState();
    expect(state.currentState).toBe('MIC_PERMISSION');
  });

  test('Should transition from MIC_PERMISSION to QUESTION_READING when microphone is granted', () => {
    useSurveyStore.getState().initializeSurvey('survey-123', 'q-1');
    useSurveyStore.getState().send({ type: 'START_SURVEY' });
    useSurveyStore.getState().send({ type: 'SELECT_LANGUAGE', payload: { language: 'en' } });
    useSurveyStore.getState().send({ type: 'SKIP_TUTORIAL' });
    useSurveyStore.getState().send({ type: 'RESOLVE_MIC', payload: { granted: true } });

    const state = useSurveyStore.getState();
    expect(state.currentState).toBe('QUESTION_READING');
    expect(state.microphoneGranted).toBe(true);
  });

  test('Should reject invalid transitions and remain in current state', () => {
    // Attempting to go directly from IDLE to PROCESSING
    useSurveyStore.getState().send({ type: 'FINISH_LISTENING' });

    const state = useSurveyStore.getState();
    expect(state.currentState).toBe('IDLE'); // Unchanged
  });

  test('Should handle pause and resume flow returning to correct prior state', () => {
    // Setup state in LISTENING
    useSurveyStore.getState().initializeSurvey('survey-123', 'q-1');
    useSurveyStore.getState().send({ type: 'START_SURVEY' });
    useSurveyStore.getState().send({ type: 'SELECT_LANGUAGE', payload: { language: 'en' } });
    useSurveyStore.getState().send({ type: 'SKIP_TUTORIAL' });
    useSurveyStore.getState().send({ type: 'RESOLVE_MIC', payload: { granted: true } });
    useSurveyStore.getState().send({ type: 'FINISH_READING' });

    expect(useSurveyStore.getState().currentState).toBe('LISTENING');

    // Trigger Pause
    useSurveyStore.getState().send({ type: 'TRIGGER_PAUSE' });
    expect(useSurveyStore.getState().currentState).toBe('PAUSED');
    expect(useSurveyStore.getState().pausedReturnState).toBe('LISTENING');

    // Trigger Resume
    useSurveyStore.getState().send({ type: 'TRIGGER_RESUME' });
    expect(useSurveyStore.getState().currentState).toBe('LISTENING');
    expect(useSurveyStore.getState().pausedReturnState).toBeNull();
  });

  test('Should trigger RECOVERY state if speech confidence is low', () => {
    // Setup state in PROCESSING
    useSurveyStore.getState().initializeSurvey('survey-123', 'q-1');
    useSurveyStore.getState().send({ type: 'START_SURVEY' });
    useSurveyStore.getState().send({ type: 'SELECT_LANGUAGE', payload: { language: 'en' } });
    useSurveyStore.getState().send({ type: 'SKIP_TUTORIAL' });
    useSurveyStore.getState().send({ type: 'RESOLVE_MIC', payload: { granted: true } });
    useSurveyStore.getState().send({ type: 'FINISH_READING' });
    useSurveyStore.getState().send({ type: 'FINISH_LISTENING' });

    expect(useSurveyStore.getState().currentState).toBe('PROCESSING');

    // Resolve with low confidence (0.65)
    useSurveyStore.getState().send({
      type: 'RESOLVE_TRANSCRIPTION',
      payload: { transcript: 'cane', confidence: 0.65 },
    });

    expect(useSurveyStore.getState().currentState).toBe('RECOVERY');
    expect(useSurveyStore.getState().transcriptionConfidence).toBe(0.65);
  });

  test('Should handle permission denied, retry, and transition to assisted mode', () => {
    useSurveyStore.getState().initializeSurvey('survey-123', 'q-1');
    useSurveyStore.getState().send({ type: 'START_SURVEY' });
    useSurveyStore.getState().send({ type: 'SELECT_LANGUAGE', payload: { language: 'en' } });
    useSurveyStore.getState().send({ type: 'SKIP_TUTORIAL' });

    // 1. Permission Denied
    useSurveyStore.getState().send({ type: 'RESOLVE_MIC', payload: { granted: false } });
    expect(useSurveyStore.getState().currentState).toBe('PERMISSION_DENIED');
    expect(useSurveyStore.getState().microphoneGranted).toBe(false);

    // 2. Retry Mic
    useSurveyStore.getState().send({ type: 'RETRY_MIC' });
    expect(useSurveyStore.getState().currentState).toBe('MIC_PERMISSION');

    // 3. Deny again, choose assisted mode
    useSurveyStore.getState().send({ type: 'RESOLVE_MIC', payload: { granted: false } });
    useSurveyStore.getState().send({ type: 'CHOOSE_ASSISTED' });
    expect(useSurveyStore.getState().currentState).toBe('ASSISTED_MODE');

    // 4. Start survey flow from Assisted Mode
    useSurveyStore.getState().send({ type: 'START_QUESTIONS' });
    expect(useSurveyStore.getState().currentState).toBe('QUESTION_READING');
  });

  test('Should trigger manual response from reading and handle manual submission', () => {
    useSurveyStore.getState().initializeSurvey('survey-123', 'q-1');
    useSurveyStore.getState().send({ type: 'START_SURVEY' });
    useSurveyStore.getState().send({ type: 'SELECT_LANGUAGE', payload: { language: 'en' } });
    useSurveyStore.getState().send({ type: 'SKIP_TUTORIAL' });
    useSurveyStore.getState().send({ type: 'RESOLVE_MIC', payload: { granted: true } });

    expect(useSurveyStore.getState().currentState).toBe('QUESTION_READING');

    // Trigger Manual Input
    useSurveyStore.getState().send({ type: 'TRIGGER_MANUAL' });
    expect(useSurveyStore.getState().currentState).toBe('MANUAL_RESPONSE');

    // Submit Manual Answer
    useSurveyStore.getState().send({
      type: 'SUBMIT_MANUAL',
      payload: { hasNextQuestion: true, nextQuestionId: 'q-2' }
    });
    expect(useSurveyStore.getState().currentState).toBe('QUESTION_READING');
    expect(useSurveyStore.getState().currentQuestionId).toBe('q-2');
  });

  test('Should handle go back event and update question reference', () => {
    useSurveyStore.getState().initializeSurvey('survey-123', 'q-2');
    useSurveyStore.getState().send({ type: 'START_SURVEY' });
    useSurveyStore.getState().send({ type: 'SELECT_LANGUAGE', payload: { language: 'en' } });
    useSurveyStore.getState().send({ type: 'SKIP_TUTORIAL' });
    useSurveyStore.getState().send({ type: 'RESOLVE_MIC', payload: { granted: true } });

    expect(useSurveyStore.getState().currentQuestionId).toBe('q-2');

    // Go Back to q-1
    useSurveyStore.getState().send({ type: 'GO_BACK', payload: { previousQuestionId: 'q-1' } });
    expect(useSurveyStore.getState().currentState).toBe('QUESTION_READING');
    expect(useSurveyStore.getState().currentQuestionId).toBe('q-1');
  });
});
