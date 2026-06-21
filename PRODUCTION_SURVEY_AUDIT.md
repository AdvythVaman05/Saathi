# Saathi - Production Survey Database Audit Report

This report documents the results of the production database audit performed on the Supabase PostgreSQL database to investigate why the survey detail endpoint returns a 404 error.

---

## 1. Audit Findings

### 1.1 Database Verification Metrics
*   **Survey Exists:** **`True`**
*   **Survey Title (English):** `"Naviksa Accessibility Research Study"`
*   **Languages Supported (9):** English (`en`), Hindi (`hi`), Telugu (`te`), Tamil (`ta`), Kannada (`kn`), Malayalam (`ml`), Bengali (`bn`), Marathi (`mr`), Gujarati (`gu`)
*   **Question Count:** **`15`**
*   **Database Host:** `aws-1-ap-northeast-1.pooler.supabase.com`
*   **Database Name:** `postgres`

### 1.2 Schema & Seeding Integrity
*   **Migrations Status:** **`PASS`** (22 Django migrations are successfully applied, including `surveys` and `responses` models).
*   **Tables Status:** **`PASS`** (All database tables, including `surveys_survey` and `surveys_question`, exist in the public schema).
*   **Seed Command Status:** **`PASS`** (The seed command `python manage.py seed_naviksa_survey` has been executed on the production database, and the target survey record exists with all 15 question relations successfully populated).

---

## 2. Root Cause Analysis of 404 Response

The survey record **exists, is active (`is_active = True`), and is fully populated** in the production database. The 404 response on the deployed Render backend is **not** a database schema, missing record, or seeding issue. 

Instead, the audit identifies a **Render Routing Layer Failure** as the root cause:

### 2.1 Diagnostic Header Evidence
When performing HTTP requests directly to the backend domain:
```bash
curl.exe -i https://saathi-backend.onrender.com/health
curl.exe -i https://saathi-backend.onrender.com/api/surveys/list/d3b07384-d113-4ec5-a5d7-be245a0b7384/
```

The server returns:
```http
HTTP/1.1 404 Not Found
Server: cloudflare
x-render-routing: no-server
```

### 2.2 Conclusion
1.  **`x-render-routing: no-server`:** This specific header is injected by Render's load balancers. It indicates that the Render routing network **cannot find any active or running server instance** bound to the host `saathi-backend.onrender.com`.
2.  **Service Unreachable:** The request never reaches the Django ASGI/Daphne application. It is blocked at the gateway level.
3.  **Potential Causes:**
    *   The Render web service named `saathi-backend` is currently **suspended** (common on Render free tier accounts after inactivity).
    *   The Render web service deployment **failed to compile/boot** on the last release, resulting in no active server instance to route traffic to.
    *   The deployed Render backend uses a **different subdomain** than the example `saathi-backend` documented in `DEPLOYMENT.md`.

---

## 3. Recommended Actions

1.  **Check Render Dashboard:** Log in to the Render dashboard and inspect the service status of the Saathi backend web service.
2.  **Verify Web Service Subdomain:** Confirm that the active URL matches `saathi-backend.onrender.com`. If the service has a suffix or different name (e.g. `saathi-backend-xxxx.onrender.com`), update `NEXT_PUBLIC_API_URL` on the Vercel frontend.
3.  **Resume Service / Rebuild:** If the service is suspended, trigger a manual resume or redeploy the latest commit `4355a4a` (simplified HTTP REST stack) to spin up the Daphne server process.
