import os
import json
import base64
import asyncio
import logging
from openai import AsyncOpenAI

logger = logging.getLogger('apps.speech')

class OpenAiRealtimeProxy:
    def __init__(self, send_client_json, session_id=None):
        self.send_client_json = send_client_json
        self.openai_ws = None
        self.api_key = os.environ.get("OPENAI_API_KEY")
        self.receive_task = None
        self.is_connected = False
        self.session_id = session_id

    async def connect(self):
        import websockets
        if not self.api_key:
            logger.error("OPENAI_API_KEY environment variable is missing.", extra={"session_id": self.session_id, "event": "OPENAI_KEY_MISSING"})
            raise ValueError("OPENAI_API_KEY environment variable is not set.")

        # Using standard GPT-4o realtime model endpoint
        url = "wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "OpenAI-Beta": "realtime=v1"
        }
        
        logger.info("Connecting to OpenAI Realtime API...", extra={"session_id": self.session_id, "event": "OPENAI_CONNECTING"})
        self.openai_ws = await websockets.connect(url, extra_headers=headers)
        self.is_connected = True
        logger.info("Connected to OpenAI Realtime API successfully.", extra={"session_id": self.session_id, "event": "OPENAI_CONNECTED"})
        
        # Configure session to perform speech recognition transcription
        session_update = {
            "type": "session.update",
            "session": {
                "modalities": ["text"],
                "input_audio_transcription": {
                    "model": "whisper-1"
                },
                "turn_detection": None  # Managed turn-taking
            }
        }
        await self.openai_ws.send(json.dumps(session_update))
        
        # Spawn background receiver task
        self.receive_task = asyncio.create_task(self._receive_loop())

    async def _receive_loop(self):
        try:
            async for message in self.openai_ws:
                data = json.loads(message)
                event_type = data.get("type")
                
                if event_type == "conversation.item.input_audio_transcription.completed":
                    transcript = data.get("transcript", "")
                    logger.info(f"OpenAI transcription result: {transcript}", extra={"session_id": self.session_id, "event": "OPENAI_TRANSCRIPTION"})
                    await self.send_client_json({
                        "type": "audio_transcription",
                        "payload": {
                            "transcript": transcript,
                            "confidence": 0.96,
                            "isFinal": True
                        }
                    })
                elif event_type == "error":
                    error_msg = data.get("error", {}).get("message", "OpenAI Realtime error")
                    logger.warning(f"OpenAI Realtime error returned: {error_msg}", extra={"session_id": self.session_id, "event": "OPENAI_ERROR"})
                    await self.send_client_json({
                        "type": "recognition_result",
                        "payload": {
                            "error": error_msg
                        }
                    })
        except asyncio.CancelledError:
            pass
        except Exception as e:
            logger.error(f"Error in OpenAI Realtime receive loop: {str(e)}", extra={"session_id": self.session_id, "event": "OPENAI_RCV_LOOP_ERROR"})

    async def send_audio_chunk(self, pcm_bytes):
        if not self.is_connected or not self.openai_ws:
            return
        
        # Encode binary PCM to base64 for OpenAI Realtime JSON payload
        base64_audio = base64.b64encode(pcm_bytes).decode("utf-8")
        append_event = {
            "type": "input_audio_buffer.append",
            "audio": base64_audio
        }
        await self.openai_ws.send(json.dumps(append_event))

    async def commit_and_transcribe(self):
        if not self.is_connected or not self.openai_ws:
            return
        
        logger.info("Committing speech buffer and requesting transcription response...", extra={"session_id": self.session_id, "event": "OPENAI_COMMIT"})
        commit_event = {"type": "input_audio_buffer.commit"}
        await self.openai_ws.send(json.dumps(commit_event))
        
        response_event = {"type": "response.create"}
        await self.openai_ws.send(json.dumps(response_event))

    async def disconnect(self):
        self.is_connected = False
        if self.receive_task:
            self.receive_task.cancel()
            self.receive_task = None
        if self.openai_ws:
            await self.openai_ws.close()
            self.openai_ws = None
        logger.info("OpenAI Realtime proxy connection closed.", extra={"session_id": self.session_id, "event": "OPENAI_DISCONNECT"})


async def synthesize_speech(text, voice="alloy"):
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        logger.error("OPENAI_API_KEY missing during synthesis request.")
        raise ValueError("OPENAI_API_KEY is not set.")
    
    logger.info(f"Requesting text-to-speech synthesis from OpenAI for text: {text}")
    client = AsyncOpenAI(api_key=api_key)
    
    # Map general voices to OpenAI compatible voices
    voice_map = {
        'default': 'alloy',
        'alloy': 'alloy',
        'echo': 'echo',
        'fable': 'fable',
        'onyx': 'onyx',
        'nova': 'nova',
        'shimmer': 'shimmer'
    }
    target_voice = voice_map.get(voice.lower(), 'alloy')

    response = await client.audio.speech.create(
        model="tts-1",
        voice=target_voice,
        input=text,
        response_format="mp3"
    )
    return await response.aread()
