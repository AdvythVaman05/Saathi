# Voice Engine Specification

## Responsibilities

Speech Recognition

Speech Synthesis

Voice Activity Detection

Confidence Detection

Voice Commands

---

## Providers

Primary:
OpenAI Realtime

Secondary:
Azure Speech

Fallback:
Browser Speech API

---

## Commands

Repeat

Back

Skip

Help

Pause

Resume

Exit

---

## Flow

Question Spoken

↓

Listening Starts

↓

Speech Detected

↓

Speech Ends

↓

Recognition

↓

Confidence Check

↓

Confirmation

↓

Store Answer

---

## Confidence Threshold

Default:
0.80

Below threshold:

Ask user to repeat.

Never auto-store.
