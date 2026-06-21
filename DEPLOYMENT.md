# Saathi - Pilot Deployment Guide

This document describes the deployment procedures for launching Saathi on a production-ready simplified cloud stack consisting of **Vercel** (Frontend), **Render** (Backend), and **Supabase** (Database).

---

## 1. Environment Configurations

Below are the required environment configurations. A template is provided in [.env.production.example](file:///d:/Project%20Netra/Saathi/.env.production.example).

### 1.1 Backend Environment Variables (Render)
| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `DATABASE_URL` | PostgreSQL connection pool URL from Supabase | `postgres://postgres.xxx:5432/postgres` |
| `GROQ_API_KEY` | Server-side Groq API Key (isolated from browser) | `gsk_proj_xxx` |
| `GROQ_WHISPER_MODEL` | Configurable model used for Whisper transcriptions | `whisper-large-v3` |
| `DJANGO_SECRET_KEY` | Cryptographic signing key for Django | `secure-random-string` |
| `DJANGO_DEBUG` | Django debug toggle (must be False in prod) | `False` |
| `DJANGO_ALLOWED_HOSTS` | Comma-separated list of allowed domains | `saathi-backend.onrender.com,localhost` |
| `DJANGO_CORS_ALLOWED_ORIGINS` | Permitted origins for REST requests | `https://saathi.vercel.app` |
| `DJANGO_CORS_ALLOWED_ORIGIN_REGEXES` | Permitted dynamic subdomains (Vercel previews) | `^https:\/\/saathi-.*\.vercel\.app$` |
| `DJANGO_CSRF_TRUSTED_ORIGINS` | Trusted origins for CSRF validation | `https://saathi.vercel.app` |

### 1.2 Frontend Environment Variables (Vercel)
| Variable | Description | Example |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_API_URL` | Target REST API server host URL | `https://saathi-backend.onrender.com` |

---

## 2. Target Deployment Stack

### 2.1 Database & Security (Supabase)
1. Initialize a new PostgreSQL database in the Supabase Dashboard.
2. In **Database Settings**, copy the **Transaction Connection Pooler** string (`Mode: Transaction` on port `6543`) or Direct Connection URL.
3. Configure `DATABASE_URL` in the Render web service settings.
4. **Row Level Security (RLS) Setup:**
   * Run the Django database migrations first (`python manage.py migrate` in Render release commands) to build the database tables.
   * Open the **SQL Editor** in the Supabase dashboard.
   * Load and execute the [supabase/rls_policies.sql](file:///d:/Project%20Netra/Saathi/supabase/rls_policies.sql) script. This will enable RLS on all 7 tables and bind SELECT/INSERT capabilities strictly to session owners (`X-Session-ID` headers).
   * For detailed instructions, timing constraints, verification queries, and rollback steps, refer to [supabase/README.md](file:///d:/Project%20Netra/Saathi/supabase/README.md).

#### RLS Verification:
Run the following query in the SQL Editor to check if RLS is active:
```sql
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
```
*(All tables should return `rowsecurity = true`). For full verification steps, see [supabase/README.md](file:///d:/Project%20Netra/Saathi/supabase/README.md#2-verification-steps).*

#### RLS Rollback:
To disable RLS and drop security boundaries, execute the commented rollback block at the bottom of the SQL script or see the instructions in [supabase/README.md](file:///d:/Project%20Netra/Saathi/supabase/README.md#3-rollback-steps).

### 2.2 Backend (Render)
Render hosts the Django REST application and Daphne ASGI server.

1. Connect your repository to Render.
2. Create a new **Web Service**, choosing **Python** environment.
3. Configure the build parameters:
   * **Build Command:** `pip install -r requirements.txt`
   * **Start Command:** `daphne -b 0.0.0.0 -p $PORT config.asgi:application`
4. Expose the environment variables listed in Section 1.1. Render handles SSL termination automatically.

### 2.3 Frontend (Vercel)
1. Import the repository into the Vercel dashboard.
2. Choose **Next.js** preset and set the **Root Directory** to `frontend`.
3. Set the Environment Variable: `NEXT_PUBLIC_API_URL` pointing to your deployed Render web service.
4. Trigger **Deploy**. Vercel will automatically build, optimize, and issue an SSL certificate.

---

## 3. Operations & Lifecycle

### 3.1 Database Migration Process
Migrations must run *before* traffic hits the newly deployed backend:
- Render supports a **Release Command** in the Web Service configuration. Set this to:
  ```bash
  python manage.py migrate --noinput
  ```
- This guarantees migrations run automatically before each build release goes live.

### 3.2 Rollback Process
If a release encounters critical bugs:
1. **Backend Rollback:** In Render, navigate to the deployment list, find the previous successful build commit, and select **Rollback to this deploy**.
2. **Frontend Rollback:** In Vercel, go to **Deployments**, locate the last working version, and select **Promote to Production** to roll back immediately.
3. **Database Rollback:** If a schema rollback is required, execute a reverse migration from the container shell:
   ```bash
   python manage.py migrate apps.responses <previous_migration_name>
   ```

## 4. Local Development

When running Saathi locally, you must provide a `DJANGO_SECRET_KEY` as it is mandatory and no longer defaults to an insecure value.

1. Copy `.env.example` to `.env` (or `.env.local`).
2. Add a strong random string for `DJANGO_SECRET_KEY`:
   ```bash
   DJANGO_SECRET_KEY="local-development-secret-key"
   ```
3. Failure to set this will result in an `ImproperlyConfigured` exception and the application will fail to start.
