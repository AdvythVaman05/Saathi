import { QuestionDefinition } from '../models/types';

export interface ProgressState {
  currentQuestionIndex: number;
  totalQuestions: number;
  progressPercentage: number;
}

/**
 * Calculates the progress states of the active survey.
 */
export function calculateProgress(
  currentQuestionId: string | null,
  allQuestions: QuestionDefinition[]
): ProgressState {
  const total = allQuestions.length;
  if (total === 0 || !currentQuestionId) {
    return { currentQuestionIndex: 0, totalQuestions: total, progressPercentage: 0 };
  }

  const index = allQuestions.findIndex((q) => q.id === currentQuestionId);
  const currentNum = index !== -1 ? index + 1 : 1;
  const percentage = Math.round((currentNum / total) * 100);

  return {
    currentQuestionIndex: currentNum,
    totalQuestions: total,
    progressPercentage: percentage,
  };
}

/**
 * Checks if the survey session is complete (no next question exists).
 */
export function isSurveyComplete(nextQuestionId: string | null): boolean {
  return nextQuestionId === null;
}
