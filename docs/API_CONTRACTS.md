# API Contracts - Saathi

All API payloads use JSON format. Endpoints return standard HTTP status codes:
- `200 OK` / `201 Created` for success
- `400 Bad Request` for validation failures
- `401 Unauthorized` / `403 Forbidden` for auth failures
- `404 Not Found` for resource missing
- `500 Internal Server Error` for system failures

---

## 1. Session Management

### 1.1 Start Session
- **Endpoint:** `POST /api/session/start`
- **Request Body:**
  ```json
  {
    "survey_id": "8f2b3e8c-9a1b-4c2d-8e3f-9f1a2b3c4d5e",
    "user_id": "3f4b5c6d-7e8f-9a0b-1c2d-3e4f5a6b7c8d", // Optional user profile association
    "accessibility_mode": "self_guided", // "self_guided", "assisted", "low_vision"
    "language": "en"
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "session_id": "1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d",
    "status": "started",
    "current_question_id": "b0a1c2d3-e4f5-6a7b-8c9d-0e1f2a3b4c5d",
    "created_at": "2026-06-20T22:30:00Z"
  }
  ```

### 1.2 Resume Session
- **Endpoint:** `POST /api/session/resume`
- **Request Body:**
  ```json
  {
    "session_id": "1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "session_id": "1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d",
    "status": "started",
    "current_question_id": "d0e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a",
    "answers": [
      {
        "question_id": "b0a1c2d3-e4f5-6a7b-8c9d-0e1f2a3b4c5d",
        "answer_value": ["opt1"],
        "is_confirmed": true
      }
    ],
    "updated_at": "2026-06-20T22:32:00Z"
  }
  ```

---

## 2. Surveys & Questions

### 2.1 Get Question Details
- **Endpoint:** `GET /api/questions/{id}`
- **Response (200 OK):**
  ```json
  {
    "id": "b0a1c2d3-e4f5-6a7b-8c9d-0e1f2a3b4c5d",
    "survey_id": "8f2b3e8c-9a1b-4c2d-8e3f-9f1a2b3c4d5e",
    "order": 1,
    "question_text": {
      "en": "Select the option that matches your age",
      "hi": "अपनी उम्र के विकल्प का चयन करें"
    },
    "question_type": "single_choice", // "single_choice", "multi_choice", "text", "scale", "boolean", "ranking", "matrix", "date", "time", "audio_response"
    "required": true,
    "options": [
      {
        "id": "opt1",
        "text": {
          "en": "Under 18",
          "hi": "18 से कम"
        }
      }
    ],
    "routing_rules": {
      "next_question_id": "d0e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a"
    }
  }
  ```

---

## 3. Answers Management

### 3.1 Submit Answer
- **Endpoint:** `POST /api/answers`
- **Request Body:**
  ```json
  {
    "session_id": "1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d",
    "question_id": "b0a1c2d3-e4f5-6a7b-8c9d-0e1f2a3b4c5d",
    "answer_value": ["opt1"], // Format shifts based on type
    "is_confirmed": true,
    "confidence_score": 0.95
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "id": "f5e4d3c2-b1a0-9e8d-7c6b-5a4f3e2d1c0b",
    "session_id": "1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d",
    "question_id": "b0a1c2d3-e4f5-6a7b-8c9d-0e1f2a3b4c5d",
    "next_question_id": "d0e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a",
    "is_survey_complete": false
  }
  ```

---

## 4. Accessibility Preferences

Accessibility profiles are linked to the user profile, allowing user settings to persist across multiple survey completions.

### 4.1 Get Preferences
- **Endpoint:** `GET /api/preferences`
- **Headers:** `X-User-ID: 3f4b5c6d-7e8f-9a0b-1c2d-3e4f5a6b7c8d`
- **Response (200 OK):**
  ```json
  {
    "id": "6a7b8c9d-0e1f-2a3b-4c5d-6e7f8a9b0c1d",
    "user_id": "3f4b5c6d-7e8f-9a0b-1c2d-3e4f5a6b7c8d",
    "speech_rate": 1.00,
    "speech_volume": 1.00,
    "text_scale": 1.25,
    "high_contrast": true,
    "reduced_motion": false,
    "preferred_voice": "Google UK English Male",
    "preferred_language": "en"
  }
  ```

### 4.2 Update Preferences
- **Endpoint:** `PUT /api/preferences`
- **Headers:** `X-User-ID: 3f4b5c6d-7e8f-9a0b-1c2d-3e4f5a6b7c8d`
- **Request Body:**
  ```json
  {
    "speech_rate": 1.15,
    "speech_volume": 0.90,
    "text_scale": 1.50,
    "high_contrast": true,
    "reduced_motion": true,
    "preferred_voice": "Microsoft Zira",
    "preferred_language": "en"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "id": "6a7b8c9d-0e1f-2a3b-4c5d-6e7f8a9b0c1d",
    "user_id": "3f4b5c6d-7e8f-9a0b-1c2d-3e4f5a6b7c8d",
    "speech_rate": 1.15,
    "speech_volume": 0.90,
    "text_scale": 1.50,
    "high_contrast": true,
    "reduced_motion": true,
    "preferred_voice": "Microsoft Zira",
    "preferred_language": "en"
  }
  ```

---

## 5. Standardized Analytics Event Logs

All telemetries use strict event validation.

### 5.1 Send Event Log
- **Endpoint:** `POST /api/analytics/events`
- **Request Body:**
  ```json
  {
    "session_id": "1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d",
    "event_type": "QUESTION_ASKED",
    "payload": {
      "question_id": "b0a1c2d3-e4f5-6a7b-8c9d-0e1f2a3b4c5d",
      "timestamp": "2026-06-20T22:31:05Z"
    }
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "status": "logged"
  }
  ```

### 5.2 Centralized Event Type Dictionary

| Event Type Name | Trigger Condition |
|---|---|
| `SURVEY_STARTED` | Dispatched immediately after session initialization. |
| `QUESTION_ASKED` | Dispatched once TTS playback of a question starts. |
| `ANSWER_RECEIVED` | Dispatched when a speech chunk is successfully transcribed into a candidate answer. |
| `ANSWER_CONFIRMED` | Dispatched when the user validates the answer and triggers a write database save. |
| `RECOGNITION_FAILED` | Dispatched if speech confidence is low or WebSockets socket emits error. |
| `LANGUAGE_CHANGED` | Dispatched when a locale switch is requested. |
| `SURVEY_COMPLETED` | Dispatched when the user finishes all available questions. |
| `SURVEY_PAUSED` | Dispatched when user enters the paused state. |
| `SURVEY_RESUMED` | Dispatched when user re-activates a paused session. |
| `SESSION_RECOVERED` | Dispatched when the client resumes a session using local IndexedDB caching. |
