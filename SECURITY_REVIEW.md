# Saathi - Production Security Architecture Review

This document presents a comprehensive security audit and review for the pilot deployment of the Saathi Survey Companion.

---

## 1. Key Audited Areas

### 1.1 Groq API Key Isolation (Server-Side REST Proxy)
- **Design:** The browser client never makes direct requests to third-party AI APIs (such as Groq Whisper) and does not possess their API credentials.
- **Implementation:** The client records audio locally, and uploads the audio blob via a standard POST request to the local Django server endpoint `/api/speech/transcribe/`. The Django backend view (`TranscribeView`) safely forwards the audio payload to the Groq API using environment credentials stored on the server (`GROQ_API_KEY`).
- **Outcome:** Zero exposure of high-cost API keys to the browser, mitigating risk of key harvesting and abuse.

### 1.2 Client-Side Text-to-Speech (TTS) Privacy
- **Design:** Text-to-speech synthesis uses the native browser Web Speech API (`speechSynthesis`).
- **Implementation:** No cloud synthesis requests or network transmissions are generated for speech synthesis. All translation, regional voice mapping, and speech synthesis are executed locally on the client's device.
- **Outcome:** Complete user data privacy for voice outputs, reduced network traffic, and zero API cost/latency for TTS.

### 1.3 Supabase Row Level Security (RLS) Separation
- **Design:** DB table row-level security is enforced natively at the database level rather than inside Django ORM migrations.
- **Implementation:** RLS is managed through [supabase/rls_policies.sql](file:///d:/Project%20Netra/Saathi/supabase/rls_policies.sql). Policies restrict table read/write access based on session headers (`X-Session-ID` and `X-User-ID`), securing user and answer tables against cross-tenant data access.
- **Outcome:** Secure database-level tenancy containment, decoupled from application-level ORM migration states.

### 1.4 CORS & CSRF Whitelists
- **Design:** Restricted resource sharing to prevent unauthorized cross-origin requests.
- **Implementation:** Origins are read dynamically from environment variables (`DJANGO_CORS_ALLOWED_ORIGINS` and `DJANGO_CSRF_TRUSTED_ORIGINS`).
- **Dynamic Previews:** Standard wildcarding (`*`) is disabled. Instead, dynamic preview environments (Vercel previews) are handled securely using regex whitelists: `^https:\/\/saathi-.*\.vercel\.app$`.

### 1.5 API Rate Limiting (DRF Throttling)
- **Throttling Scopes:** Custom throttling is enforced via `SurveyAnonRateThrottle` and `TelemetryAnonRateThrottle` on views:
  - **Survey APIs (`survey` scope):** Limited to `120` requests/minute per anonymous IP (affects session start/resume and answer posts).
  - **Telemetry APIs (`telemetry` scope):** Limited to `1000` requests/minute per anonymous IP (affects audit log submissions).
- **Outcome:** Protects server resources and database connection pools from denial-of-service and brute-force submissions.

### 1.6 Telemetry & Logs Privacy Audit
- **Design:** Telemetry must only capture systemic health, latency, and error states. It must never leak user data.
- **Implementation:** The frontend client (`telemetry.ts`) sanitizes all event payloads. It filters keys strictly against a whitelist (`message`, `error_name`, `source_provider`, `latency_ms`, `state_to`, etc.).
- **Privacy Guarantee:** Telemetry and debug console loggers **never** record raw voice transcripts, option selections, text answers, personally identifiable information (PII), or accessibility preferences.

---

## 2. Identified Risks & Vulnerabilities

| Risk ID | Vulnerability / Risk | Severity | Mitigation Plan |
| :--- | :--- | :---: | :--- |
| **SEC-1** | **Unsigned Session IDs** | **Medium** | While `session_id` is a random UUID, it is not cryptographically signed. A malicious actor could guess or brute-force session IDs to fetch metadata if RLS policies are misconfigured. |
| **SEC-2** | **Anonymous Telemetry Abuse** | **Low** | Since the `/api/responses/telemetry/` endpoint is accessible without authentication to support anonymous participants, an attacker could flood it to bloat database storage. |
| **SEC-3** | **WebSocket Denial of Service** | **Medium** | High volumes of concurrent WebSocket connections could exhaust Daphne's event loops or exhaust the Redis Channel Layer connections. |

---

## 3. Future Security Recommendations

### 3.1 Signed JWT Session Tokens
Transition from raw UUIDs to cryptographically signed JSON Web Tokens (JWT) issued by `/api/responses/sessions/start/`.
- **Benefit:** The ASGI WebSocket server can verify the signature of the session token immediately using the `SECRET_KEY` without making a blocking database query, eliminating database load on connection handshakes.

### 3.2 Authenticated User Binding
Integrate Supabase Auth or standard Django user auth to bind sessions to verified user accounts (for researchers/administrators), enforcing strict Row Level Security (RLS) policies on Django and Supabase.

### 3.3 CDN Web Application Firewall (WAF)
Place the application behind Cloudflare or Vercel WAF to block malicious bots, rate limit traffic at the edge, and mitigate DDoS attacks before they reach the backend Daphne servers.
