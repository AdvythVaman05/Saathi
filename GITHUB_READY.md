# Saathi - GitHub Readiness Summary

## Project Overview
Saathi is an accessible, multilingual voice-first survey engine and offline-capable data collection platform designed for pilot deployment.

## Tech Stack
* **Frontend:** Next.js, React
* **Backend:** Django, Django Channels, Daphne ASGI
* **Database:** PostgreSQL (via Supabase)
* **Speech-to-Text:** Groq Whisper API
* **Text-to-Speech:** Browser Speech Synthesis API

## Frontend Architecture
The frontend is built with Next.js and React, prioritizing accessibility and responsive design. It uses a dynamic Finite State Machine (FSM) to handle complex survey flows, including voice activity detection, manual fallbacks, and offline synchronization.

## Backend Architecture
The backend is a Django application running under ASGI (Daphne). It provides REST endpoints for data synchronization and integrates with the Groq Whisper API for high-speed, server-side audio transcription.

## Deployment Architecture
* **Frontend:** Deployed to Vercel for edge caching and fast global delivery.
* **Backend:** Deployed to Render as a Web Service.
* **Database:** Hosted on Supabase with strict Row Level Security (RLS) policies.

## Environment Variables Required
* `DATABASE_URL` (Backend)
* `REDIS_URL` (Backend - Channels/Celery)
* `GROQ_API_KEY` (Backend)
* `GROQ_WHISPER_MODEL` (Backend)
* `DJANGO_SECRET_KEY` (Backend)
* `DJANGO_DEBUG` (Backend)
* `DJANGO_ALLOWED_HOSTS` (Backend)
* `DJANGO_CORS_ALLOWED_ORIGINS` (Backend)
* `DJANGO_CORS_ALLOWED_ORIGIN_REGEXES` (Backend)
* `DJANGO_CSRF_TRUSTED_ORIGINS` (Backend)
* `NEXT_PUBLIC_API_URL` (Frontend)

## Current Deployment Target
* **Frontend:** Vercel
* **Backend:** Render
* **Database:** Supabase
* **STT:** Groq Whisper
* **TTS:** Browser Speech Synthesis
