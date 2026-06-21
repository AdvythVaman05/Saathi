export type AnalyticsEventType =
  | 'SURVEY_STARTED'
  | 'QUESTION_ASKED'
  | 'ANSWER_RECEIVED'
  | 'ANSWER_CONFIRMED'
  | 'RECOGNITION_FAILED'
  | 'LANGUAGE_CHANGED'
  | 'SURVEY_COMPLETED'
  | 'SURVEY_PAUSED'
  | 'SURVEY_RESUMED'
  | 'SESSION_RECOVERED';

export interface AnalyticsEvent {
  eventType: AnalyticsEventType;
  sessionId: string;
  timestamp: string; // ISO 8601 string
  payload?: Record<string, unknown>;
}

/**
 * Centrally construct an analytics event record
 */
export function createAnalyticsEvent(
  type: AnalyticsEventType,
  sessionId: string,
  payload?: Record<string, unknown>
): AnalyticsEvent {
  return {
    eventType: type,
    sessionId,
    timestamp: new Date().toISOString(),
    payload: payload || {},
  };
}
