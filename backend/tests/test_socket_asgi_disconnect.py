"""Regression tests for early disconnects at the Socket.IO ASGI boundary."""

import pytest

from app.core.socket import DisconnectSafeSocketIOASGIApp


class StubSocketServer:
    def __init__(self):
        self.events = []

    async def handle_request(self, scope, receive, send):
        self.events.append(await receive())


async def _unused_send(message):
    raise AssertionError(f"No response should be sent by the stub: {message}")


@pytest.mark.asyncio
async def test_socket_http_disconnect_before_request_is_ignored():
    server = StubSocketServer()
    app = DisconnectSafeSocketIOASGIApp(server)

    async def receive():
        return {"type": "http.disconnect"}

    await app(
        {"type": "http", "path": "/socket.io/", "query_string": b"", "headers": []},
        receive,
        _unused_send,
    )

    assert server.events == []


@pytest.mark.asyncio
async def test_socket_websocket_disconnect_before_connect_is_ignored():
    server = StubSocketServer()
    app = DisconnectSafeSocketIOASGIApp(server)

    async def receive():
        return {"type": "websocket.disconnect", "code": 1006}

    await app(
        {"type": "websocket", "path": "/socket.io/", "query_string": b"", "headers": []},
        receive,
        _unused_send,
    )

    assert server.events == []


@pytest.mark.asyncio
async def test_socket_adapter_replays_valid_initial_event():
    server = StubSocketServer()
    app = DisconnectSafeSocketIOASGIApp(server)
    initial_event = {"type": "http.request", "body": b"", "more_body": False}

    async def receive():
        return initial_event

    await app(
        {"type": "http", "path": "/socket.io/", "query_string": b"", "headers": []},
        receive,
        _unused_send,
    )

    assert server.events == [initial_event]
