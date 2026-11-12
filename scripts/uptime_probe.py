#!/usr/bin/env python3
"""External uptime probe for the three production services.

Run every 5 minutes by .github/workflows/uptime.yml, from outside Railway, so an
outage that takes the backend (and its own alerting) down is still noticed.

A target is DOWN only after three consecutive failed attempts, so a single slow
response or a deploy restart does not page anyone. Alerts go to Telegram when
TELEGRAM_BOT_TOKEN and ALERT_CHAT_ID are set, and only on a state change:
PREVIOUS_STATE (the last completed run's conclusion) decides whether this run
sends "down", "recovered" or nothing. The exit code is non-zero while anything is
down, so the failed run itself is a second alert channel (GitHub emails the
owner when a scheduled workflow fails).

Standard library only; stdlib urllib keeps the workflow dependency-free.
"""
from __future__ import annotations

import base64
import json
import os
import socket
import ssl
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import dataclass
from typing import Callable, Optional

ATTEMPTS = int(os.getenv("PROBE_ATTEMPTS", "3"))
RETRY_DELAY_SECONDS = float(os.getenv("PROBE_RETRY_DELAY", "15"))
TIMEOUT_SECONDS = 10
USER_AGENT = "web3chess-uptime-probe/1.0"


@dataclass(frozen=True)
class Target:
    name: str
    url: str
    check: Callable[[int, bytes], Optional[str]]  # returns an error, or None when healthy


def _status_200(status: int, body: bytes) -> Optional[str]:
    return None if status == 200 else f"HTTP {status}"


def _api_health(status: int, body: bytes) -> Optional[str]:
    # /health checks Postgres and Redis and returns 500 with a detail when either is down.
    try:
        payload = json.loads(body or b"{}")
    except ValueError:
        payload = {}
    if status == 200 and payload.get("status") == "ok":
        return None
    detail = payload.get("detail") or payload.get("status") or "unexpected body"
    return f"HTTP {status}: {detail}"


def _websocket_upgrade(status: int, body: bytes) -> Optional[str]:
    # Production Socket.IO is websocket-only, so the handshake is an HTTP upgrade.
    return None if status == 101 else f"HTTP {status}: websocket upgrade refused"


TARGETS = [
    Target("Backend API (DB + Redis)", "https://api.web3chess.online/health", _api_health),
    Target("Realtime (Socket.IO)", "wss://api.web3chess.online/socket.io/?EIO=4&transport=websocket", _websocket_upgrade),
    Target("Mini App", "https://app.web3chess.online/", _status_200),
    Target("Website", "https://web3chess.online/", _status_200),
]


def _websocket_status(url: str) -> tuple[int, bytes]:
    """Open a TLS connection, send a WebSocket upgrade request, return the status line's code."""
    parts = urllib.parse.urlsplit(url)
    host, path = parts.hostname, f"{parts.path}?{parts.query}"
    key = base64.b64encode(os.urandom(16)).decode()
    request = (f"GET {path} HTTP/1.1\r\nHost: {host}\r\nUpgrade: websocket\r\nConnection: Upgrade\r\n"
               f"Sec-WebSocket-Key: {key}\r\nSec-WebSocket-Version: 13\r\n"
               f"Origin: https://app.web3chess.online\r\nUser-Agent: {USER_AGENT}\r\n\r\n")
    with socket.create_connection((host, parts.port or 443), timeout=TIMEOUT_SECONDS) as raw:
        with ssl.create_default_context().wrap_socket(raw, server_hostname=host) as conn:
            conn.sendall(request.encode())
            head = conn.recv(1024)
    status_line = head.split(b"\r\n", 1)[0].split()
    return (int(status_line[1]) if len(status_line) > 1 else 0), head


def fetch(url: str) -> tuple[int, bytes]:
    if url.startswith("wss://"):
        return _websocket_status(url)
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    try:
        with urllib.request.urlopen(req, timeout=TIMEOUT_SECONDS) as res:
            return res.status, res.read(4096)
    except urllib.error.HTTPError as exc:
        return exc.code, exc.read(4096)


def probe(target: Target, fetcher=fetch, sleep=time.sleep) -> Optional[str]:
    """None when healthy; otherwise the last attempt's error after ATTEMPTS tries."""
    error: Optional[str] = None
    for attempt in range(ATTEMPTS):
        if attempt:
            sleep(RETRY_DELAY_SECONDS)
        try:
            status, body = fetcher(target.url)
            error = target.check(status, body)
        except Exception as exc:  # timeouts, DNS, TLS, connection refused
            error = f"{type(exc).__name__}: {exc}"[:200]
        if error is None:
            return None
    return error


def decide_alert(failures: dict[str, str], previous_state: str) -> Optional[str]:
    """The Telegram text to send this run, or None. Alerts only on a state change."""
    was_down = previous_state == "failure"
    if failures and not was_down:
        lines = "\n".join(f"• {name}: {err}" for name, err in failures.items())
        return f"🔴 Web3Chess DOWN\n{lines}\n\nChecked {ATTEMPTS}x from GitHub Actions."
    if not failures and was_down:
        return "🟢 Web3Chess recovered — all services healthy again."
    return None


def send_telegram(text: str) -> None:
    token, chat_id = os.getenv("TELEGRAM_BOT_TOKEN"), os.getenv("ALERT_CHAT_ID")
    if not token or not chat_id:
        print("::warning::TELEGRAM_BOT_TOKEN / ALERT_CHAT_ID not set; Telegram alert skipped")
        return
    data = urllib.parse.urlencode({"chat_id": chat_id, "text": text, "disable_web_page_preview": "true"}).encode()
    req = urllib.request.Request(f"https://api.telegram.org/bot{token}/sendMessage", data=data,
                                 headers={"User-Agent": USER_AGENT})
    try:
        with urllib.request.urlopen(req, timeout=TIMEOUT_SECONDS) as res:
            print(f"Telegram alert sent (HTTP {res.status})")
    except Exception as exc:  # never let the alert path hide the probe result
        print(f"::warning::Telegram alert failed: {type(exc).__name__}")


def main() -> int:
    failures: dict[str, str] = {}
    for target in TARGETS:
        error = probe(target)
        print(f"{'OK  ' if error is None else 'DOWN'} {target.name} — {target.url}" + (f" — {error}" if error else ""))
        if error:
            failures[target.name] = error
    alert = decide_alert(failures, os.getenv("PREVIOUS_STATE", ""))
    if alert:
        send_telegram(alert)
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
