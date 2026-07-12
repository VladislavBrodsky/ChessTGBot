import sys
import os

# Adjust path to import backend modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.config import get_settings
from tonsdk.contract.wallet import Wallets, WalletVersionEnum

def run_diagnostic():
    settings = get_settings()
    print("=== TON WALLET DIAGNOSTIC ===")
    print(f"Configured MASTER_WALLET_ADDRESS: {settings.MASTER_WALLET_ADDRESS}")
    
    if not settings.PAYOUT_MNEMONIC:
        print("ERROR: PAYOUT_MNEMONIC is not set in environment variables.")
        return
        
    mnemonic_words = [w.strip() for w in settings.PAYOUT_MNEMONIC.strip().split() if w.strip()]
    print(f"Mnemonic length: {len(mnemonic_words)} words.")
    
    # Try different wallet versions to see which one matches the configured master wallet address
    versions = [
        WalletVersionEnum.v4r2,
        WalletVersionEnum.v4r1,
        WalletVersionEnum.v3r2,
        WalletVersionEnum.v3r1,
    ]
    
    matched = False
    for version in versions:
        try:
            _mnemonics, pub_k, priv_k, wallet = Wallets.from_mnemonics(
                mnemonics=mnemonic_words,
                version=version,
                workchain=0
            )
            
            # Non-bounceable friendly formats
            friendly_non_bounceable = wallet.address.to_string(True, True, False)
            friendly_bounceable = wallet.address.to_string(True, True, True)
            
            # Remove base64 padding to match normalized comparison
            friendly_nb_stripped = friendly_non_bounceable.rstrip("=")
            friendly_b_stripped = friendly_bounceable.rstrip("=")
            
            print(f"\nDerived Address under {version.value}:")
            print(f"  • Non-Bounceable: {friendly_non_bounceable}")
            print(f"  • Bounceable:     {friendly_bounceable}")
            
            config_addr_stripped = settings.MASTER_WALLET_ADDRESS.rstrip("=")
            if friendly_nb_stripped == config_addr_stripped or friendly_b_stripped == config_addr_stripped:
                print("  🟢 MATCHES MASTER_WALLET_ADDRESS!")
                matched = True
            elif friendly_non_bounceable.replace("_", "/") == settings.MASTER_WALLET_ADDRESS.replace("_", "/") or friendly_non_bounceable.replace("/", "_") == settings.MASTER_WALLET_ADDRESS:
                print("  🟢 MATCHES (url-safe base64 variant)!")
                matched = True
        except Exception as e:
            print(f"Error deriving under {version.value}: {e}")
            
    if not matched:
        print("\n❌ WARNING: None of the derived addresses matched the configured MASTER_WALLET_ADDRESS.")
        print("Please verify that:")
        print("  1. The 24-word seed phrase in PAYOUT_MNEMONIC is correct and belongs to the master wallet.")
        print("  2. The MASTER_WALLET_ADDRESS in settings is correct.")

if __name__ == "__main__":
    run_diagnostic()
