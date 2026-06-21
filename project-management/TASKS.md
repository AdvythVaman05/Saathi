# Tasks

## Completed

- [x] Technical Architecture Planning
  - [x] Database Schema Design (Supabase DDL with UUID primary keys & user profile preferences link)
  - [x] API Contract definitions (including Accessibility Preferences & Analytics event structure)
  - [x] Zustand Finite State Machine design (documented in [STATE_MACHINE_SPEC.md](file:///d:/Project%20Netra/Saathi/docs/STATE_MACHINE_SPEC.md))
  - [x] Voice Provider Specification (documented in [VOICE_PROVIDER_SPEC.md](file:///d:/Project%20Netra/Saathi/docs/VOICE_PROVIDER_SPEC.md))
  - [x] Folder Structure schema mapping (updated for voice command registry and analytics event types)
  - [x] Design System definition (Atkinson Typography, CSS variables)
  - [x] Accessibility Architecture (ARIA-live status cues, keyboard mapping, multi-lingual English/Hindi/Telugu command maps)
- [x] Repository Scaffolding
  - [x] Initialize Next.js 15 frontend in `frontend/`
  - [x] Initialize Django 5 project in `backend/`
  - [x] Configure environment variables blueprint (`.env.example`)
- [x] Accessibility Layer & Design System Foundation
  - [x] Implement design tokens CSS stylesheet (`tokens.css`) integration
  - [x] Add High Contrast (Dark/Light) theme logic inside `themes.ts`
  - [x] Build global `AccessibilityProvider` with IndexedDB loading and API sync debouncing
  - [x] Build keyboard shortcuts hook (`useKeyboardNavigation`) and focus trap hook (`useFocusTrap`)
  - [x] Create `AudioCueManager` Web Audio synth for chimes alerts
  - [x] Build global screen reader utility (`announcer.ts`) and hidden live regions (`AriaAnnouncer.tsx`)
- [x] Survey State Machine Foundation
  - [x] Build Zustand FSM store (`surveyStore.ts`) enforcing transition matrices
  - [x] Integrate entry/exit actions and transition guards
  - [x] Export state selectors for UI components and Speech engines
  - [x] Write Jest unit tests (`surveyStore.test.ts`) validating normal, paused, recovery, and invalid states
  - [x] Add `PERMISSION_DENIED`, `ASSISTED_MODE`, and `MANUAL_RESPONSE` states and verify transitions
- [x] Design System Foundation Layer
  - [x] Create core typography styles (Atkinson Hyperlegible config)
  - [x] Implement complete set of reusable WCAG-compliant primitives (Button, Card, FormField, Input, RadioGroup, CheckboxGroup, Modal, ProgressIndicator, StatusBanner, LanguageSelector)
- [x] Survey Engine Foundation
  - [x] Define TypeScript interfaces for Surveys, Questions, Options, and Answers payload schemas
  - [x] Build skip logic evaluations and sequential routers in `routing/router.ts`
  - [x] Write validators for all 10 question types in `validators/validator.ts`
  - [x] Build local IndexedDB persistence database handlers and API endpoints syncer inside `persistence/syncer.ts`
  - [x] Write selectors calculating active progress percentages inside `selectors/progress.ts`
  - [x] Create unit tests (`surveyEngine.test.ts`) validating routing paths, validations, and progress calculations
- [x] Voice Engine Foundation
  - [x] Create provider-agnostic abstractions and interfaces
  - [x] Implement provider selection and fallback manager (escalating OpenAI -> Azure -> Browser)
  - [x] Implement error handling service (Exponential retry backoffs and auth failure bypasses)
  - [x] Build Voice Command Processor integrating multilingual command registry mappings
  - [x] Create unit tests (`voiceEngine.test.ts`) validating mock registrations, backoffs, and command checking
- [x] Multilingual Foundation Layer
  - [x] Define languages registry mapping 9 regional Indian lang codes
  - [x] Build language context and switching services updating DOM lang settings
  - [x] Create Translation Resolvers for Questions, Commands, Errors, and Tutorial files
  - [x] Implement Code-Switching Detection Engine parsing mixed regional transcriptions (Hinglish/Telglish)
  - [x] Write Jest unit tests (`localization.test.ts`) validating fallbacks, error codes, and code-switches
- [x] Backend Integration Layer
  - [x] Design Supabase-compatible PostgreSQL models with UUID keys
  - [x] Generate initial Django database migrations (`0001_initial.py` for `users`, `surveys`, `responses`)
  - [x] Implement DRF serializers and session management views
  - [x] Build header-based (`X-User-ID`) collection preferences endpoints
- [x] Realtime Transport Layer
  - [x] Implement Django Channels and ASGI transport infrastructure
  - [x] Generate WebSocket consumer (`consumers.py`) handling connection, binary audio packets, event JSON routing, heartbeat ACKs, and session restoration
  - [x] Implement connection lifecycle manager (`connection_manager.py`) tracking active sockets and identifying stale connections
  - [x] Implement session manager (`session_manager.py`) with a memory-capped packet recovery buffer (max 200 packets) and stale session sweepers (5m threshold)
  - [x] Define event type constants and contract payload formats (`transport_events.py`)
  - [x] Register ASGI socket routing to `/ws/speech/` in `routing.py` and hook it to `config/asgi.py`
  - [x] Author unit tests (`test_transport.py`) verifying disconnect recovery, reconnect handling, stale session cleanup, and heartbeat validation
- [x] Voice Provider Adapters & Audio Pipeline
  - [x] Create shared Audio Pipeline: `AudioCaptureService` (mic coordinator), `PCMEncoder` (Int16 format translation and binary header packing), and `Resampler` (linear interpolating downsampler).
  - [x] Implement concrete provider adapters for OpenAI Realtime (`openai.ts`), Azure Speech REST (`azure.ts`), and Browser Speech API (`browser.ts`) implementing recognition and synthesis.
  - [x] Integrate adapters with Provider Registry (`registry.ts`), Manager (`manager.ts`), Voice Command Processor, and Localization layer.
  - [x] Implement transport sequence identifiers on audio packet streams (`sequenceId`, `timestamp`, `payload`) and sorted them by sequence ID in the backend session recovery manager.
  - [x] Create Jest unit and integration tests verifying all pipeline services, packaging schemas, and mock/concrete adapter states.
- [x] First End-to-End Survey Flow & Backend OpenAI Proxy
  - [x] Implement all FSM state UI cards (LanguageSelection, TutorialMode, MicPermission, PermissionDenied, AssistedMode, ActiveQuestion, Help, Paused, Completed) dynamically loaded.
  - [x] Add dynamic language rendering from LanguageRegistry.
  - [x] Create server-side OpenAI Realtime API relay proxy (`openai_relay.py`) and wire it inside Daphne/Channels `consumers.py`.
  - [x] Create voice transcript parser mapping speech results to five question types.
  - [x] Verify complete flow with extensive test coverage (50 tests compiled and passing).
- [x] Accessibility Validation Phase
  - [x] Create a validation checklist covering 12 accessibility points.
  - [x] Install Playwright test runner and dependencies.
  - [x] Execute automated Axe audits, keyboard outlines focus checks, and reduced motion tests.
  - [x] Verify all 7 recovery scenarios (Scenarios A-G) at a logical/FSM and code level.
  - [x] Clean up dynamic routing duplicate `%5Bid%5D` folder and fix TypeScript constraints.
  - [x] Create comprehensive ACCESSIBILITY_REPORT.md.
- [x] Experience Completion Phase (Hands-Free & Offline Sync)
  - [x] Update LocalAnswer interface in `db.ts` to Dexie schema version 2 with `created_at` timestamp.
  - [x] Implement `syncOfflineAnswers` queue in `syncer.ts` with lock deduplication.
  - [x] Integrate window online event listener and bootstrapping sync inside `AccessibilityProvider.tsx`.
  - [x] Implement local RMS voice activity detection (`WebAudioVad` in `vad.ts`) with adaptive background noise floor estimation and caps.
  - [x] Implement 2-second dynamic VAD noise floor calibration (`calibration.ts`) with a conservative default fallback (`0.01`).
  - [x] Integrate VAD start/stop and `maxListeningDurationMs` (120,000ms) watchdog timer inside survey page FSM hooks (`page.tsx`).
  - [x] Created 10 new unit/integration tests (`vad.test.ts`, `offlineSync.test.ts`), bringing total coverage to 60 tests.
  - [x] Formulated the hands-free validation report (`HANDS_FREE_VALIDATION_REPORT.md`) verifying Scenario H (slow speakers).
- [x] Phase 8: Production Hardening & Optimization
  - [x] Hardened WebSocket authentication with database validity checks and UUID format checks.
  - [x] Configured Django production security settings, SSL redirections, whitelists, and proxy headers.
  - [x] Implemented Survey and Telemetry API rate limiting throttles.
  - [x] Configured structured JSON logging for all console output streams.
  - [x] Developed client-side `telemetry.ts` with whitelisted error and transition uploads.
  - [x] Developed liveness (`/health`) and readiness (`/ready`) endpoints.
  - [x] Created `DEPLOYMENT.md`, `SECURITY_REVIEW.md`, `RELEASE_CHECKLIST.md`, and `PERFORMANCE_REPORT.md`.
- [x] Phase 9: Groq REST Refactoring & RLS Separation
  - [x] Audit `websockets` dependency to ensure Daphne starts up cleanly without it, and prevent module-level imports in deprecated components.
  - [x] Implement configurable Groq Whisper model via `GROQ_WHISPER_MODEL` environment variable (default: `whisper-large-v3`).
  - [x] Update all server-side transcription requests to utilize the configured `GROQ_WHISPER_MODEL`.
  - [x] Decouple Supabase Row Level Security (RLS) policies from Django migrations.
  - [x] Create `supabase/rls_policies.sql` containing row level security definitions and verification queries.
  - [x] Create `supabase/README.md` documenting when to run policies, rollback steps, and verification steps.
  - [x] Update `DEPLOYMENT.md`, `.env.production.example`, and `.env.example` with the new environment variables and RLS setup instructions.

---

## In Progress

- None

---

## Todo

- None (System is refactored, audited, and ready for pilot deployment)
