# Saathi

## Overview
Saathi is an accessible, multilingual voice-first survey engine and offline-capable data collection platform. Designed with inclusivity at its core, Saathi ensures seamless data collection even in low-bandwidth environments, utilizing state-of-the-art voice technologies and a robust web architecture.

## Features
* **Voice-First Interface:** Hands-free data collection using intelligent voice activity detection.
* **Offline Synchronization:** Ensures data integrity by persisting responses locally and syncing when connectivity is restored.
* **Multilingual Support:** Fully internationalized to support a wide range of languages.
* **Dynamic Survey Engine:** Flexible Finite State Machine (FSM) architecture for complex branching and validation logic.

## Accessibility Features
* **Screen Reader Compatibility:** High contrast modes, ARIA labels, and logical focus management.
* **Blind-User Workflows:** Fully navigable and usable without visual feedback.
* **Manual Fallbacks:** Keyboard and touch-friendly alternatives for every voice interaction.

## Architecture Diagram
*(Architecture diagram placeholder - Insert diagram here)*
- **Frontend:** Vercel (Next.js, React)
- **Backend:** Render (Django, Django Channels, Daphne)
- **Database:** Supabase (PostgreSQL with RLS)
- **Speech-to-Text:** Groq Whisper API
- **Text-to-Speech:** Browser Speech Synthesis API

## Local Setup Instructions
1. **Clone the repository:**
   ```bash
   git clone <repository_url>
   cd Saathi
   ```
2. **Backend Setup:**
   ```bash
   cd backend
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   pip install -r requirements.txt
   python manage.py migrate
   daphne -b 0.0.0.0 -p 8000 config.asgi:application
   ```
3. **Frontend Setup:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

## Deployment Instructions
Refer to [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment instructions to Vercel, Render, and Supabase.

## Environment Variables
Copy `.env.example` to `.env` and `.env.production.example` to `.env.production` and fill in the required values:
* `DATABASE_URL`
* `REDIS_URL`
* `GROQ_API_KEY`
* `GROQ_WHISPER_MODEL`
* `DJANGO_SECRET_KEY`
* `DJANGO_DEBUG`
* `DJANGO_ALLOWED_HOSTS`
* `DJANGO_CORS_ALLOWED_ORIGINS`
* `DJANGO_CORS_ALLOWED_ORIGIN_REGEXES`
* `DJANGO_CSRF_TRUSTED_ORIGINS`
* `NEXT_PUBLIC_API_URL`

## Screenshots
*(Insert screenshots here)*

## License
*(Insert License Information here)*
