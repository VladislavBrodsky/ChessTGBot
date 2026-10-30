from types import SimpleNamespace

import pytest
from tonsdk.utils import Address

from app.services.payout_service import _require_matching_master_wallet


def test_payout_wallet_must_match_configured_custody_address():
    wallet = SimpleNamespace(address=Address("UQBLskkIFM4reaQOwCGpN6og_DPMSQzfzOT-phdzeXny5BUa"))
    _require_matching_master_wallet(wallet, "EQBLskkIFM4reaQOwCGpN6og_DPMSQzfzOT-phdzeXny5Ejf")

    with pytest.raises(ValueError, match="does not match"):
        _require_matching_master_wallet(wallet, "UQD_n02bdxQxFztKTXpWBaFDxo713qIuETyefIeK7wiUB0DN")
