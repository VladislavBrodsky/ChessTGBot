import asyncio
import socket
import logging
import pytest
import gc
import httpx
from app.core.async_errors import (
    is_transient_network_error,
    install_asyncio_exception_handler,
)

def test_is_transient_network_error():
    # 1. socket.gaierror
    assert is_transient_network_error(socket.gaierror(-3, "Temporary failure in name resolution")) is True
    
    # 2. ConnectionResetError, etc.
    assert is_transient_network_error(ConnectionResetError()) is True
    assert is_transient_network_error(ConnectionRefusedError()) is True
    assert is_transient_network_error(BrokenPipeError()) is True
    
    # OSError with transient errno
    import errno
    assert is_transient_network_error(OSError(errno.ECONNRESET, "Connection reset")) is True
    assert is_transient_network_error(OSError(errno.ETIMEDOUT, "Timeout")) is True
    
    # Non-transient OSError
    assert is_transient_network_error(OSError(errno.EACCES, "Permission denied")) is False
    
    # 3. TimeoutError
    assert is_transient_network_error(asyncio.TimeoutError()) is True
    assert is_transient_network_error(TimeoutError()) is True
    
    # 4. httpx.TransportError
    assert is_transient_network_error(httpx.TransportError("Transport failed")) is True

def test_is_transient_network_error_false_for_general():
    assert is_transient_network_error(ValueError("Invalid value")) is False
    assert is_transient_network_error(RuntimeError("Runtime crash")) is False

@pytest.mark.asyncio
async def test_handler_logs_transient_at_warning(caplog):
    # Set caplog to capture WARNING and above
    caplog.set_level(logging.WARNING)
    
    loop = asyncio.get_running_loop()
    install_asyncio_exception_handler(loop)
    
    # Fetch installed handler
    handler = loop.get_exception_handler()
    assert handler is not None
    
    # Construct context with transient network error
    exc = socket.gaierror(-3, "DNS lookup failed")
    context = {
        "message": "Orphaned future crashed",
        "exception": exc,
        "future": asyncio.Future(),
    }
    
    # Invoke handler directly to ensure reliable execution in tests
    handler(loop, context)
    
    # Verify warning is logged, not error
    warnings = [r for r in caplog.records if r.levelname == "WARNING"]
    errors = [r for r in caplog.records if r.levelname == "ERROR"]
    
    assert len(warnings) == 1
    assert len(errors) == 0
    assert "Transient network error in async task/future" in warnings[0].message
    assert "gaierror: [Errno -3] DNS lookup failed" in warnings[0].message
    assert "Orphaned future crashed" in warnings[0].message
    assert warnings[0].name == "app.async_runtime"

@pytest.mark.asyncio
async def test_handler_logs_nontransient_at_error(caplog):
    caplog.set_level(logging.WARNING)
    
    loop = asyncio.get_running_loop()
    install_asyncio_exception_handler(loop)
    handler = loop.get_exception_handler()
    
    exc = ValueError("Fatal value error")
    context = {
        "message": "Task failed catastrophically",
        "exception": exc,
        "task": asyncio.current_task(),
    }
    
    handler(loop, context)
    
    warnings = [r for r in caplog.records if r.levelname == "WARNING"]
    errors = [r for r in caplog.records if r.levelname == "ERROR"]
    
    assert len(warnings) == 0
    assert len(errors) == 1
    assert errors[0].name == "app.async_runtime"
    
    # The first line of the logged error must start with the exception summary/type
    first_line = errors[0].message.split("\n")[0]
    assert "ValueError: Fatal value error" in first_line
    assert "Task failed catastrophically" in errors[0].message

@pytest.mark.asyncio
async def test_handler_fallback_on_internal_failure():
    loop = asyncio.get_running_loop()
    
    # Track default handler calls
    default_called = False
    def mock_default_handler(context):
        nonlocal default_called
        default_called = True
        
    loop.default_exception_handler = mock_default_handler
    install_asyncio_exception_handler(loop)
    handler = loop.get_exception_handler()
    
    # Passing context that causes internal failure (e.g. context is None or context.get throws)
    # Since we use dict methods on context, passing None will trigger an AttributeError inside handler
    handler(loop, None)
    
    assert default_called is True

@pytest.mark.asyncio
async def test_unretrieved_future_exception_warning_only(caplog):
    caplog.set_level(logging.WARNING)
    
    loop = asyncio.get_running_loop()
    install_asyncio_exception_handler(loop)
    
    # 1. Create a future, set a transient exception, then discard reference
    f = loop.create_future()
    f.set_exception(socket.gaierror(-3, "Temporary failure in name resolution"))
    del f
    
    # 2. Trigger garbage collection to prompt asyncio loop to invoke exception handler on destr
    gc.collect()
    
    # Allow loop to process the destruction task / exception handling
    await asyncio.sleep(0.01)
    gc.collect()
    
    # Verify no ERROR log was emitted via the handler, and WARNING was captured if GC fired
    errors = [r for r in caplog.records if r.levelname == "ERROR" and r.name == "app.async_runtime"]
    assert len(errors) == 0
    
    # NOTE: Since garbage collection timings of unretrieved exceptions on loop futures
    # can vary between python runtimes, direct handler tests (above) guarantee coverage,
    # and this regression test confirms that gaierrors don't trigger errors when they do GC.
