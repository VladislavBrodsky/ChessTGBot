"""Regression coverage for fail-closed administrator configuration."""

import os
import subprocess
import sys

import pytest

from app.core.config import Settings, get_settings


def _settings() -> Settings:
    return Settings(ENV="production", TESTING=False)


@pytest.fixture(autouse=True)
def clear_settings_cache():
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()


def test_production_rejects_missing_admin_configuration(monkeypatch):
    monkeypatch.delenv("ADMIN_TELEGRAM_IDS", raising=False)
    monkeypatch.delenv("ADMIN_TELEGRAM_ID", raising=False)

    assert _settings().admin_telegram_ids_configuration_error == "missing ADMIN_TELEGRAM_IDS"


@pytest.mark.parametrize("raw", ["", "123,,456", "123,not-an-id", "0", "-1"])
def test_production_rejects_malformed_admin_list(monkeypatch, raw):
    monkeypatch.setenv("ADMIN_TELEGRAM_IDS", raw)
    monkeypatch.delenv("ADMIN_TELEGRAM_ID", raising=False)

    assert _settings().admin_telegram_ids_configuration_error == "malformed ADMIN_TELEGRAM_IDS"


def test_production_accepts_explicit_admin_list(monkeypatch):
    monkeypatch.setenv("ADMIN_TELEGRAM_IDS", "111111,222222")
    monkeypatch.delenv("ADMIN_TELEGRAM_ID", raising=False)

    settings = _settings()
    assert settings.admin_telegram_ids == {111111, 222222}
    assert settings.admin_telegram_ids_configuration_error is None


def test_explicit_legacy_admin_id_remains_supported(monkeypatch):
    monkeypatch.delenv("ADMIN_TELEGRAM_IDS", raising=False)
    monkeypatch.setenv("ADMIN_TELEGRAM_ID", "333333")

    settings = _settings()
    assert settings.admin_telegram_ids == {333333}
    assert settings.admin_telegram_ids_configuration_error is None


def test_test_mode_keeps_local_admin_fixture_ids_when_unconfigured(monkeypatch):
    monkeypatch.delenv("ADMIN_TELEGRAM_IDS", raising=False)
    monkeypatch.delenv("ADMIN_TELEGRAM_ID", raising=False)

    settings = Settings(ENV="development", TESTING=True)
    assert settings.admin_telegram_ids == {1016749901, 716720099}


def test_production_startup_rejects_missing_admin_configuration():
    environment = os.environ.copy()
    environment.update(
        ENV="production",
        SECRET_KEY="test-secret",
        WEBHOOK_SECRET="test-webhook-secret",
    )
    environment.pop("ADMIN_TELEGRAM_IDS", None)
    environment.pop("ADMIN_TELEGRAM_ID", None)

    result = subprocess.run(
        [sys.executable, "-c", "from app.core.config import get_settings; get_settings()"],
        cwd=os.path.dirname(os.path.dirname(__file__)),
        env=environment,
        text=True,
        capture_output=True,
        check=False,
    )

    assert result.returncode != 0
    assert "missing ADMIN_TELEGRAM_IDS" in result.stderr
