import pytest
from tonsdk.contract.wallet import Wallets, WalletVersionEnum
from tonsdk.crypto import mnemonic_new

from app.services.payout_service import resolve_master_wallet
from app.services.ton_wallet_w5 import WalletV5R1


@pytest.fixture(scope="module")
def keys():
    words = mnemonic_new(24)
    _m, pub, priv, v4 = Wallets.from_mnemonics(words, WalletVersionEnum.v4r2, 0)
    w5 = WalletV5R1(bytes(pub), bytes(priv))
    return words, v4.address, w5.address


def test_w5_master_address_signs_with_w5(keys):
    words, _v4, w5 = keys
    wallet = resolve_master_wallet(words, w5.to_string(True, True, False))
    assert wallet.version == "w5r1"
    assert wallet.address.to_string(False) == w5.to_string(False)


def test_v4r2_master_address_still_signs_with_v4r2(keys):
    words, v4, _w5 = keys
    wallet = resolve_master_wallet(words, v4.to_string(True, True, True))  # bounceable form too
    assert wallet.version == "v4r2"


def test_payout_wallet_must_match_configured_custody_address(keys):
    words, _v4, _w5 = keys
    with pytest.raises(ValueError, match="does not match"):
        resolve_master_wallet(words, "UQD_n02bdxQxFztKTXpWBaFDxo713qIuETyefIeK7wiUB0DN")


def test_invalid_custody_address_is_refused(keys):
    words, _v4, _w5 = keys
    with pytest.raises(ValueError, match="Invalid MASTER_WALLET_ADDRESS"):
        resolve_master_wallet(words, "not-an-address")


def test_built_messages_target_the_master_wallet(keys):
    words, _v4, w5 = keys
    wallet = resolve_master_wallet(words, w5.to_string(True, True, False))
    first = wallet.build("UQBLskkIFM4reaQOwCGpN6og_DPMSQzfzOT-phdzeXny5BUa", 1, 0, None)
    later = wallet.build("UQBLskkIFM4reaQOwCGpN6og_DPMSQzfzOT-phdzeXny5BUa", 1, 5, None)
    # seqno 0 carries the state init that deploys the wallet; later ones do not.
    assert len(first.refs) > len(later.refs)
