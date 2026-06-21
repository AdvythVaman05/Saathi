# Saathi - Pilot Release & Pre-Deployment Checklist

This checklist defines the pilot release criteria, testing verifications, and deployment configurations required to sign off on the pilot launch of the Saathi Survey Companion.

---

## 1. Quality & Testing Verifications

### 1.1 Frontend Unit Tests (Jest)
- **Status:** **PASS** (60/60 tests completed successfully)
- **Verified Areas:**
  - Survey state machine transition matrices (retry loops, paused, recovery, manual responses).
  - Multilingual translation resolver fallbacks and Hinglish code-switching parser.
  - VAD dynamic noise floor settings, Scenario H slow-speaker pause tolerance, and watchdog timers.
  - Chronological IndexedDB synchronizer sorting and concurrent locks.

### 1.2 Backend Unit Tests (Django Test Runner)
- **Status:** **PASS** (4/4 ASGI transport test cases completed successfully)
- **Verified Areas:**
  - `RealtimeConnectionManager` heartbeat validation and stale connection sweeping.
  - `RealtimeSessionManager` in-memory packet recovery queue buffers (max 200 packets) and stale session sweepers.

### 1.3 Accessibility Regression Audits (Playwright & Axe-Core)
- **Status:** **PASS** (3/3 Axe accessibility integration tests completed successfully)
- **Verified Areas:**
  - **WCAG 2.2 AAA Contrast Audits:** Contrast validation on all standard and high-contrast card elements.
  - **Keyboard Outlines:** Focus ring visibility checks on all interactive elements.
  - **Prefers-Reduced-Motion:** Transition animations disabled correctly via custom hooks when requested by OS settings.
  - **Screen Reader Announcer:** Live announcement validation on FSM transitions, permission changes, and chimes cues.

---

## 2. Deployment Readiness Checklist

- [x] **Database Schemas:** Supabase migrations are fully generated, and database tables are ready.
- [x] **Row Level Security (RLS):** Supabase table DDL contains RLS policies whitelisting access to session owners via `X-Session-ID` headers.
- [x] **WebSocket Authentication:** Query format validation (UUID) and db session status checks are active inside `consumers.py`. Close code `4403` is correctly issued for unauthorized socket handshakes.
- [x] **API Rate Limits:** Throttles are mapped to `/api/` (120 reqs/min) and `/api/responses/telemetry/` (1000 reqs/min).
- [x] **Outbound Key Isolation:** Frontend client does not contain or request third-party keys. All voice recognition and synthesis traffic is proxied through ASGI Daphne.
- [x] **Telemetry & Privacy:** Global window exception handler and fallback listeners are configured. Whitelisted metadata only; raw answers and transcripts are completely stripped.
- [x] **Liveness & Readiness Probes:** `GET /health` and `GET /ready` endpoints are active, validating DB connectivity, channel layers, and OpenAI connectivity.
- [x] **Structured Logging:** Output logs are formatted as JSON object strings for console streams in production.

---

## 3. Production Environment Variables Sign-off

Verify that the following variables are configured in Vercel, Railway, and Supabase dashboards before deployment:

### 3.1 Backend Variables (Railway)
- [ ] `DATABASE_URL` (Supabase Transaction Pooler connection string)
- [ ] `REDIS_URL` (Redis broker connection string)
- [ ] `DJANGO_SECRET_KEY` (Cryptographically secure unique string)
- [ ] `DJANGO_DEBUG` (Explicitly set to `False`)
- [ ] `DJANGO_ALLOWED_HOSTS` (List of whitelisted backend domains)
- [ ] `DJANGO_CORS_ALLOWED_ORIGINS` (List of whitelisted frontend origins)
- [ ] `DJANGO_CSRF_TRUSTED_ORIGINS` (List of whitelisted CSRF domains)
- [ ] `OPENAI_API_KEY` (Outbound server-side OpenAI credential)
- [ ] `AZURE_SPEECH_KEY` (Outbound server-side Azure Speech key)
- [ ] `AZURE_SPEECH_REGION` (Target region, e.g., `eastus`)

### 3.2 Frontend Variables (Vercel)
- [ ] `NEXT_PUBLIC_API_URL` (Host address pointing to the Daphne web service)
