import Dexie, { type Table } from 'dexie';

export interface LocalSurvey {
  id: string;
  title: string;
  description: string;
  is_active: number; // Indexable boolean equivalent (0 or 1)
  default_language: string;
}

export interface LocalQuestion {
  id: string;
  survey_id: string;
  order: number;
  question_text: string; // JSON string
  question_type: string;
  options?: string; // JSON string
  routing_rules?: string; // JSON string
  required: number; // 0 or 1
}

export interface LocalAnswer {
  id: string;
  session_id: string;
  question_id: string;
  answer_value: string; // JSON string
  is_confirmed: number; // 0 or 1
  confidence_score?: number;
  synced: number; // 0 = pending, 1 = synced
  created_at: number; // unix timestamp for sync ordering
}

export interface LocalPreference {
  id: string;
  user_id: string;
  speech_rate: number;
  speech_volume: number;
  text_scale: number;
  high_contrast: number; // 0 or 1
  reduced_motion: number; // 0 or 1
  preferred_voice: string;
  preferred_language: string;
}

class SaathiLocalDatabase extends Dexie {
  surveys!: Table<LocalSurvey, string>;
  questions!: Table<LocalQuestion, string>;
  answers!: Table<LocalAnswer, string>;
  preferences!: Table<LocalPreference, string>;

  constructor() {
    super('SaathiLocalDatabase');
    this.version(2).stores({
      surveys: 'id, is_active',
      questions: 'id, survey_id, [survey_id+order]',
      answers: 'id, session_id, question_id, synced, created_at',
      preferences: 'id, user_id',
    });
  }
}

export const db = new SaathiLocalDatabase();
export default db;
