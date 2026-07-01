import base64
import httpx
import logging
from app.core.config import get_settings
from tonsdk.contract.wallet import Wallets, WalletVersionEnum
from tonsdk.contract.token.ft.jetton_wallet import JettonWallet
from tonsdk.utils import Address

logger = logging.getLogger(__name__)

async def execute_usdt_payout(destination_address: str, amount_cents: int) -> str:
    """
    Executes a real on-chain transfer of USDT from the master wallet to the destination_address
    using Wallet v4 R2 and TonAPI.
    
    Returns the message hash (transaction hash) of the broadcasted transaction.
    """
    settings = get_settings()
    
    # 1. Enforce that the payout mnemonic is configured
    if not settings.PAYOUT_MNEMONIC:
        raise ValueError("PAYOUT_MNEMONIC is not configured on the server.")
        
    mnemonic_words = [w.strip() for w in settings.PAYOUT_MNEMONIC.strip().split() if w.strip()]
    if len(mnemonic_words) not in (12, 24):
        raise ValueError(f"Invalid PAYOUT_MNEMONIC length: {len(mnemonic_words)} words. Must be 12 or 24 words.")

    # 2. Derive master wallet contract
    try:
        _mnemonics, pub_k, priv_k, wallet = Wallets.from_mnemonics(
            mnemonics=mnemonic_words,
            version=WalletVersionEnum.v4r2,
            workchain=0
        )
    except Exception as e:
        logger.error(f"Failed to derive wallet from mnemonic: {e}")
        raise ValueError(f"Failed to derive wallet: {e}")

    # Set up request headers for TonAPI
    headers = {}
    if settings.TON_API_KEY:
        headers["Authorization"] = f"Bearer {settings.TON_API_KEY}"

    # 3. Query the seqno of the master wallet from TonAPI
    try:
        url_seqno = f"https://tonapi.io/v2/blockchain/accounts/{settings.MASTER_WALLET_ADDRESS}/methods/seqno"
        async with httpx.AsyncClient(timeout=10.0) as client:
            res_seqno = await client.get(url_seqno, headers=headers)
            if res_seqno.status_code != 200:
                raise ValueError(f"TonAPI returned status {res_seqno.status_code}: {res_seqno.text}")
            seqno_data = res_seqno.json()
            if not seqno_data.get("success"):
                raise ValueError(f"TonAPI seqno execution failed: {seqno_data}")
            seqno = int(seqno_data["decoded"]["state"])
    except Exception as seq_err:
        logger.error(f"Failed to fetch seqno: {seq_err}")
        raise ValueError(f"Blockchain connection failure (failed to fetch seqno): {seq_err}")

    # 4. Fetch the master wallet's Jetton Wallet address for USDT
    try:
        url_jw = f"https://tonapi.io/v2/accounts/{settings.MASTER_WALLET_ADDRESS}/jettons/{settings.USDT_MASTER}"
        async with httpx.AsyncClient(timeout=10.0) as client:
            res_jw = await client.get(url_jw, headers=headers)
            if res_jw.status_code != 200:
                raise ValueError(f"Failed to fetch Jetton Wallet address: {res_jw.text}")
            jw_data = res_jw.json()
            master_jetton_wallet = jw_data["wallet_address"]["address"]
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

    # 6. Create external message
    try:
        query = wallet.create_transfer_message(
            to_addr=master_jetton_wallet,
            amount=50000000, # 0.05 TON
            seqno=seqno,
            payload=body
        )
        boc = query["message"].to_boc(False)
        boc_b64 = base64.b64encode(boc).decode('utf-8')
        msg_hash = query["message"].bytes_hash().hex()
    except Exception as sign_err:
        logger.error(f"Failed to sign message: {sign_err}")
        raise ValueError(f"Failed to sign message: {sign_err}")

    # 7. Broadcast message to TonAPI
    try:
        url_send = "https://tonapi.io/v2/blockchain/message"
        async with httpx.AsyncClient(timeout=15.0) as client:
            res_send = await client.post(
                url_send,
                headers=headers,
                json={"boc": boc_b64}
            )
            if res_send.status_code != 200:
                raise ValueError(f"TonAPI returned status {res_send.status_code}: {res_send.text}")
    except Exception as send_err:
        logger.error(f"Failed to broadcast transaction: {send_err}")
        raise ValueError(f"Blockchain broadcast failure: {send_err}")

    logger.info(f"USDT payout transaction successfully broadcasted. Message Hash: {msg_hash}")
    return msg_hash
