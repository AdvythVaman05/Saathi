# Architecture Decisions

Decision:
Voice First Platform

Status:
Accepted

---

Decision:
No microphone buttons in Self Guided Mode

Status:
Accepted

---

Decision:
WCAG 2.2 AA minimum

Status:
Accepted

---

Decision:
Multilingual support from Day 1

Status:
Accepted

---

Decision:
Groq Whisper REST API (STT) + Browser Speech Synthesis API (TTS) preferred speech stack

Status:
Accepted (Replaced OpenAI Realtime + Azure Speech to reduce latency, cost, and architecture complexity for pilot deployment)

---

Decision:
Supabase PostgreSQL Migration with RLS

Status:
Accepted

Reason:
To utilize secure authentication, rapid cloud scaling, and structured Row Level Security (RLS) while keeping schemas portable via standard pgcrypto UUIDs.

---

Decision:
Separate Accessibility Preferences Table

Status:
Accepted

Reason:
Accessibility profiles (`users_accessibilitypreferences`) should not pollute survey session metrics, permitting separate storage lifetimes.

---

Decision:
IndexedDB as Primary Cache

Status:
Accepted

Reason:
IndexedDB stores large multilingual survey text and offline answer blocks without hitting the 5MB browser LocalStorage limit. LocalStorage remains as a fallback.

---

Decision:
Centralized Voice Command Registry

Status:
Accepted

Reason:
Prevents hardcoded voice command mapping strings inside UI components and simplifies multilingual support (English, Hindi, Telugu, Spanish).

---

Decision:
Centralized and Enumerated Analytics Events

Status:
Accepted

Reason:
Enforces schema compliance for all analytics logs, prohibiting arbitrary string keys.
