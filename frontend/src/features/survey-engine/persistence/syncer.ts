import { db } from '../../../services/db';
import { api } from '../../../services/api';
import { SurveyDefinition, SessionAnswerPayload } from '../models/types';

/**
 * Loading service to fetch survey definitions from IndexedDB, falling back to backend.
 */
export async function loadSurveyDefinition(surveyId: string): Promise<SurveyDefinition> {
  try {
    // 1. Query local IndexedDB
    const cachedSurvey = await db.surveys.get(surveyId);
    
    if (cachedSurvey) {
      const cachedQuestions = await db.questions
        .where('survey_id')
        .equals(surveyId)
        .sortBy('order');

      return {
        id: cachedSurvey.id,
        title: cachedSurvey.title,
        description: cachedSurvey.description,
        is_active: cachedSurvey.is_active === 1,
        default_language: cachedSurvey.default_language,
        questions: cachedQuestions.map((q) => ({
          id: q.id,
          survey_id: q.survey_id,
          order: q.order,
          question_text: JSON.parse(q.question_text),
          question_type: q.question_type as any,
          options: q.options ? JSON.parse(q.options) : undefined,
          required: q.required === 1,
        })),
      };
    }

    // 2. Fallback to API if not cached locally
    const remoteSurvey = await api.get<SurveyDefinition>(`/api/surveys/list/${surveyId}/`);
    
    // Store in local IndexedDB for future offline loads
    await db.surveys.put({
      id: remoteSurvey.id,
      title: remoteSurvey.title,
      description: remoteSurvey.description,
      is_active: remoteSurvey.is_active ? 1 : 0,
      default_language: remoteSurvey.default_language,
    });

    for (const q of remoteSurvey.questions) {
      await db.questions.put({
        id: q.id,
        survey_id: q.survey_id,
        order: q.order,
        question_text: JSON.stringify(q.question_text),
        question_type: q.question_type,
        options: q.options ? JSON.stringify(q.options) : undefined,
        required: q.required ? 1 : 0,
      });
    }

    return remoteSurvey;
  } catch (err) {
    console.error('Failed to load survey definition:', err);
    throw err;
  }
}

const activeSyncingIds = new Set<string>();

/**
 * Answer persistence service.
 * Stores response in IndexedDB immediately, and asynchronously attempts sync to REST backend.
 */
export async function persistAnswer(payload: SessionAnswerPayload): Promise<void> {
  const localPayload = {
    id: crypto.randomUUID(),
    session_id: payload.session_id,
    question_id: payload.question_id,
    answer_value: JSON.stringify(payload.answer_value),
    is_confirmed: payload.is_confirmed ? 1 : 0,
    confidence_score: payload.confidence_score,
    synced: 0, // Mark as unsynced
    created_at: Date.now(),
  };

  try {
    // 1. Write to IndexedDB
    await db.answers.put(localPayload);

    // 2. Push to Django backend API
    await api.post('/api/responses/answers/', {
      session: payload.session_id,
      question: payload.question_id,
      answer_value: payload.answer_value,
      is_confirmed: payload.is_confirmed,
      confidence_score: payload.confidence_score,
    }, {
      'X-Session-ID': payload.session_id,
    });

    // 3. Mark as synced on success
    await db.answers.update(localPayload.id, { synced: 1 });
  } catch (err) {
    console.warn('Network sync failed. Answer queued locally in IndexedDB.', err);
  }
}

/**
 * Automatic Offline Re-Synchronization service.
 * Loops through unsynced answers chronologically, acquires a lock to prevent duplicates, and retries failed pushes.
 */
export async function syncOfflineAnswers(): Promise<void> {
  if (typeof window !== 'undefined' && !navigator.onLine) {
    return;
  }

  try {
    // Fetch unsynced items sorted chronologically by created_at
    const unsynced = await db.answers.where('synced').equals(0).sortBy('created_at');

    for (const answer of unsynced) {
      if (activeSyncingIds.has(answer.id)) {
        continue; // Deduplicate concurrent sync runs
      }

      activeSyncingIds.add(answer.id);

      try {
        await api.post('/api/responses/answers/', {
          session: answer.session_id,
          question: answer.question_id,
          answer_value: JSON.parse(answer.answer_value),
          is_confirmed: answer.is_confirmed === 1,
          confidence_score: answer.confidence_score,
        }, {
          'X-Session-ID': answer.session_id,
        });

        // Mark as successfully synced
        await db.answers.update(answer.id, { synced: 1 });
      } catch (err: any) {
        console.warn(`Sync failed for answer ${answer.id}, will retry later.`, err);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('saathi-telemetry-error', {
            detail: {
              category: 'OFFLINE_SYNC_FAILED',
              message: err.message || 'Sync retry post failed',
              code: 'SYNC_RETRY_ERROR'
            }
          }));
        }
      } finally {
        activeSyncingIds.delete(answer.id);
      }
    }
  } catch (err) {
    console.error('Offline synchronization failed:', err);
  }
}

/**
 * Completes the survey session.
 */
export async function completeSurveySession(sessionId: string): Promise<void> {
  try {
    await api.post('/api/responses/sessions/end/', { session_id: sessionId });
    localStorage.removeItem('saathi_active_session_id');
  } catch (err) {
    console.warn('Remote complete survey trigger failed.', err);
  }
}
