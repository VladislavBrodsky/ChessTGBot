# Money Operations

Run all money recovery tools from `backend/` with the normal environment loaded.
They default to dry-run; production changes require both `--apply` and the
tool-specific explicit production confirmation flag.

`python -m ops.reconcile_stripe` inspects pending Stripe Checkout sessions.
Use `python -m ops.reconcile_stripe --apply --confirm-production` only after
reviewing the dry-run output and Stripe Dashboard state.
