import sys
import os

from tonsdk.contract.wallet import Wallets, WalletVersionEnum
from tonsdk.boc import Cell
from tonsdk.utils import Address, to_nano

def test_sign():
    mnemonic = ['wood', 'sphere', 'valve', 'heavy', 'machine', 'annual', 'horn', 'burden', 'swift', 'opinion', 'mind', 'motion', 'wear', 'layer', 'reduce', 'that', 'arctic', 'worth', 'dry', 'forward', 'reward', 'seek', 'gather', 'luxury']
    
    _mnemonics, pub_k, priv_k, wallet = Wallets.from_mnemonics(
        mnemonics=mnemonic,
        version=WalletVersionEnum.v4r2,
        workchain=0
    )
    
    print("Address:", wallet.address.to_string(True, True, False))

if __name__ == "__main__":
    test_sign()
