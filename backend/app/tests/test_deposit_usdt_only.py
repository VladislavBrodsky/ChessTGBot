"""Unit tests for the USDT-only deposit guard (_is_usdt_master).

Every deposit credit path — the interactive /deposit/verify, the webhook, and
the background crawler — gates crediting on this function so the platform only
ever takes custody of USDT (never a volatile asset credited at a USD price).
Pure unit tests: no DB, no network.
"""
from app.api.v1.endpoints.wallet import _is_usdt_master, convert_ton_address_to_hex
from app.core.config import get_settings


def test_usdt_master_matches():
    s = get_settings()
    assert _is_usdt_master(s.USDT_MASTER) is True


def test_non_usdt_stablecoin_rejected():
    # USDC is a stablecoin but we settle strictly in USDT.
    s = get_settings()
    assert _is_usdt_master(s.USDC_MASTER) is False


def test_volatile_assets_rejected():
    s = get_settings()
    assert _is_usdt_master(s.BTC_MASTER) is False
    assert _is_usdt_master(s.ETH_MASTER) is False


def test_garbage_and_empty_rejected():
    assert _is_usdt_master("") is False
    assert _is_usdt_master("not-a-real-address") is False
    assert _is_usdt_master(None) is False  # type: ignore[arg-type]


def test_usdt_master_matches_across_address_formats():
    # The same USDT master expressed in raw hex must still match the configured
    # user-friendly form — the guard normalizes both sides.
    s = get_settings()
    raw_hex = convert_ton_address_to_hex(s.USDT_MASTER)
    assert raw_hex != s.USDT_MASTER  # sanity: formats actually differ
    assert _is_usdt_master(raw_hex) is True
