import pytest
import uuid
import json
import logging
from httpx import AsyncClient
from app.core.logger import request_id_var, JSONFormatter

@pytest.mark.asyncio
async def test_logging_middleware_generates_id(client: AsyncClient):
    # Call a public endpoint with no X-Request-ID
    response = await client.get("/api/v1/wallet/prices")
    assert response.status_code == 200
    
    # Verify that a request ID was generated and returned in headers
    req_id = response.headers.get("x-request-id")
    assert req_id is not None
    # Must be a valid UUID
    assert uuid.UUID(req_id)

@pytest.mark.asyncio
async def test_logging_middleware_propagates_id(client: AsyncClient):
    # Call a public endpoint passing custom X-Request-ID
    custom_id = "test-correlation-id-12345"
    headers = {"X-Request-ID": custom_id}
    response = await client.get("/api/v1/wallet/prices", headers=headers)
    assert response.status_code == 200
    
    # Verify that the exact same request ID was propagated back
    req_id = response.headers.get("x-request-id")
    assert req_id == custom_id

def test_json_formatter_dict_merging():
    # Setup test logger handler with JSONFormatter
    formatter = JSONFormatter()
    
    # Create a dummy LogRecord
    record = logging.LogRecord(
        name="test_logger",
        level=logging.INFO,
        pathname="test.py",
        lineno=10,
        msg={"event": "user_action", "user_id": 999, "action": "click"},
        args=(),
        exc_info=None
    )
    
    # Format and parse output
    formatted = formatter.format(record)
    parsed = json.loads(formatted)
    
    assert parsed["level"] == "INFO"
    assert parsed["event"] == "user_action"
    assert parsed["user_id"] == 999
    assert parsed["action"] == "click"
    # msg dict should be merged directly, so no stringified msg inside "message" key
    assert "message" not in parsed

def test_json_formatter_string_msg():
    formatter = JSONFormatter()
    record = logging.LogRecord(
        name="test_logger",
        level=logging.WARNING,
        pathname="test.py",
        lineno=15,
        msg="Simple warning message",
        args=(),
        exc_info=None
    )
    formatted = formatter.format(record)
    parsed = json.loads(formatted)
    
    assert parsed["level"] == "WARNING"
    assert parsed["message"] == "Simple warning message"

def test_json_formatter_injects_request_id():
    formatter = JSONFormatter()
    
    # Set request_id context variable
    token = request_id_var.set("correlation-abc-123")
    try:
        record = logging.LogRecord(
            name="test_logger",
            level=logging.ERROR,
            pathname="test.py",
            lineno=20,
            msg="An error occurred",
            args=(),
            exc_info=None
        )
        formatted = formatter.format(record)
        parsed = json.loads(formatted)
        
        assert parsed["level"] == "ERROR"
        assert parsed["message"] == "An error occurred"
        assert parsed["request_id"] == "correlation-abc-123"
    finally:
        request_id_var.reset(token)
