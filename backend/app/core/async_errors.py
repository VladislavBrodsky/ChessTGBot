import logging
import asyncio
import socket
import errno
import httpx
from app.core.logger import exception_summary

logger = logging.getLogger("app.async_runtime")

def is_transient_network_error(exc: BaseException) -> bool:
    """True for transient network errors (DNS failures, connection drops, socket timeouts)
    that occur on orphaned tasks/futures and should be logged as warnings instead of paging admins.
    """
    if isinstance(exc, socket.gaierror):
        return True

    if isinstance(exc, (ConnectionResetError, ConnectionRefusedError, BrokenPipeError)):
        return True

    if isinstance(exc, OSError):
        # Transient socket/OS error codes
        transient_errnos = {
            errno.ECONNRESET,
            errno.ECONNREFUSED,
            errno.EPIPE,
            errno.ETIMEDOUT,
            errno.EHOSTUNREACH,
            errno.ENETUNREACH,
        }
        if exc.errno in transient_errnos:
            return True

    if isinstance(exc, (asyncio.TimeoutError, TimeoutError)):
        return True

    if isinstance(exc, httpx.TransportError):
        return True

    return False

def install_asyncio_exception_handler(loop: asyncio.AbstractEventLoop):
    """Installs a custom exception handler on the asyncio loop to route transient errors
    on orphaned futures to WARNING and non-transient errors to ERROR (which alerts admins).
    """
    def handler(loop, context):
        try:
            exc = context.get("exception")
            message = context.get("message", "Unhandled exception in event loop")
            future = context.get("future")
            task = context.get("task")

            ref = task or future
            ref_repr = repr(ref) if ref else "None"

            if exc is not None:
                if is_transient_network_error(exc):
                    # Transient error: log as warning
                    summary = exception_summary(exc)
                    logger.warning(
                        f"Transient network error in async task/future: {summary}\n"
                        f"Message: {message}\n"
                        f"Future/Task: {ref_repr}"
                    )
                else:
                    # Non-transient error: log as error with exc_info so it pages admins
                    summary = exception_summary(exc)
                    logger.error(
                        f"Unhandled error in async task/future: {summary}\n"
                        f"Message: {message}\n"
                        f"Future/Task: {ref_repr}",
                        exc_info=exc
                    )
            else:
                # No exception in context (message only)
                logger.error(
                    f"Unhandled async loop message: {message}\n"
                    f"Future/Task: {ref_repr}"
                )
        except Exception:
            # Fall back to default handler if custom handler itself crashes
            try:
                loop.default_exception_handler(context)
            except Exception:
                pass

    loop.set_exception_handler(handler)
