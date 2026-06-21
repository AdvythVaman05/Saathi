# Product Requirements Document (PRD) - Saathi

## 1. Vision & Goals
**Saathi** is a voice-first, highly accessible survey platform designed for individuals who are blind, visually impaired, or have low vision. The application shifts the design paradigm by placing voice and screen reader interactions at the center, prioritizing accessibility over aesthetics, and ensuring zero-friction participation.

### Target Personas
1. **Persona A: Totally Blind User (Self-Guided Mode)**
   - Requires full speech-guided navigation.
   - Continuous listening via Voice Activity Detection (VAD). No microphone button after permission is granted.
2. **Persona B: Low Vision / Cataracts User (Low-Vision Mode)**
   - Requires high-contrast displays (minimum 7:1 ratio).
   - Relies on large, high-legibility fonts (Atkinson Hyperlegible) scaled safely up to 200%.
3. **Persona C: Elderly User (Assisted Mode)**
   - Requires minimal cognitive load.
   - Prefers combination of audio guidance, large buttons (minimum 48x48px target), and manual confirmations.

---

## 2. Core Functional Requirements

### 2.1 Mode Management
The platform operates in three distinct, toggleable modes:
- **Self-Guided Mode (Voice-First)**
  - Automatically requests microphone permissions on load.
  - **No microphone button** after permission is granted.
  - Continuous listening using Voice Activity Detection (VAD).
  - Explicit confirmation for every answer via speech (e.g., "Yes", "Confirm").
  - Spoken error recovery if voice confidence drops below `0.80`.
- **Assisted Mode (Hybrid)**
  - Support for speech, keyboard navigation, mouse, and touch.
  - High-visibility focus indicators and readable screen-reader descriptions for all actions.
- **Low-Vision Mode (Visual Accessibility)**
  - Enforced high-contrast theme (dark/light high contrast passing WCAG AAA).
  - Atkinson Hyperlegible typography.
  - Motion is reduced (`prefers-reduced-motion` respected by default).
  - Clean layout, zoom-safe up to 200% without layout breakage.

### 2.2 Expanded Survey Question Types
To support complex census and feedback systems, Saathi natively supports:
- `single_choice` (Radio button choices)
- `multi_choice` (Checkbox selection choices)
- `text` (Freeform voice/keyboard dictation)
- `scale` (Numeric ratings, e.g., 1 to 5)
- `boolean` (Yes / No options)
- `ranking` (Order choice elements by preference)
- `matrix` (Grid selections, ratings across multiple sub-items)
- `date` (Calendar selections)
- `time` (Time values input)
- `audio_response` (Record direct voice feedback stream and store raw wav file)

### 2.3 Offline & Data Persistence Strategy
Survey metadata, ongoing session progress, and translation indexes can become large. We employ a hierarchical caching strategy:
- **Primary Cache: IndexedDB**
  - Used for large state storage, localized survey questions, and structured response logs.
  - Managed via wrapper service (e.g., Dexie.js or local localforage).
- **Secondary Cache: LocalStorage**
  - Serves as the fallback cache if browser security blocks IndexedDB.
- **Auto-Sync:** On connection state changes (Offline -> Online), a service worker automatically drains the queue, posting cached responses to the backend.

### 2.4 Multilingual Voice Command Registry
Voice commands are centralized and managed via the Command Registry. Handled locales include English, Hindi, and Telugu.
- **Directory:** `frontend/src/features/voice-engine/commands/`
- Centralized registration prevents component hardcoding.

---

## 3. Complete Folder Structure

```
Saathi/
├── .env.example
├── .gitignore
├── docker-compose.yml
├── README.md
├── docs/                               # Project specifications
│   ├── ACCESSIBILITY_ACCEPTANCE_TESTS.md
│   ├── API_CONTRACTS.md
│   ├── ARCHITECTURE.md
│   ├── CURSOR_RULES.md
│   ├── DESIGN_SYSTEM.md
│   ├── MASTER_SPEC.md
│   ├── PRD.md
│   ├── STATE_MACHINE_SPEC.md
│   ├── USER_FLOWS.md
│   └── UX_SPEC.md
├── project-management/                 # Management trackers
│   ├── AI_HANDOFF.md
│   ├── CHANGELOG.md
│   ├── DECISIONS.md
│   ├── PROJECT_STATUS.md
│   └── TASKS.md
├── frontend/                           # Next.js 15 Client
│   ├── public/
│   │   ├── fonts/                      # Atkinson Hyperlegible
│   │   └── audio/                      # Audio cues
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx
│   │   │   └── survey/[id]/page.tsx
│   │   ├── components/
│   │   │   ├── AccessibilitySettings.tsx
│   │   │   ├── SurveyContainer.tsx
│   │   │   └── AudioCueManager.tsx
│   │   ├── design-system/
│   │   │   ├── tokens.css
│   │   │   └── themes.ts
│   │   ├── features/
│   │   │   ├── voice-engine/
│   │   │   │   └── commands/           # Centralized Command Registry
│   │   │   │       ├── index.ts
│   │   │   │       └── mappings.ts
│   │   │   └── analytics/              # Standardized Analytics Events
│   │   │       └── events.ts
│   │   ├── hooks/
│   │   │   ├── useSpeechRecognition.ts
│   │   │   └── useKeyboardNavigation.ts
│   │   ├── services/
│   │   │   ├── api.ts
│   │   │   ├── db.ts                   # IndexedDB wrapper (primary cache)
│   │   │   └── websocket.ts
│   │   └── stores/
│   │       ├── surveyStore.ts          # Zustand state machine
│   │       └── preferenceStore.ts      # Accessibility preferences
│   └── tests/
│       ├── accessibility.test.ts
│       └── voice-engine.test.ts
└── backend/                            # Django 5 Server
    ├── manage.py
    ├── config/
    │   ├── settings.py
    │   └── urls.py
    └── apps/
        ├── users/                      # Handles users & users_accessibilitypreferences
        ├── surveys/                    # Survey schema & structures
        ├── responses/                  # Session details and answers
        └── speech/                     # OpenAI realtime web sockets
```

---

## 4. Accessibility Standards
- **WCAG 2.2 AAA Target:** All visual elements pass AAA guidelines.
- **Voice Override:** Zero microphone buttons are required in Self Guided Mode once permissions are cleared.
- **Aria Live Broadcasts:** Every state transition is announced immediately to assistive screen readers.
