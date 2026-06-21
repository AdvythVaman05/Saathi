import json
import logging
from channels.generic.websocket import AsyncWebsocketConsumer
from .connection_manager import RealtimeConnectionManager
from .session_manager import RealtimeSessionManager
from .openai_relay import OpenAiRealtimeProxy, synthesize_speech
from .import transport_events

import uuid
from channels.db import database_sync_to_async
from apps.responses.models import Session

logger = logging.getLogger('apps.speech')

# Global singletons for in-memory tracking
connection_manager = RealtimeConnectionManager()
session_manager = RealtimeSessionManager()

class SpeechConsumer(AsyncWebsocketConsumer):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.session_id = None
        self.active_session = None
        self.openai_proxy = None

    @database_sync_to_async
    def is_session_valid(self, session_id):
        try:
            session = Session.objects.get(id=session_id)
            return session.status in ('started', 'paused')
        except (Session.DoesNotExist, ValueError):
            return False

    async def connect(self):
        # Resolve session ID from query params or headers
        query_string = self.scope.get('query_string', b'').decode('utf-8')
        params = dict(x.split('=') for x in query_string.split('&') if '=' in x)
        self.session_id = params.get('session_id')

        if not self.session_id:
            logger.warning("WebSocket rejected: session_id query parameter missing.")
            await self.close(code=4403)
            return

        # 1. Validate session_id format (must be valid UUID)
        try:
            uuid.UUID(self.session_id)
        except ValueError:
            logger.warning(f"WebSocket rejected: session_id {self.session_id} is not a valid UUID format.")
            await self.close(code=4403)
            return

        # 2. Verify session exists in database and is active
        session_exists_and_active = await self.is_session_valid(self.session_id)
        if not session_exists_and_active:
            logger.warning(f"WebSocket rejected: session_id {self.session_id} does not exist or is inactive.")
            await self.close(code=4403)
            return

        await self.accept()
        
        # Track connection and session states
        connection_manager.add_connection(self.channel_name, self.session_id)
        self.active_session = session_manager.get_or_create_session(self.session_id)
        
        logger.info(f"Speech WebSocket connection established for session {self.session_id}", extra={"session_id": self.session_id, "event": "WS_CONNECT"})

    async def disconnect(self, close_code):
        connection_manager.remove_connection(self.channel_name)
        if self.session_id:
            session_manager.mark_disconnected(self.session_id)
        
        # Clean up OpenAI proxy connection if active
        if self.openai_proxy:
            await self.openai_proxy.disconnect()
            self.openai_proxy = None
            
        logger.info(f"Speech WebSocket connection closed: session={self.session_id}, code={close_code}", extra={"session_id": self.session_id, "event": "WS_DISCONNECT"})

    async def send_client_json(self, data):
        try:
            await self.send(text_data=json.dumps(data))
        except Exception as e:
            logger.warning(f"Failed to send JSON to client: {str(e)}", extra={"session_id": self.session_id, "event": "WS_SEND_JSON_FAILED"})

    async def receive(self, text_data=None, bytes_data=None):
        if bytes_data:
            # 1. Handle Binary Audio packet transport
            if self.active_session:
                self.active_session.add_audio_packet(bytes_data)
                self.active_session.record_activity()
            
            # Lazily initialize OpenAI proxy connection on first audio chunk
            if not self.openai_proxy:
                self.openai_proxy = OpenAiRealtimeProxy(self.send_client_json, self.session_id)
                try:
                    await self.openai_proxy.connect()
                except Exception as e:
                    logger.error(f"OpenAI proxy connection failed: {str(e)}", extra={"session_id": self.session_id, "event": "WS_OPENAI_PROXY_FAILED"})
                    await self.send(json.dumps({
                        "type": "recognition_result",
                        "payload": {
                            "error": "Failed to connect to speech recognition server."
                        }
                    }))
                    return

            # Slice 12-byte header (sequenceId: 4, timestamp: 8) to get raw Int16 PCM bytes
            raw_pcm = bytes_data[12:]
            await self.openai_proxy.send_audio_chunk(raw_pcm)
            return

        if text_data:
            # 2. Handle Event JSON Routing
            try:
                event = json.loads(text_data)
                event_type = event.get('type')
                payload = event.get('payload', {})

                if event_type == transport_events.EVENT_HEARTBEAT:
                    # Heartbeat update
                    connection_manager.record_heartbeat(self.channel_name)
                    if self.active_session:
                        self.active_session.record_activity()
                    await self.send(text_data=json.dumps(transport_events.make_heartbeat_ack()))

                elif event_type == transport_events.EVENT_SESSION_RESTORE_REQ:
                    # Session Restoration request
                    restore_id = payload.get('session_id')
                    if restore_id == self.session_id and self.active_session:
                        last_seq = self.active_session.last_packet_seq
                        await self.send(text_data=json.dumps(transport_events.make_session_restored(self.session_id, last_seq)))
                    else:
                        await self.send(text_data=json.dumps(transport_events.make_error_event("Session ID mismatch during recovery.")))

                elif event_type == 'synthesis_request':
                    # Secure text-to-speech synthesis request
                    text = payload.get('text', '')
                    voice = payload.get('voice', 'alloy')
                    try:
                        audio_data = await synthesize_speech(text, voice)
                        await self.send(bytes_data=audio_data)
                    except Exception as e:
                        logger.error(f"TTS synthesis failed: {str(e)}", extra={"session_id": self.session_id, "event": "WS_TTS_FAILED"})
                        await self.send(text_data=json.dumps(transport_events.make_error_event(f"TTS synthesis failed: {str(e)}")))
                    finally:
                        await self.close()

                elif event_type == 'stop_listening_request':
                    # Explicit signal to commit audio buffer and transcribe
                    if self.openai_proxy:
                        await self.openai_proxy.commit_and_transcribe()

                else:
                    logger.warning(f"Unhandled socket event type: {event_type}", extra={"session_id": self.session_id, "event": "WS_UNHANDLED_EVENT"})

            except json.JSONDecodeError:
                await self.send(text_data=json.dumps(transport_events.make_error_event("Invalid JSON formatting.")))
            except Exception as e:
                logger.error(f"WebSocket execution error: {str(e)}", extra={"session_id": self.session_id, "event": "WS_EXECUTION_ERROR"})
                await self.send(text_data=json.dumps(transport_events.make_error_event("Internal socket error.")))
