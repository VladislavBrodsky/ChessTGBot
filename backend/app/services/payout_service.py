import asyncio
import base64
import time
import httpx
import logging
from dataclasses import dataclass
from typing import Callable, Optional
from app.core.config import get_settings
from tonsdk.boc import Cell
from tonsdk.contract.wallet import Wallets, WalletVersionEnum
from tonsdk.contract.token.ft.jetton_wallet import JettonWallet
from tonsdk.utils import Address
from app.services.ton_wallet_w5 import WalletV5R1

logger = logging.getLogger(__name__)

# W5 requests carry an expiry; a stale signed message cannot be replayed later.
W5_VALIDITY_SECONDS = 120

# A wallet accepts exactly one message per seqno. Every on-chain send in this
# process (withdrawals, owner/admin approvals, gas grants) fetches the seqno,
# signs, broadcasts and waits for the seqno to advance under this lock, so
# two concurrent payouts can never sign the same seqno and silently drop one.
# The backend runs as a single replica; process_payouts_backlog is a manual
# script and must not run while the service is processing payouts.
_SEND_LOCK = asyncio.Lock()
SEQNO_ADVANCE_TIMEOUT_SECONDS = 60
SEQNO_POLL_SECONDS = 3


class BlockchainBroadcastError(Exception):
    def __init__(self, message: str, msg_hash: str):
        super().__init__(message)
        self.msg_hash = msg_hash


@dataclass
class MasterWallet:
    """The custody wallet the payout mnemonic controls, in whichever version
    MASTER_WALLET_ADDRESS names (Tonkeeper shows W5; legacy setups use v4r2)."""
    version: str
    address: Address
    build: Callable[..., Cell]  # (to_addr, amount, seqno, payload) -> external message cell


def _same_address(a: Address, configured_address: str) -> bool:
    try:
        return a.to_string(False) == Address(configured_address).to_string(False)
    except Exception as exc:
        raise ValueError("Invalid MASTER_WALLET_ADDRESS") from exc


def _comment_cell(comment: str) -> Cell:
    cell = Cell()
    cell.bits.write_uint(0, 32)
    cell.bits.write_string(comment)
    return cell


def resolve_master_wallet(mnemonic_words: list[str], configured_address: str) -> MasterWallet:
    """Never sign a payout against another wallet's seqno or token account.

    Accepts the mnemonic only if one of its supported wallet versions is
    exactly MASTER_WALLET_ADDRESS, and signs with that version.
    """
    try:
        _m, pub_k, priv_k, v4 = Wallets.from_mnemonics(
            mnemonics=mnemonic_words, version=WalletVersionEnum.v4r2, workchain=0
        )
    except Exception as e:
        logger.error(f"Failed to derive wallet from mnemonic: {e}")
        raise ValueError(f"Failed to derive wallet: {e}")

    w5 = WalletV5R1(bytes(pub_k), bytes(priv_k))
    if _same_address(w5.address, configured_address):
        def build_w5(to_addr: str, amount: int, seqno: int, payload: Optional[Cell]) -> Cell:
            return w5.create_transfer_message(
                to_addr=to_addr, amount=amount, seqno=seqno,
                valid_until=int(time.time()) + W5_VALIDITY_SECONDS, payload=payload,
            )
        return MasterWallet("w5r1", w5.address, build_w5)

    if _same_address(v4.address, configured_address):
        def build_v4(to_addr: str, amount: int, seqno: int, payload: Optional[Cell]) -> Cell:
            return v4.create_transfer_message(to_addr=to_addr, amount=amount, seqno=seqno, payload=payload)["message"]
        return MasterWallet("v4r2", v4.address, build_v4)

    raise ValueError("Payout mnemonic does not match MASTER_WALLET_ADDRESS (checked W5 and v4r2)")


def _load_master_wallet(settings) -> MasterWallet:
    if not settings.PAYOUT_MNEMONIC:
        raise ValueError("PAYOUT_MNEMONIC is not configured on the server.")
    mnemonic_words = [w.strip() for w in settings.PAYOUT_MNEMONIC.strip().split() if w.strip()]
    if len(mnemonic_words) not in (12, 24):
        raise ValueError(f"Invalid PAYOUT_MNEMONIC length: {len(mnemonic_words)} words. Must be 12 or 24 words.")
    return resolve_master_wallet(mnemonic_words, settings.MASTER_WALLET_ADDRESS)


async def _fetch_seqno(address: str, headers: dict) -> int:
    """Current seqno, or 0 for a wallet that has never sent (its first
    message then carries the state init that deploys it). The seqno get
    method cannot run on an undeployed account, so check its state first."""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            res_acc = await client.get(f"https://tonapi.io/v2/accounts/{address}", headers=headers)
            if res_acc.status_code != 200:
                raise ValueError(f"TonAPI returned status {res_acc.status_code}: {res_acc.text}")
            status = res_acc.json().get("status")
            if status in ("uninit", "nonexist"):
                return 0
            if status != "active":
                raise ValueError(f"master wallet account is {status!r}")
            res_seqno = await client.get(
                f"https://tonapi.io/v2/blockchain/accounts/{address}/methods/seqno", headers=headers
            )
            if res_seqno.status_code != 200:
                raise ValueError(f"TonAPI returned status {res_seqno.status_code}: {res_seqno.text}")
            seqno_data = res_seqno.json()
            if not seqno_data.get("success"):
                raise ValueError(f"TonAPI seqno execution failed: {seqno_data}")
            return int(seqno_data["decoded"]["state"])
    except Exception as seq_err:
        logger.error(f"Failed to fetch seqno: {seq_err}")
        raise ValueError(f"Blockchain connection failure (failed to fetch seqno): {seq_err}")


