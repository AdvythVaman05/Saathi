# Transport event contracts for the Realtime Audio Stream

# 1. Event Type Constants
EVENT_HEARTBEAT = "heartbeat"
EVENT_HEARTBEAT_ACK = "heartbeat_ack"
EVENT_AUDIO_CHUNK = "audio_chunk"
EVENT_SESSION_RESTORE_REQ = "session_restore_request"
EVENT_SESSION_RESTORE_RESP = "session_restore_response"
EVENT_ERROR = "transport_error"

# 2. Event Payload Validators / Formatter functions
def make_heartbeat_ack():
    return {
        "type": EVENT_HEARTBEAT_ACK,
        "payload": {}
    }

def make_session_restored(session_id, last_packet_seq):
    return {
        "type": EVENT_SESSION_RESTORE_RESP,
        "payload": {
            "session_id": session_id,
            "restored": True,
            "last_packet_seq": last_packet_seq
        }
    }

def make_error_event(message):
    return {
        "type": EVENT_ERROR,
        "payload": {
            "message": message
        }
    }
