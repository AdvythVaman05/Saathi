import { parseVoiceAnswer } from '../src/features/survey-engine/voiceParser';
import { QuestionDefinition } from '../src/features/survey-engine/models/types';

describe('Voice Answer Parser Unit Tests', () => {
  const mockBooleanQuestion: QuestionDefinition = {
    id: 'q-bool',
    survey_id: 'survey-1',
    order: 1,
    question_type: 'boolean',
    required: true,
    question_text: { en: 'Boolean question' },
  };

  const mockScaleQuestion: QuestionDefinition = {
    id: 'q-scale',
    survey_id: 'survey-1',
    order: 2,
    question_type: 'scale',
    required: true,
    question_text: { en: 'Scale question' },
  };

  const mockChoiceQuestion: QuestionDefinition = {
    id: 'q-choice',
    survey_id: 'survey-1',
    order: 3,
    question_type: 'single_choice',
    required: true,
    question_text: { en: 'Choice question' },
    options: [
      { id: 'opt_a', text: { en: 'Screen Reader', hi: 'स्क्रीन रीडर', te: 'స్క్రీన్ రీడర్' } },
      { id: 'opt_b', text: { en: 'Keyboard Only', hi: 'केवल कीबोर्ड', te: 'కీబోర్డ్ మాత్రమే' } },
    ],
  };

  test('Should parse English, Hindi, and Telugu Yes/No into booleans', () => {
    // English
    expect(parseVoiceAnswer(mockBooleanQuestion, 'Yes, absolutely', 'en').value).toBe(true);
    expect(parseVoiceAnswer(mockBooleanQuestion, 'No, not really', 'en').value).toBe(false);

    // Hindi
    expect(parseVoiceAnswer(mockBooleanQuestion, 'हाँ, मुझे पता है', 'hi').value).toBe(true);
    expect(parseVoiceAnswer(mockBooleanQuestion, 'नहींजी', 'hi').value).toBe(false);

    // Telugu
    expect(parseVoiceAnswer(mockBooleanQuestion, 'అవును', 'te').value).toBe(true);
    expect(parseVoiceAnswer(mockBooleanQuestion, 'కాదు', 'te').value).toBe(false);
  });

  test('Should parse ratings and numbers 1-5 across languages', () => {
    // English words / digits
    expect(parseVoiceAnswer(mockScaleQuestion, 'I rate it four', 'en').value).toBe(4);
    expect(parseVoiceAnswer(mockScaleQuestion, 'Rating 5', 'en').value).toBe(5);

    // Hindi numbers
    expect(parseVoiceAnswer(mockScaleQuestion, 'तीन', 'hi').value).toBe(3);

    // Telugu numbers
    expect(parseVoiceAnswer(mockScaleQuestion, 'రెండు', 'te').value).toBe(2);
  });

  test('Should parse choice options by text or positional index', () => {
    // Direct text match
    expect(parseVoiceAnswer(mockChoiceQuestion, 'I use screen reader', 'en').value).toBe('opt_a');
    expect(parseVoiceAnswer(mockChoiceQuestion, 'केवल कीबोर्ड', 'hi').value).toBe('opt_b');

    // Positional matches
    expect(parseVoiceAnswer(mockChoiceQuestion, 'Choose option 1', 'en').value).toBe('opt_a');
    expect(parseVoiceAnswer(mockChoiceQuestion, 'पहला विकल्प', 'hi').value).toBe('opt_a');
    expect(parseVoiceAnswer(mockChoiceQuestion, 'రెండవ', 'te').value).toBe('opt_b');
  });

  test('Should pass through text responses directly', () => {
    const mockTextQuestion: QuestionDefinition = {
      id: 'q-text',
      survey_id: 'survey-1',
      order: 4,
      question_type: 'text',
      required: true,
      question_text: { en: 'Feedback' },
    };

    const transcript = 'This application is very accessible and easy to navigate.';
    const parsed = parseVoiceAnswer(mockTextQuestion, transcript, 'en');
    expect(parsed.value).toBe(transcript);
    expect(parsed.confidence).toBe(0.95);
  });
});