async def _wait_for_seqno_advance(address: str, headers: dict, used_seqno: int) -> None:
    """Hold the send lock until the chain accepts our message (bounded)."""
    deadline = time.monotonic() + SEQNO_ADVANCE_TIMEOUT_SECONDS
    while time.monotonic() < deadline:
        await asyncio.sleep(SEQNO_POLL_SECONDS)
        try:
            if await _fetch_seqno(address, headers) > used_seqno:
                return
        except ValueError:
            pass
    logger.warning("Master wallet seqno did not advance past %s within %ss", used_seqno, SEQNO_ADVANCE_TIMEOUT_SECONDS)


async def _sign_and_broadcast(wallet: "MasterWallet", headers: dict, to_addr: str, amount: int,
                              payload: Optional[Cell], what: str) -> str:
    """Fetch seqno, sign, broadcast and wait for inclusion, one send at a time."""
    settings = get_settings()
    async with _SEND_LOCK:
        seqno = await _fetch_seqno(settings.MASTER_WALLET_ADDRESS, headers)
        try:
            boc_b64, msg_hash = _serialize(wallet.build(to_addr, amount, seqno, payload))
        except Exception as sign_err:
            logger.error(f"Failed to sign {what}: {sign_err}")
            raise ValueError(f"Failed to sign {what}: {sign_err}")
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                res_send = await client.post("https://tonapi.io/v2/blockchain/message", headers=headers, json={"boc": boc_b64})
                if res_send.status_code != 200:
                    raise ValueError(f"TonAPI returned status {res_send.status_code}: {res_send.text}")
        except Exception as send_err:
            logger.error(f"Failed to broadcast {what}: {send_err}")
            raise BlockchainBroadcastError(f"Blockchain broadcast failure: {send_err}", msg_hash)
        await _wait_for_seqno_advance(settings.MASTER_WALLET_ADDRESS, headers, seqno)
        return msg_hash


def _serialize(message: Cell) -> tuple[str, str]:
    return base64.b64encode(message.to_boc(False)).decode("utf-8"), message.bytes_hash().hex()


async def execute_usdt_payout(destination_address: str, amount_cents: int) -> str:
    """
    Executes a real on-chain transfer of USDT from the master wallet to the destination_address
    using the master wallet's version (W5 or v4r2) and TonAPI.
    
    Returns the message hash (transaction hash) of the broadcasted transaction.
    """
    settings = get_settings()
    
    # 1-2. Derive the custody wallet from the mnemonic, in the version
    # MASTER_WALLET_ADDRESS names.
    wallet = _load_master_wallet(settings)

    # Set up request headers for TonAPI
    headers = {}
    if settings.TON_API_KEY:
        headers["Authorization"] = f"Bearer {settings.TON_API_KEY}"

    # 4. Fetch the master wallet's Jetton Wallet address for USDT
    try:
        url_jw = f"https://tonapi.io/v2/accounts/{settings.MASTER_WALLET_ADDRESS}/jettons/{settings.USDT_MASTER}"
        async with httpx.AsyncClient(timeout=10.0) as client:
            res_jw = await client.get(url_jw, headers=headers)
            if res_jw.status_code != 200:
                raise ValueError(f"Failed to fetch Jetton Wallet address: {res_jw.text}")
            jw_data = res_jw.json()
            # TonAPI returns the raw form, which tonsdk treats as
            # non-bounceable; a contract destination must be bounceable so a
            # failed transfer returns its attached TON.
            master_jetton_wallet = Address(jw_data["wallet_address"]["address"]).to_string(True, True, True)
    except Exception as jw_err:
        logger.error(f"Failed to fetch Jetton Wallet address: {jw_err}")
        raise ValueError(f"Blockchain connection failure (failed to fetch Jetton Wallet address): {jw_err}")

    # 5. Build the Jetton transfer body
    # amount_cents * 10,000 = nanoUSDT (USDT is 6 decimals)
    jetton_amount = amount_cents * 10000
    
    try:
        to_addr = Address(destination_address)
        response_addr = wallet.address
        
        body = JettonWallet().create_transfer_body(
            to_address=to_addr,
            jetton_amount=jetton_amount,
            forward_amount=1, # 1 nanoTON
            forward_payload=b"Withdrawal",
            response_address=response_addr
        )
    except Exception as build_err:
        logger.error(f"Failed to build transfer body: {build_err}")
        raise ValueError(f"Invalid transfer parameters: {build_err}")

    # 6-7. Sign and broadcast (serialized per wallet seqno)
    msg_hash = await _sign_and_broadcast(wallet, headers, master_jetton_wallet, 50000000, body, "USDT payout")  # 0.05 TON

    logger.info(f"USDT payout transaction successfully broadcasted. Message Hash: {msg_hash}")
    return msg_hash


async def execute_ton_transfer(destination_address: str, amount_nanoton: int, comment: str = "Gas grant") -> str:
    """
    Sends plain native TON from the master wallet (used for gas grants that
    unblock USDT holders who can't pay jetton-transfer gas). Mirrors
    execute_usdt_payout's derivation/seqno/broadcast flow.

    Returns the message hash of the broadcasted transaction.
    """
    settings = get_settings()

    if amount_nanoton <= 0:
        raise ValueError("TON transfer amount must be positive")
    wallet = _load_master_wallet(settings)

    headers = {}
    if settings.TON_API_KEY:
        headers["Authorization"] = f"Bearer {settings.TON_API_KEY}"

    msg_hash = await _sign_and_broadcast(
        wallet, headers, Address(destination_address).to_string(True, True, False),
        amount_nanoton, _comment_cell(comment), "TON transfer",
    )

    logger.info(f"TON transfer broadcasted ({amount_nanoton} nanoTON to {destination_address}). Message Hash: {msg_hash}")
    return msg_hash
