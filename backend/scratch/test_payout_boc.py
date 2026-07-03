import sys
import os
import base64

from tonsdk.contract.wallet import Wallets, WalletVersionEnum
from tonsdk.contract.token.ft.jetton_wallet import JettonWallet
from tonsdk.boc import Cell
from tonsdk.utils import Address

def test_boc():
    mnemonic = ['wood', 'sphere', 'valve', 'heavy', 'machine', 'annual', 'horn', 'burden', 'swift', 'opinion', 'mind', 'motion', 'wear', 'layer', 'reduce', 'that', 'arctic', 'worth', 'dry', 'forward', 'reward', 'seek', 'gather', 'luxury']
    
    # 1. Derive wallet
    _mnemonics, pub_k, priv_k, wallet = Wallets.from_mnemonics(
        mnemonics=mnemonic,
        version=WalletVersionEnum.v4r2,
        workchain=0
    )
    
    # 2. Build Jetton transfer body
    to_addr = Address("UQCDg8ub3MGCVJSaNo2q3QGTg0bX71RmwrvVOfbrqAzYNuCN")
    response_addr = wallet.address
    
    body = JettonWallet().create_transfer_body(
        to_address=to_addr,
        jetton_amount=1000000, # 1 USDT
        forward_amount=1,
        forward_payload=b"Withdrawal",
        response_address=response_addr
    )
    
    # 3. Create transfer message
    # master_jetton_wallet is the recipient of the internal message
    master_jetton_wallet = "0:9b8887c5597ac1746cb4ad8de5198220fa423c3090c2017d8bf075951fa0bd42"
    
    query = wallet.create_transfer_message(
        to_addr=master_jetton_wallet,
        amount=50000000, # 0.05 TON
        seqno=21,
        payload=body
    )
    
    # 4. Serialize to BOC
    boc = query['message'].to_boc(False)
    boc_b64 = base64.b64encode(boc).decode('utf-8')
    boc_hex = boc.hex()
    
    # Derive message hash (SHA256 of serialized BOC)
    msg_hash = query['message'].bytes_hash().hex()
    
    print("BOC Base64:", boc_b64[:30] + "...")
    print("Message Hash:", msg_hash)

if __name__ == "__main__":
    test_boc()
