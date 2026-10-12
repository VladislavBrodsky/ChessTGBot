# Operations and Maintenance Runbook (`backend/scripts/ops/`)

This directory contains standalone operational scripts used by system administrators and engineers for maintenance, diagnostics, and legacy data reconciliation.

> [!WARNING]
> These scripts interact directly with production databases and blockchain RPC nodes. Always verify environment variables, execute dry-runs where applicable, and follow the instructions below before running any operations.

---

## Prerequisites

1. Set the working directory to `backend/` or ensure Python has `backend/` in its module search path.
2. Ensure required environment variables (`DATABASE_URL`, `MASTER_WALLET_ADDRESS`, `PAYOUT_MNEMONIC`, `TON_API_KEY`, etc.) are populated (e.g. from `.env` or production deployment context).
3. Activate the virtual environment:
   ```bash
   cd backend
   source ../venv/bin/activate  # or your venv path
   ```

---

## Operational Scripts

### 1. `wallet_diagnostic.py`
- **Purpose**: Verifies that the configured `PAYOUT_MNEMONIC` matches the `MASTER_WALLET_ADDRESS` across different TON wallet contract versions (v4r2, v4r1, v3r2, v3r1).
- **When to use**: During wallet initialization, rotation, or when diagnosing payout broadcast contract address mismatches.
- **How to run**:
  ```bash
  python scripts/ops/wallet_diagnostic.py
  ```

### 2. `stripe_sweeper.py`
- **Purpose**: One-off sweep to reconcile un-finalized Stripe checkout sessions and sync user balances.
- **When to use**: If Stripe webhooks were temporarily down or if uncredited card deposits are suspected.
- **How to run**:
  ```bash
  python scripts/ops/stripe_sweeper.py
  ```

### 3. `sync_all_historical_deposits.py`
- **Purpose**: Crawls TonAPI for historical incoming transactions to `MASTER_WALLET_ADDRESS` and retroactively credits missing deposits based on the memo/comment (`ref_<tg_id>`).
- **When to use**: After indexer downtime or to reconstruct historical ledger deposits.
- **How to run**:
  ```bash
  python scripts/ops/sync_all_historical_deposits.py
  ```

### 4. `notify_all_withdrawals.py`
- **Purpose**: Sends Telegram bot messages to users whose withdrawals succeeded on-chain, providing the transaction link.
- **When to use**: If a notification batch failed due to bot rate limits during an outage recovery.
- **How to run**:
  ```bash
  python scripts/ops/notify_all_withdrawals.py
  ```

### 5. `one_time_refund_kirill.py`
- **Purpose**: Dedicated audit-tracked refund script for legacy stuck transaction `b5c23277c9013aeca683f50f921697343ad58e6fe8356b5c8bbfe38d5bb28a38`.
- **Note**: Preserved for historical audit record; idempotent.
- **How to run**:
  ```bash
  python scripts/ops/one_time_refund_kirill.py
  ```
