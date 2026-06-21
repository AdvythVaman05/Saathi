# Render Deployment Report

This report outlines the deployment configuration and requirements for hosting the Saathi Django backend on Render.

## 1. Commands Configuration
* **Build Command:** `pip install -r requirements.txt`
* **Start Command:** `daphne -b 0.0.0.0 -p $PORT config.asgi:application`
* **Release Command:** `python manage.py migrate --noinput`

## 2. Check Endpoints
* **Health Check URL:** `/health` (Returns HTTP 200 immediately to verify process liveness)
* **Readiness Check URL:** `/ready` (Checks database connection, Redis broker, and Groq API connectivity before routing live traffic)

## 3. Required Environment Variables
| Variable | Purpose | Format | Example | Mandatory |
| :--- | :--- | :--- | :--- | :--- |
| `DATABASE_URL` | PostgreSQL connection pool URL from Supabase | `postgresql://user:pass@host:port/dbname` | `postgresql://postgres.xxx:6543/postgres` | **Yes** |
| `REDIS_URL` | Redis connection URL for Channels and Celery | `redis://user:pass@host:port/db` | `redis://default:xxx@render.com:6379/0` | **Yes** |
| `DJANGO_SECRET_KEY` | Cryptographic signing key for Django | 64-character random string | `secure-random-key-64-chars` | **Yes** |
| `DJANGO_DEBUG` | Enable/Disable Django Debug mode | `True` or `False` | `False` | **Yes** (defaults to False) |
| `DJANGO_ALLOWED_HOSTS` | Allowed host headers | Comma-separated domains | `saathi-backend.onrender.com,localhost` | **Yes** |
| `DJANGO_CORS_ALLOWED_ORIGINS` | Whitelisted origins for CORS requests | Comma-separated URLs | `https://saathi.vercel.app` | **Yes** |
| `DJANGO_CSRF_TRUSTED_ORIGINS` | Trusted origins for CSRF validation | Comma-separated URLs | `https://saathi.vercel.app` | **Yes** |
| `GROQ_API_KEY` | Server-side Groq API key | `gsk_` prefixed API token | `gsk_proj_xxx` | **Yes** |
| `GROQ_WHISPER_MODEL` | Transcription model identifier | String | `whisper-large-v3` | **Yes** (defaults to whisper-large-v3) |

## 4. Known Risks
* **Supabase Connection Limit:** Render's ASGI application spawn multiple worker processes which can exhaust Supabase connection limits quickly.
  - *Mitigation:* Always use the Transaction Pooler (port 6543) and set connection limit settings in the pooler appropriately.
* **WebSocket Daphne Latency:** Render Web Services scale down on inactivity unless on paid tiers, causing initial connection delays.
  - *Mitigation:* Ensure Render Web Service is running on an active (non-free) tier for production pilot.
* **Database SSL Requirement:** Supabase requires SSL. 
  - *Mitigation:* Ensure `sslmode=require` is appended to the connection string, or `?sslmode=require` is present in the `DATABASE_URL`.

## 5. Deployment Checklist
1. Create a Render PostgreSQL/Redis instance (or use Supabase for DB and Render Redis).
2. Create a new Render Web Service pointing to the backend codebase.
3. Configure the Build, Start, and Release commands.
4. Input all variables in the Render Environment Variable Matrix.
5. Trigger initial deployment.
6. Verify `/health` and `/ready` respond with `200 OK`.

## 6. Rollback Procedure
1. Locate the last stable deployment in the Render Dashboard.
2. Select **Rollback to this deploy**.
3. If schema changes need rollback, access the Render Shell and run:
   ```bash
   python manage.py migrate <app_name> <previous_migration>
   ```
