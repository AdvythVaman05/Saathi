# Changelog

## [1.4.0] - 2026-06-21

### Added
- **Configurable Groq Model:**
  - Loaded `GROQ_WHISPER_MODEL` from environment variables, defaulting to `whisper-large-v3`.
  - Configured all server-side transcription requests to utilize the user-configured model name.
  - Documented `GROQ_WHISPER_MODEL` in `DEPLOYMENT.md`, `.env.production.example`, and `.env.example`.
- **Supabase Row Level Security (RLS) Separation:**
  - Decoupled RLS policies completely from Django migrations.
  - Created `supabase/rls_policies.sql` containing RLS statements, policy definitions, and verification queries.
  - Created `supabase/README.md` with accompanying documentation detailing when to execute RLS, verification queries, and rollback blocks.
  - Linked Supabase RLS documentation within `DEPLOYMENT.md`.

### Changed
- **Dependency Audit & Cleanup:**
  - Audited the `websockets` library. Replaced module-level `import websockets` with a dynamic local import inside `OpenAiRealtimeProxy.connect` to prevent ASGI/Daphne startup crashes when the library is not installed.
  - Confirmed the library is not required in `requirements.txt` and cleaned up the import pipeline for all active REST runtime code.
- **ASGI Initialization Blocker Fixed:**
  - Refactored `config/asgi.py` to ensure `get_asgi_application()` initializes the Django app registry before any application-specific routing or consumers are imported, preventing `AppRegistryNotReady` startup crashes under Daphne.

## [1.3.0] - 2026-06-21

### Added
- **Production Hardening & Security:**
  - Implemented session format validation (UUID) and database active check (async) inside the WebSocket consumer `consumers.py`, closing unauthorized connections with `4403`.
  - Configured Django settings to pull whitelisted CORS origins, allowed hosts, and CSRF trusted origins dynamically from environment variables.
  - Enabled HTTPS security parameters (`SESSION_COOKIE_SECURE`, `CSRF_COOKIE_SECURE`, `SECURE_BROWSER_XSS_FILTER`, `SECURE_CONTENT_TYPE_NOSNIFF`, `X_FRAME_OPTIONS`, `SECURE_SSL_REDIRECT`) and whitelisted the proxy header `HTTP_X_FORWARDED_PROTO` for cloud SSL termination.
  - Implemented REST throttling via custom throttle classes limiting the Survey APIs to `120 reqs/min` and Telemetry APIs to `1000 reqs/min`.
  - Implemented structured JSON console logging for all backend servers using a custom `JsonFormatter` class.
- **Frontend Telemetry & Health Checks:**
  - Built `telemetry.ts` globally intercepting window errors, promise rejections, and custom event logs (VAD calibration failures, sync retries, WebSocket disconnects) and posting sanitized payloads to `/api/responses/telemetry/`.
  - Developed Django liveness (`/health`) and readiness (`/ready`) views validating DB cursors, Channels layers, and OpenAI outbound pings.
- **Deployment & Readiness Documents:**
  - Created `DEPLOYMENT.md`, `SECURITY_REVIEW.md`, `RELEASE_CHECKLIST.md`, and `PERFORMANCE_REPORT.md` documenting stacking configs, benchmarks, and variables.
  - Wrote `.env.production.example`.

## [1.2.0] - 2026-06-21

### Added
- **Accessibility Validation Phase:**
  - Designed a 12-point accessibility checklist covering keyboard traversal, screen reader support, self-guided/assisted modes, permission denied loops, network failure, high contrast settings, 200% zoom, and reduced motion settings.
  - Configured Playwright and Axe-playwright automated testing suites.
  - Installed Chromium browser binaries and FFmpeg dependencies for automated browser test runners.
  - Created a Playwright config file (`playwright.config.ts`) to manage dynamic server startup (`npm run start`) and teardown.
  - Executed and passed automated Axe contrast audits (WCAG 2.2 AAA target), keyboard outlines visibility checks, and prefers-reduced-motion media query overrides.
  - Authored a comprehensive `ACCESSIBILITY_REPORT.md` report documenting simulated testing and recoverability details for Scenarios A-G.
  - Generated a premium high-contrast UI mockup and embedded it in the report.
- **Experience Completion Phase (VAD & Offline Sync):**
  - Upgraded Dexie local database schema to version 2 (`db.ts`) adding `created_at` timestamp index to `answers` table.
  - Created chronological offline synchronizer (`syncOfflineAnswers` in `syncer.ts`) using `created_at` ordering (not question IDs), with in-memory lock deduplication to prevent duplicate submissions.
  - Implemented local client-side voice activity detection (`WebAudioVad` in `vad.ts`) using RMS energy and adaptive background noise estimation.
  - Added a 2-second initial noise floor calibration (`calibration.ts`) with a conservative default fallback (`0.01` floor, `0.025` threshold) on failure/invalid values to keep the survey usable.
  - Implemented a 120-second watchdog timer (`maxListeningDurationMs`) in `page.tsx` transitioning the FSM directly from `LISTENING` to `PROCESSING` to prevent stuck listening states.
  - Integrated 2.0s pause tolerance (`silenceDurationMs = 2000`) for slow speakers with long pauses (Scenario H).
  - Created automated Jest unit tests verifying Scenario H pause tolerance and watchdog properties. All 60 test cases pass.
  - Formulated the hands-free validation report (`HANDS_FREE_VALIDATION_REPORT.md`) verifying Scenario H.

