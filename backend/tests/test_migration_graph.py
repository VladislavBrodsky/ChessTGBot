"""Tripwire for the Alembic migration graph.

A duplicated revision, a second head, or a dangling down_revision (e.g. a
deleted migration file still referenced by its child) passes the import check
and pytest, but crash-loops the production container at boot because both
Docker entrypoints run `alembic upgrade head` before starting uvicorn.
This happened on 2026-07-15: a duplicate study_streak revision left the
checkin_streak migration unapplied and eventually took the backend down.
These tests need no database — they only load the version scripts.
"""
from pathlib import Path

from alembic.config import Config
from alembic.script import ScriptDirectory

BACKEND_DIR = Path(__file__).resolve().parents[1]


def _script_directory() -> ScriptDirectory:
    cfg = Config(str(BACKEND_DIR / "alembic.ini"))
    cfg.set_main_option("script_location", str(BACKEND_DIR / "alembic"))
    return ScriptDirectory.from_config(cfg)


def test_migration_graph_has_single_head():
    heads = _script_directory().get_heads()
    assert len(heads) == 1, (
        f"Expected exactly one Alembic head, found {heads}. Two sessions "
        "likely added migrations in parallel — create a merge revision with "
        "'alembic merge' (see 3247f5036e66) before this reaches production."
    )


def test_migration_graph_is_fully_connected():
    script = _script_directory()
    # walk_revisions raises if a down_revision points at a missing revision
    # (e.g. a migration file was deleted without repointing its children).
    revisions = list(script.walk_revisions("base", "heads"))
    assert revisions, "No migrations found under backend/alembic/versions"
    known = {rev.revision for rev in revisions}
    for rev in revisions:
        down = rev.down_revision
        if down is None:
            continue
        parents = down if isinstance(down, tuple) else (down,)
        for parent in parents:
            assert parent in known, (
                f"Revision {rev.revision} references missing down_revision "
                f"{parent!r} — was its parent migration deleted without "
                "repointing this one?"
            )
