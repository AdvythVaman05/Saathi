import time
import logging

logger = logging.getLogger('apps.speech')

class RealtimeSession:
    def __init__(self, session_id: str):
        self.session_id = session_id
        self.last_activity = time.time()
        self.last_packet_seq = 0
        self.audio_buffer = [] # Buffer of audio packets for recovery on disconnect
        self.is_connected = True

    def record_activity(self):
        self.last_activity = time.time()

    def add_audio_packet(self, packet_bytes: bytes):
        import struct
        # Try unpacking the big-endian 32-bit sequenceId and 64-bit timestamp from the first 12 bytes
        if len(packet_bytes) >= 12:
            try:
                seq_id, timestamp = struct.unpack('>IQ', packet_bytes[:12])
                payload = packet_bytes[12:]
                self.last_packet_seq = max(self.last_packet_seq, seq_id)
                self.audio_buffer.append({
                    "sequenceId": seq_id,
                    "timestamp": timestamp,
                    "payload": payload
                })
                # Re-order recovery packets by sequence ID to guarantee correct recovery sequence
                self.audio_buffer.sort(key=lambda x: x["sequenceId"])
                
                if len(self.audio_buffer) > 200:
                    self.audio_buffer.pop(0)
                return
            except Exception as e:
                logger.warning(f"Failed to unpack header from binary packet: {str(e)}")

        # Fallback to sequential generation
        self.last_packet_seq += 1
        self.audio_buffer.append({
            "sequenceId": self.last_packet_seq,
            "timestamp": int(time.time() * 1000),
            "payload": packet_bytes
        })
        if len(self.audio_buffer) > 200:
            self.audio_buffer.pop(0)

class RealtimeSessionManager:
    def __init__(self, stale_timeout_seconds=300):
        self.sessions = {}
        self.stale_timeout = stale_timeout_seconds

    def get_or_create_session(self, session_id: str) -> RealtimeSession:
        if session_id not in self.sessions:
            logger.info(f"Creating new realtime session cache for {session_id}")
            self.sessions[session_id] = RealtimeSession(session_id)
        else:
            logger.info(f"Re-connecting existing realtime session cache: {session_id}")
            self.sessions[session_id].is_connected = True
            self.sessions[session_id].record_activity()
        return self.sessions[session_id]

    def mark_disconnected(self, session_id: str):
        if session_id in self.sessions:
            self.sessions[session_id].is_connected = False
            self.sessions[session_id].record_activity()

    def cleanup_stale_sessions(self) -> int:
        """
        Scavenge and remove sessions that have been disconnected and inactive 
        longer than the stale timeout period (e.g. 5 minutes).
        """
        now = time.time()
        stale_keys = []
        for key, session in self.sessions.items():
            if not session.is_connected and (now - session.last_activity) > self.stale_timeout:
                stale_keys.append(key)

        for key in stale_keys:
            logger.info(f"Cleaning up stale realtime session cache: {key}")
            del self.sessions[key]

        return len(stale_keys)
