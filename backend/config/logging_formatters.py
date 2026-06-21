import json
import logging
from datetime import datetime

class JsonFormatter(logging.Formatter):
    def format(self, record):
        # Extract metadata if passed in the log record's 'extra' dictionary
        session_id = getattr(record, 'session_id', None)
        user_id = getattr(record, 'user_id', None)
        event = getattr(record, 'event', None)

        log_data = {
            "timestamp": datetime.utcfromtimestamp(record.created).isoformat() + "Z",
            "level": record.levelname,
            "module": record.module,
            "session_id": session_id,
            "user_id": user_id,
            "event": event or record.funcName,
            "message": record.getMessage()
        }

        # Include traceback details if an exception occurred
        if record.exc_info:
            log_data["exc_info"] = self.formatException(record.exc_info)

        return json.dumps(log_data)
