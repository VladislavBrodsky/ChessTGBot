import logging
import json
import time

class JSONFormatter(logging.Formatter):
    def format(self, record):
        log_record = {
            "level": record.levelname,
            "message": record.getMessage(),
            "timestamp": self.formatTime(record, self.datefmt),
            "name": record.name,
        }
        if record.exc_info:
            log_record["exception"] = self.formatException(record.exc_info)
        return json.dumps(log_record)

def setup_logging():
    handler = logging.StreamHandler()
    handler.setFormatter(JSONFormatter())
    logging.basicConfig(level=logging.INFO, handlers=[handler], force=True)

class LoggingMiddleware:
    """Pure ASGI middleware for request logging.
    
    Uses raw ASGI protocol instead of BaseHTTPMiddleware to avoid
    interfering with CORSMiddleware's preflight (OPTIONS) handling.
    """
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        start_time = time.time()
        status_code = None

        async def send_wrapper(message):
            nonlocal status_code
            if message["type"] == "http.response.start":
                status_code = message.get("status", 0)
            await send(message)

        await self.app(scope, receive, send_wrapper)

        process_time = time.time() - start_time
        method = scope.get("method", "UNKNOWN")
        path = scope.get("path", "/")
        logging.info({
            "event": "http_request",
            "method": method,
            "path": path,
            "status_code": status_code,
            "process_time_ms": round(process_time * 1000, 2),
        })

