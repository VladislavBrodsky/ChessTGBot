"""Regression coverage for fail-closed administrator configuration."""

import os
import subprocess
import sys

import pytest

from app.core.config import Settings


def _settings() -> Settings:
    return Settings(_env_file=None, ENV="production", TESTING=False)


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


def test_production_startup_rejects_missing_admin_configuration(tmp_path):
    environment = os.environ.copy()
    environment.update(
        ENV="production",
        SECRET_KEY="test-secret",
        WEBHOOK_SECRET="test-webhook-secret",
    )
    environment.pop("ADMIN_TELEGRAM_IDS", None)
    environment.pop("ADMIN_TELEGRAM_ID", None)
    backend_path = os.path.dirname(os.path.dirname(__file__))
    environment["PYTHONPATH"] = os.pathsep.join(filter(None, [
        backend_path, environment.get("PYTHONPATH"),
    ]))

    result = subprocess.run(
        [sys.executable, "-c", "from app.core.config import get_settings; get_settings()"],
        cwd=tmp_path,
        env=environment,
        text=True,
        capture_output=True,
        check=False,
    )

    assert result.returncode != 0
    assert "missing ADMIN_TELEGRAM_IDS" in result.stderr


def test_admin_ids_are_loaded_from_dotenv(tmp_path, monkeypatch):
    monkeypatch.delenv("ADMIN_TELEGRAM_IDS", raising=False)
    monkeypatch.delenv("ADMIN_TELEGRAM_ID", raising=False)
    env_file = tmp_path / ".env"
    env_file.write_text("ENV=production\nADMIN_TELEGRAM_IDS=444444,555555\n")

    settings = Settings(_env_file=env_file, TESTING=False)
    assert settings.admin_telegram_ids == {444444, 555555}
    assert settings.admin_telegram_ids_configuration_error is None


def test_malformed_dotenv_admin_ids_do_not_grant_partial_access(tmp_path, monkeypatch):
    monkeypatch.delenv("ADMIN_TELEGRAM_IDS", raising=False)
    monkeypatch.delenv("ADMIN_TELEGRAM_ID", raising=False)
    env_file = tmp_path / ".env"
    env_file.write_text("ENV=production\nADMIN_TELEGRAM_IDS=444444,invalid\n")

    settings = Settings(_env_file=env_file, TESTING=False)
    assert settings.admin_telegram_ids == set()
    assert settings.admin_telegram_ids_configuration_error == "malformed ADMIN_TELEGRAM_IDS"


def test_process_admin_ids_override_dotenv(tmp_path, monkeypatch):
    monkeypatch.setenv("ADMIN_TELEGRAM_IDS", "666666")
    monkeypatch.delenv("ADMIN_TELEGRAM_ID", raising=False)
    env_file = tmp_path / ".env"
    env_file.write_text("ENV=production\nADMIN_TELEGRAM_IDS=444444,555555\n")

    assert Settings(_env_file=env_file, TESTING=False).admin_telegram_ids == {666666}


def test_legacy_admin_id_is_loaded_from_dotenv(tmp_path, monkeypatch):
    monkeypatch.delenv("ADMIN_TELEGRAM_IDS", raising=False)
    monkeypatch.delenv("ADMIN_TELEGRAM_ID", raising=False)
    env_file = tmp_path / ".env"
    env_file.write_text("ENV=production\nADMIN_TELEGRAM_ID=777777\n")

    assert Settings(_env_file=env_file, TESTING=False).admin_telegram_ids == {777777}
