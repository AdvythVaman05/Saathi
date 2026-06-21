import { getNextQuestionId } from '../src/features/survey-engine/routing/router';
import { validateAnswer } from '../src/features/survey-engine/validators/validator';
import { calculateProgress, isSurveyComplete } from '../src/features/survey-engine/selectors/progress';
import { QuestionDefinition } from '../src/features/survey-engine/models/types';

const mockQuestions: QuestionDefinition[] = [
  {
    id: 'q1',
    survey_id: 'survey-1',
    order: 1,
    question_text: { en: 'Do you own a guide dog?' },
    question_type: 'boolean',
    required: true,
    routing_rules: [
      {
        next_question_id: 'q3',
        conditions: [{ value_equals: 'false' }], // If No, skip Q2 (dog type)
      },
    ],
  },
  {
    id: 'q2',
    survey_id: 'survey-1',
    order: 2,
    question_text: { en: 'What breed is your guide dog?' },
    question_type: 'single_choice',
    options: [
      { id: 'opt1', text: { en: 'Labrador' } },
      { id: 'opt2', text: { en: 'Golden Retriever' } },
    ],
    required: true,
  },
  {
    id: 'q3',
    survey_id: 'survey-1',
    order: 3,
    question_text: { en: 'Provide additional feedback' },
    question_type: 'text',
    required: false,
  },
];

describe('Saathi Survey Engine Core Unit Tests', () => {
  
  describe('Routing & Skip Logic Engine', () => {
    test('Should route sequentially if no conditional logic matches', () => {
      const nextId = getNextQuestionId(mockQuestions[0], mockQuestions, true); // True value doesn't skip
      expect(nextId).toBe('q2');
    });

    test('Should trigger skip rules and jump to q3 if boolean is false', () => {
      const nextId = getNextQuestionId(mockQuestions[0], mockQuestions, false); // False value triggers rule
      expect(nextId).toBe('q3');
    });

    test('Should return null signaling completion on final question index', () => {
      const nextId = getNextQuestionId(mockQuestions[2], mockQuestions, 'some text feedback');
      expect(nextId).toBeNull();
    });
  });

  describe('Answer Validation Services', () => {
    test('Should fail validation if required fields are omitted', () => {
      const result = validateAnswer(mockQuestions[0], null);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('This question is required.');
    });

    test('Should approve required fields if populated', () => {
      const result = validateAnswer(mockQuestions[0], true);
      expect(result.isValid).toBe(true);
    });

    test('Should validate single_choice IDs successfully', () => {
      const result = validateAnswer(mockQuestions[1], 'opt1');
      expect(result.isValid).toBe(true);
    });

    test('Should reject invalid single_choice IDs', () => {
      const result = validateAnswer(mockQuestions[1], 'opt999');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid option selected.');
    });

    test('Should pass non-required fields if left empty', () => {
      const result = validateAnswer(mockQuestions[2], null); // Q3 is not required
      expect(result.isValid).toBe(true);
    });
  });

  describe('Progress Calculation & Completion Selectors', () => {
    test('Should calculate current progress metrics correctly', () => {
      const progress = calculateProgress('q2', mockQuestions);
      expect(progress.currentQuestionIndex).toBe(2);
      expect(progress.totalQuestions).toBe(3);
      expect(progress.progressPercentage).toBe(67); // 2/3 = 66.67% -> 67%
    });

    test('Should calculate progress as 0% if current question ID is invalid', () => {
      const progress = calculateProgress(null, mockQuestions);
      expect(progress.progressPercentage).toBe(0);
    });

    test('Should correctly detect survey completion', () => {
      expect(isSurveyComplete(null)).toBe(true);
      expect(isSurveyComplete('q3')).toBe(false);
    });
  });
});