### Fixed
- **Next.js Compilation & Build Errors:**
  - Removed duplicate url-encoded routing directory `%5Bid%5D` which conflicted with Next.js dynamic routing.
  - Integrated `questionResolver` and resolved TypeScript compiler issues in `frontend/src/app/survey/[id]/page.tsx`.
  - Resolved `React.cloneElement` strict type constraints inside `frontend/src/components/ui/FormField.tsx` by casting to `React.ReactElement<any>`.
  - Resolved dictionary lookup signature type mismatch inside `frontend/src/features/localization/question-localization/resolver.ts` to cleanly handle optional language keys.

## [1.1.0] - 2026-06-20

### Added
- Completed the First End-to-End Survey Flow:
  - Developed custom Next.js components for every state machine screen inside `frontend/src/components/survey/SurveyScreens.tsx` (Language Selection, Tutorial Mode Selection, Mic Permission, Permission Denied, Assisted Mode splash, Active Question Layout, Help Screen, Paused Screen, Survey Completed Screen).
  - Integrated dynamic language options loading dynamically from `LANGUAGE_REGISTRY` to support all registered regional languages.
  - Implemented the `PERMISSION_DENIED` FSM state enabling mic retry loops and manual Assisted Mode fallbacks.
  - Developed the `MANUAL_RESPONSE` keyboard-accessible, screen-reader optimized, and multilingual fallback path.
  - Developed the multilingual voice answer parser (`voiceParser.ts`) converting speech transcripts to values for `single_choice`, `multi_choice`, `text`, `scale`, and `boolean` question types.
  - Integrated hooks (`useSpeechSynthesis` and `useSpeechRecognition`) to coordinate reading questions, listening, processing answers, and speaking confirmations.
- Completed Secure Server-Side OpenAI Realtime Proxy Relay:
  - Created `openai_relay.py` in the Django backend implementing an async proxy connection to `wss://api.openai.com/v1/realtime` for STT transcriptions and `AsyncOpenAI` client for secure TTS synthesis.
  - Updated `SpeechConsumer` in `consumers.py` to route binary streams and synthesis requests securely, ensuring that `OPENAI_API_KEY` remains server-side only.
- Added extensive Jest test coverage:
  - Wrote FSM transition tests verifying permission denied retry loops, assisted mode redirects, and manual entries in `surveyStore.test.ts`.
  - Wrote transcript conversion parser tests in `voiceParser.test.ts` verifying English, Hindi, and Telugu matching.
  - All 5 test suites (50 tests total) passed successfully.

## [1.0.0] - 2026-06-20

### Added
- Completed Backend Integration Layer using Django 5, DRF, and Supabase compatible specifications:
  - Configured PostgreSQL DDL models for `User`, `AccessibilityPreferences`, `Survey`, `Question`, `Session`, `SessionAnswer`, and `AuditLog` using UUID primary keys.
  - Successfully generated initial Django database migrations (`0001_initial.py` for `users`, `surveys`, `responses`).
  - Added REST serializer classes validating complex nested JSONB survey options and branching skip logic.
  - Built views and custom collection actions implementing API contracts for start, resume, pause, and end routes.
  - Resolved Python dependencies by installing packages from `requirements.txt` into the virtual environment using the `uv` tool.
  - Updated preferences endpoints routing to bind headers `X-User-ID` directly to profile configuration mappings.
- Completed Realtime Transport Layer:
  - Configured Django Channels and ASGI transport infrastructure in `backend/config/asgi.py`.
  - Implemented `SpeechConsumer` WebSocket consumer in `backend/apps/speech/consumers.py` to route events, manage connection handshakes, and forward binary audio packets.
  - Built `RealtimeConnectionManager` in `backend/apps/speech/connection_manager.py` to monitor heartbeat checks and detect stale connection timeouts (15s threshold).
  - Built `RealtimeSessionManager` in `backend/apps/speech/session_manager.py` to manage connection states and implement packet recovery buffer queues (capped at 200 packets) for reconnection.
  - Defined transport event payloads and contracts in `backend/apps/speech/transport_events.py`.
  - Registered ASGI socket routing to `/ws/speech/` in `routing.py` and hook it to `config/asgi.py`.
  - Added backend unit tests in `backend/tests/test_transport.py` verifying disconnect recovery, reconnect handling, stale session cleanup, and heartbeat validation. All tests compiled and passed successfully.
- Completed Voice Provider Adapters & Audio Pipeline:
  - Designed and implemented a shared Audio Pipeline consisting of `AudioCaptureService` (singleton microphone context, listener subscriber routing), `Resampler` (linear resample logic downsampling Float32 streams), and `PCMEncoder` (converting Float32 to 16-bit linear PCM and building big-endian headers for sequence metadata).
  - Implemented transport sequence identifiers on audio packet streams (`sequenceId`, `timestamp`, `payload`) and sorted them by sequence ID in the backend session recovery manager.
  - Implemented concrete, interchangeable provider adapters for OpenAI Realtime (`openai.ts`), Azure Speech REST (`azure.ts`), and Browser Speech API (`browser.ts`) conforming to `SpeechRecognitionProvider` and `SpeechSynthesisProvider`.
  - Documented Browser Speech API as a best-effort, lower-confidence fallback with lower language consistency.
  - Configured auto-registration inside `providers/registry.ts`.
  - Added unit/integration tests inside `frontend/tests/voiceEngine.test.ts` verifying all pipeline functions, packet structures, and mock/concrete adapter states.
## [Unreleased]
- Pre-GitHub hardening completed.
