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

REPEAT_WINDOW_SECONDS = 60.0
REPEAT_MAX_KEYS = 1000


class RepeatCollapsingHandler(logging.StreamHandler):
    """Stdout handler that collapses repeated warnings/errors.

    Railway rate-limits log lines per replica, so an error storm (the same
    failure with a full traceback hundreds of times a minute) used to push out
    every other line, including the first, most useful traceback. The first
    WARNING+ record of each kind is written in full; identical ones (same
    logger, call site, level, exception type and normalized first line) within
    REPEAT_WINDOW_SECONDS are only counted. When the window closes, one summary
    line reports how many were suppressed. INFO records always pass through,
    and so drive the summaries promptly. Telegram alerts are a separate handler
    with their own rate limit and are unaffected.
    """

    def __init__(self, stream=None, window: float = REPEAT_WINDOW_SECONDS, clock=time.monotonic):
        super().__init__(stream)
        self.window = window
        self.clock = clock
        self._seen: dict[tuple, list] = {}  # key -> [window_start, suppressed, sample record]

    @staticmethod
    def _key(record: logging.LogRecord) -> tuple:
        try:
            from app.core.alerts import normalize_message
            text = normalize_message(record.getMessage())
        except Exception:
            text = str(record.msg)[:120]
        exc_type = record.exc_info[0].__name__ if record.exc_info and record.exc_info[0] else ""
        return (record.name, record.pathname, record.lineno, record.levelno, exc_type, text)

    def _summary(self, sample: logging.LogRecord, suppressed: int, seconds: float) -> logging.LogRecord:
        first_line = sample.getMessage().split("\n", 1)[0][:200]
        return logging.LogRecord(
            sample.name, sample.levelno, sample.pathname, sample.lineno,
            f"Previous message repeated {suppressed} more times in {seconds:.0f}s (suppressed): {first_line}",
            None, None)

    def _flush_expired(self, now: float, force: bool = False) -> None:
        for key, (start, suppressed, sample) in list(self._seen.items()):
            if force or now - start >= self.window:
                del self._seen[key]
                if suppressed:
                    super().emit(self._summary(sample, suppressed, now - start))

    def emit(self, record: logging.LogRecord) -> None:
        try:
            now = self.clock()
            self.acquire()
            try:
                self._flush_expired(now)
                if record.levelno < logging.WARNING:
                    super().emit(record)
                    return
                key = self._key(record)
                entry = self._seen.get(key)
                if entry is not None:
                    entry[1] += 1
                    return
                if len(self._seen) >= REPEAT_MAX_KEYS:
                    self._seen.pop(next(iter(self._seen)))
                self._seen[key] = [now, 0, record]
            finally:
                self.release()
            super().emit(record)
        except Exception:
            self.handleError(record)

    def close(self) -> None:
        try:
            self._flush_expired(self.clock(), force=True)
        finally:
            super().close()


def setup_logging():
    # Railway assigns severity from the stream for non-JSON output.  Send the
    # JSON stream to stdout and let its explicit `level` field carry severity.
    # This also gives Uvicorn startup messages the correct INFO severity once
    # their loggers are routed through this handler below.
    handler = RepeatCollapsingHandler(sys.stdout)
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
