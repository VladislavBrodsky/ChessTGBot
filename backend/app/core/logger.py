import logging
import json
import sys
import time
import contextvars
import uuid

# Context variable to hold the request/correlation ID for the duration of a task
request_id_var = contextvars.ContextVar("request_id", default="")


def exception_summary(exc: BaseException) -> str:
    """Return useful, single-line exception detail even for blank exceptions.

    Several network exceptions (notably ``httpx.ReadTimeout``) have an empty
    string representation.  Logging only ``str(exc)`` made Railway show a
    warning with no cause at all.  The class name is stable and useful while
    avoiding a full repr, which may contain request data or credentials.
    """
    message = str(exc).strip()
    return f"{type(exc).__name__}: {message}" if message else type(exc).__name__

class JSONFormatter(logging.Formatter):
    def format(self, record):
        log_record = {
            "level": record.levelname,
            "timestamp": self.formatTime(record, self.datefmt),
            "name": record.name,
        }
        # Merge dictionary message fields directly into log payload for cleaner JSON structure
        if isinstance(record.msg, dict):
            log_record.update(record.msg)
        else:
            log_record["message"] = record.getMessage()

        # Inject request_id context variable if present
        req_id = request_id_var.get()
        if req_id:
            log_record["request_id"] = req_id

        if record.exc_info:
            log_record["exception"] = self.formatException(record.exc_info)
        return json.dumps(log_record)

def setup_logging():
    # Railway assigns severity from the stream for non-JSON output.  Send the
    # JSON stream to stdout and let its explicit `level` field carry severity.
    # This also gives Uvicorn startup messages the correct INFO severity once
    # their loggers are routed through this handler below.
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(JSONFormatter())
    
    handlers = [handler]
    try:
        from app.core.alerts import TelegramAlertHandler
        alert_handler = TelegramAlertHandler()
        alert_handler.setLevel(logging.ERROR)
        handlers.append(alert_handler)
    except Exception as e:
        print(f"[Logger] Failed to initialize TelegramAlertHandler: {e}")
        
    logging.basicConfig(level=logging.INFO, handlers=handlers, force=True)

    # Uvicorn installs dedicated stderr handlers before importing the ASGI app.
    # Its normal startup INFO records were therefore classified by Railway as
    # errors.  Route all Uvicorn records through the root JSON handler instead.
    for logger_name in ("uvicorn", "uvicorn.error", "uvicorn.access"):
        uvicorn_logger = logging.getLogger(logger_name)
        uvicorn_logger.handlers.clear()
        uvicorn_logger.propagate = True

    # httpx logs every request URL at INFO — for Telegram Bot API calls the URL
    # contains the bot token (api.telegram.org/bot<TOKEN>/...), which would put
    # the token in plaintext in production logs on every call. WARNING and above
    # only; httpcore silenced likewise since it can echo the same URLs.
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("httpcore").setLevel(logging.WARNING)

class LoggingMiddleware:
    """Pure ASGI middleware for request logging and Request-ID propagation.
    
    Uses raw ASGI protocol instead of BaseHTTPMiddleware to avoid
    interfering with CORSMiddleware's preflight (OPTIONS) handling.
    """
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        # 1. Retrieve or generate Request/Correlation ID
        request_id = ""
        for key, value in scope.get("headers", []):
            if key == b"x-request-id":
                request_id = value.decode("latin-1")
                break
        if not request_id:
            request_id = str(uuid.uuid4())

        # Set request_id in contextvars for downstream async tasks
        token = request_id_var.set(request_id)

        start_time = time.time()
        status_code = None

        # Inject X-Request-ID response header
        async def send_wrapper(message):
            nonlocal status_code
            if message["type"] == "http.response.start":
                status_code = message.get("status", 0)
                headers = list(message.get("headers", []))
                headers.append((b"x-request-id", request_id.encode("latin-1")))
                message = {**message, "headers": headers}
            await send(message)

        try:
            await self.app(scope, receive, send_wrapper)
        finally:
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
            # Reset contextvars token to prevent leakage
            request_id_var.reset(token)
