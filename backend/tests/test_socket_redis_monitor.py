"""Tests for sustained Socket.IO Redis pub/sub outage monitoring."""

import logging

from app.core.socket import MonitoredAsyncRedisManager


def _manager() -> MonitoredAsyncRedisManager:
    # Construction does not open a connection; the manager connects only when
    # its background listener starts, so this remains a pure unit test.
    return MonitoredAsyncRedisManager("redis://localhost:6379/0")


def test_sustained_pubsub_outage_alerts_once_then_recovers(caplog):
    manager = _manager()
    failure = ConnectionError("Redis connection lost")

    with caplog.at_level(logging.INFO, logger="app.core.socket"):
        manager._record_listener_failure(failure, now=100.0)
        manager._record_listener_failure(failure, now=159.0)
        assert not any(record.levelno >= logging.ERROR for record in caplog.records)

        manager._record_listener_failure(failure, now=160.0)
        alerts = [record for record in caplog.records if record.levelno >= logging.ERROR]
        assert len(alerts) == 1
        assert "pub/sub unavailable for 60s" in alerts[0].getMessage()
        assert "cross-instance realtime delivery is degraded" in alerts[0].getMessage()

        # Do not spam the error stream while the same outage continues.
        manager._record_listener_failure(failure, now=200.0)
        assert len([record for record in caplog.records if record.levelno >= logging.ERROR]) == 1

        manager._record_listener_recovery(now=205.0)
        assert any("pub/sub listener recovered after 105s" in record.getMessage() for record in caplog.records)
        assert manager._listener_failure_started_at is None
        assert manager._listener_failure_count == 0


def test_pubsub_outage_emits_a_reminder_after_ten_minutes(caplog):
    manager = _manager()
    failure = ConnectionError("Redis connection lost")

    with caplog.at_level(logging.ERROR, logger="app.core.socket"):
        manager._record_listener_failure(failure, now=0.0)
        manager._record_listener_failure(failure, now=60.0)
        manager._record_listener_failure(failure, now=659.0)
        manager._record_listener_failure(failure, now=660.0)

    assert len([record for record in caplog.records if record.levelno >= logging.ERROR]) == 2
