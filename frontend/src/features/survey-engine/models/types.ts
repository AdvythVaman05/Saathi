export type QuestionType =
  | 'single_choice'
  | 'multi_choice'
  | 'text'
  | 'scale'
  | 'boolean'
  | 'ranking'
  | 'matrix'
  | 'date'
  | 'time'
  | 'audio_response';

export interface TranslationText {
  en: string;
  hi?: string;
  te?: string;
  es?: string;
  [key: string]: string | undefined;
}

export interface ChoiceOption {
  id: string;
  text: TranslationText;
}

export interface RoutingCondition {
  option_id?: string; // If option selected
  value_equals?: string; // If text/scale matches value
}

export interface RoutingRule {
  next_question_id: string;
  conditions?: RoutingCondition[];
}

export interface QuestionDefinition {
  id: string;
  survey_id: string;
  order: number;
  question_text: TranslationText;
  question_type: QuestionType;
  options?: ChoiceOption[]; // Relevant for single/multi/ranking/matrix
  matrix_rows?: ChoiceOption[]; // Relevant for matrix grid rows
  routing_rules?: RoutingRule[]; // Branching skip rules
  required: boolean;
}

export interface SurveyDefinition {
  id: string;
  title: TranslationText | string;
  description: TranslationText | string;
  is_active: boolean;
  default_language: string;
  questions: QuestionDefinition[];
}

export interface SessionAnswerPayload {
  session_id: string;
  question_id: string;
  answer_value: unknown; // Structure shifts based on type
  is_confirmed: boolean;
  confidence_score?: number;
}
