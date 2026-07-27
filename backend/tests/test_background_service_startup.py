"""Regression checks for one-instance background service startup."""

import ast
from pathlib import Path


def test_stripe_reconciliation_loop_is_started_once():
    """The reconciliation loop must not double-run external Stripe polling."""
    main_path = Path(__file__).parents[1] / "app" / "main.py"
    tree = ast.parse(main_path.read_text(encoding="utf-8"))

    calls = [
        node
        for node in ast.walk(tree)
        if isinstance(node, ast.Call)
        and isinstance(node.func, ast.Name)
        and node.func.id == "start_stripe_reconciliation_loop"
    ]

    assert len(calls) == 1
