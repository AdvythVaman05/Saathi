import time
from django.test import TestCase
from apps.speech.connection_manager import RealtimeConnectionManager
from apps.speech.session_manager import RealtimeSessionManager
from apps.speech import transport_events

class RealtimeTransportTestCase(TestCase):
    
    def setUp(self):
        self.conn_manager = RealtimeConnectionManager(heartbeat_timeout_seconds=2)
        self.sess_manager = RealtimeSessionManager(stale_timeout_seconds=3)

    def test_heartbeat_validation(self):
        # Add connection and record heartbeat
        self.conn_manager.add_connection("channel_1", "session_A")
        
        # Verify not stale initially
        stale = self.conn_manager.find_stale_connections()
        self.assertNotIn("channel_1", stale)

        # Record heartbeat
        self.conn_manager.record_heartbeat("channel_1")
        
        # Sleep past timeout limit (2 seconds)
        time.sleep(2.5)
        stale = self.conn_manager.find_stale_connections()
        self.assertIn("channel_1", stale)

    def test_stale_session_cleanup(self):
        # Create session
        sess = self.sess_manager.get_or_create_session("session_A")
        self.assertEqual(sess.session_id, "session_A")
        self.assertTrue(sess.is_connected)

        # Mark disconnected
        self.sess_manager.mark_disconnected("session_A")
        self.assertFalse(sess.is_connected)

        # Verify not cleaned up immediately
        removed = self.sess_manager.cleanup_stale_sessions()
        self.assertEqual(removed, 0)

        # Sleep past timeout (3 seconds)
        time.sleep(3.5)
        removed = self.sess_manager.cleanup_stale_sessions()
        self.assertEqual(removed, 1)
        self.assertNotIn("session_A", self.sess_manager.sessions)

    def test_reconnect_handling_and_recovery_buffer(self):
        # Create session and write audio chunks
        sess = self.sess_manager.get_or_create_session("session_B")
        sess.add_audio_packet(b'\x01\x02')
        sess.add_audio_packet(b'\x03\x04')

        self.assertEqual(sess.last_packet_seq, 2)
        self.assertEqual(len(sess.audio_buffer), 2)

        # Simulate disconnect
        self.sess_manager.mark_disconnected("session_B")
        self.assertFalse(sess.is_connected)

        # Simulate reconnect within threshold window
        sess_reconnect = self.sess_manager.get_or_create_session("session_B")
        self.assertTrue(sess_reconnect.is_connected)
        self.assertEqual(sess_reconnect.last_packet_seq, 2)  # Sequence must persist!

    def test_event_payload_contracts(self):
        ack = transport_events.make_heartbeat_ack()
        self.assertEqual(ack["type"], "heartbeat_ack")

        restore = transport_events.make_session_restored("session_C", 14)
        self.assertEqual(restore["type"], "session_restore_response")
        self.assertEqual(restore["payload"]["last_packet_seq"], 14)
