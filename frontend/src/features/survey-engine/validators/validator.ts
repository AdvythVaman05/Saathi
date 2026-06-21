import { QuestionDefinition } from '../models/types';

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validate answer structure based on question definitions and constraints.
 */
export function validateAnswer(question: QuestionDefinition, value: unknown): ValidationResult {
  // 1. Check requirement constraint
  if (question.required && (value === undefined || value === null || value === '')) {
    return { isValid: false, error: 'This question is required.' };
  }

  // If not required and empty, skip further type checks
  if (!question.required && (value === undefined || value === null || value === '')) {
    return { isValid: true };
  }

  const type = question.question_type;

  switch (type) {
    case 'single_choice': {
      const validIds = (question.options || []).map((o) => o.id);
      const val = Array.isArray(value) ? value[0] : value;
      if (typeof val !== 'string' || !validIds.includes(val)) {
        return { isValid: false, error: 'Invalid option selected.' };
      }
      return { isValid: true };
    }

    case 'multi_choice': {
      if (!Array.isArray(value)) {
        return { isValid: false, error: 'Multi-choice values must be an array.' };
      }
      const validIds = (question.options || []).map((o) => o.id);
      const allValid = value.every((val) => typeof val === 'string' && validIds.includes(val));
      if (!allValid) {
        return { isValid: false, error: 'One or more invalid options selected.' };
      }
      return { isValid: true };
    }

    case 'text':
    case 'audio_response': {
      if (typeof value !== 'string' || value.trim() === '') {
        return { isValid: false, error: 'Input must be a valid text value.' };
      }
      return { isValid: true };
    }

    case 'scale': {
      const num = Number(value);
      if (isNaN(num)) {
        return { isValid: false, error: 'Value must be a number.' };
      }
      return { isValid: true };
    }

    case 'boolean': {
      if (typeof value !== 'boolean') {
        return { isValid: false, error: 'Value must be true or false.' };
      }
      return { isValid: true };
    }

    case 'ranking': {
      if (!Array.isArray(value)) {
        return { isValid: false, error: 'Ranking value must be an array.' };
      }
      const validIds = (question.options || []).map((o) => o.id);
      if (value.length !== validIds.length) {
        return { isValid: false, error: 'Must rank all available options.' };
      }
      const allValid = value.every((val) => typeof val === 'string' && validIds.includes(val));
      if (!allValid) {
        return { isValid: false, error: 'One or more ranked options are invalid.' };
      }
      return { isValid: true };
    }

    case 'matrix': {
      if (typeof value !== 'object' || value === null) {
        return { isValid: false, error: 'Matrix selections must be mapped in an object.' };
      }
      const rowIds = (question.matrix_rows || []).map((r) => r.id);
      const colIds = (question.options || []).map((o) => o.id);
      
      const payloadKeys = Object.keys(value);
      // Ensure all rows are answered
      const allRowsAnswered = rowIds.every((r) => payloadKeys.includes(r));
      if (!allRowsAnswered) {
        return { isValid: false, error: 'All rows in the matrix grid must be answered.' };
      }

      // Ensure all columns exist
      const allColsValid = Object.values(value).every(
        (c) => typeof c === 'string' && colIds.includes(c)
      );
      if (!allColsValid) {
        return { isValid: false, error: 'One or more grid selections are invalid.' };
      }

      return { isValid: true };
    }

    case 'date': {
      if (typeof value !== 'string' || isNaN(Date.parse(value))) {
        return { isValid: false, error: 'Invalid date format.' };
      }
      return { isValid: true };
    }

    case 'time': {
      const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
      if (typeof value !== 'string' || !timeRegex.test(value)) {
        return { isValid: false, error: 'Time must be in 24-hour format: HH:MM.' };
      }
      return { isValid: true };
    }

    default:
      return { isValid: false, error: 'Unsupported question type.' };
  }
}
