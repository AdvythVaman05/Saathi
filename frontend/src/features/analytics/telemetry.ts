import { api } from '../../services/api';

export interface TelemetryPayload {
  session: string; // Session UUID
  action: string;  // Event label
  payload: Record<string, unknown>; // Metadata parameters
}

class TelemetryTracker {
  private sessionId: string | null = null;
  private isInitialized = false;

  init(sessionId: string) {
    if (this.isInitialized) {
      this.sessionId = sessionId;
      return;
    }
    this.sessionId = sessionId;
    this.setupListeners();
    this.isInitialized = true;
  }

  setSessionId(sessionId: string) {
    this.sessionId = sessionId;
  }

  private setupListeners() {
    if (typeof window === 'undefined') return;

    // 1. Capture Uncaught Runtime Exceptions
    window.addEventListener('error', (event) => {
      this.trackEvent('RUNTIME_ERROR', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error_name: event.error?.name || 'Error',
      });
    });

    // 2. Capture Unhandled Promise Rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.trackEvent('PROMISE_REJECTION', {
        reason: String(event.reason?.message || event.reason),
        error_name: event.reason?.name || 'PromiseRejection',
      });
    });

    // 3. Catch custom Saathi telemetry errors (VAD failures, WebSocket errors, Sync failures)
    window.addEventListener('saathi-telemetry-error', (event: Event) => {
      const customEvent = event as CustomEvent;
      const { category, message, code } = customEvent.detail || {};
      this.trackEvent('TELEMETRY_ERROR', {
        category,
        message,
        code
      });
    });

    // 4. Capture Provider Failovers
    window.addEventListener('saathi-provider-fallback', (event: Event) => {
      const customEvent = event as CustomEvent;
      const { from, to, error } = customEvent.detail || {};
      this.trackEvent('PROVIDER_FAILOVER', {
        source_provider: from,
        target_provider: to,
        error_message: error || 'Triggered failover'
      });
    });

    // 5. Capture State Machine transitions (without answers)
    window.addEventListener('saathi-fsm-transition', (event: Event) => {
      const customEvent = event as CustomEvent;
      const { from, to } = customEvent.detail || {};
      this.trackEvent('FSM_TRANSITION', {
        state_from: from,
        state_to: to
      });
    });
  }

  /**
   * Tracks an event by posting to REST backend API
   */
  async trackEvent(action: string, payload: Record<string, unknown> = {}) {
    const session = this.sessionId || (typeof window !== 'undefined' ? localStorage.getItem('saathi_active_session_id') : null);
    if (!session) {
      return;
    }

    // Enforce strict privacy whitelist. Never send transcripts, answers, preferences, or PII.
    const cleanPayload: Record<string, unknown> = {};
    const safeKeys = [
      'message', 'error_name', 'filename', 'lineno', 'colno', 'reason',
      'source_provider', 'target_provider', 'error_message',
      'category', 'code', 'latency_ms', 'state_from', 'state_to'
    ];

    for (const key of safeKeys) {
      if (payload[key] !== undefined) {
        cleanPayload[key] = payload[key];
      }
    }

    // Always include a timestamp in milliseconds
    cleanPayload['timestamp'] = new Date().toISOString();

    const telemetryData: TelemetryPayload = {
      session,
      action,
      payload: cleanPayload
    };

    try {
      await api.post('/api/responses/telemetry/', telemetryData, {
        'X-Session-ID': session
      });
    } catch (err) {
      console.warn('Failed to send telemetry event:', err);
    }
  }
}

export const telemetry = new TelemetryTracker();
export default telemetry;
