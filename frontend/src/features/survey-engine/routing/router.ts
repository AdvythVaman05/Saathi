import { QuestionDefinition, RoutingRule } from '../models/types';

/**
 * Check if a routing condition is satisfied by the user's answer value.
 */
function isConditionMet(answerValue: unknown, condition: { option_id?: string; value_equals?: string }): boolean {
  // If condition checks selected option ID
  if (condition.option_id) {
    if (Array.isArray(answerValue)) {
      return answerValue.includes(condition.option_id);
    }
    return answerValue === condition.option_id;
  }

  // If condition checks absolute value equivalence
  if (condition.value_equals !== undefined) {
    return String(answerValue).toLowerCase() === condition.value_equals.toLowerCase();
  }

  return false;
}

/**
 * Determine the next question ID based on routing rules and the active answer.
 */
export function getNextQuestionId(
  currentQuestion: QuestionDefinition,
  allQuestions: QuestionDefinition[],
  answerValue: unknown
): string | null {
  const rules = currentQuestion.routing_rules || [];

  for (const rule of rules) {
    // If no conditions, trigger unconditional redirect
    if (!rule.conditions || rule.conditions.length === 0) {
      return rule.next_question_id;
    }

    // Verify if all rule conditions are satisfied (AND operation)
    const allConditionsMet = rule.conditions.every((cond) => isConditionMet(answerValue, cond));
    if (allConditionsMet) {
      return rule.next_question_id;
    }
  }

  // Fallback to sequential question traversal if no rules match
  const currentIndex = allQuestions.findIndex((q) => q.id === currentQuestion.id);
  if (currentIndex !== -1 && currentIndex < allQuestions.length - 1) {
    return allQuestions[currentIndex + 1].id;
  }

  return null; // Signals completion (no more questions left)
}
