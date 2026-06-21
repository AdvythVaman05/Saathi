import time
import logging

logger = logging.getLogger('apps.speech')

class ActiveConnection:
    def __init__(self, channel_name: str, session_id: str):
        self.channel_name = channel_name
        self.session_id = session_id
        self.connected_at = time.time()
        self.last_heartbeat = time.time()

    def record_heartbeat(self):
        self.last_heartbeat = time.time()

class RealtimeConnectionManager:
    def __init__(self, heartbeat_timeout_seconds=15):
        self.connections = {} # Map channel_name to ActiveConnection
        self.heartbeat_timeout = heartbeat_timeout_seconds

    def add_connection(self, channel_name: str, session_id: str) -> ActiveConnection:
        logger.info(f"Adding active socket connection: channel={channel_name}, session={session_id}")
        conn = ActiveConnection(channel_name, session_id)
        self.connections[channel_name] = conn
        return conn

    def remove_connection(self, channel_name: str):
        if channel_name in self.connections:
            logger.info(f"Removing active socket connection: channel={channel_name}")
            del self.connections[channel_name]

    def record_heartbeat(self, channel_name: str):
        if channel_name in self.connections:
            self.connections[channel_name].record_heartbeat()

    def find_stale_connections(self) -> list:
        """
        Identify connections that have not responded to heartbeats 
        within the threshold limit (e.g. 15 seconds).
        """
        now = time.time()
        stale_channels = []
        for channel_name, conn in self.connections.items():
            if (now - conn.last_heartbeat) > self.heartbeat_timeout:
                stale_channels.append(channel_name)
        return stale_channels
