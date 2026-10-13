"""Exercise the additive migration and rollback on a real SQL engine."""
import importlib.util
from pathlib import Path
from alembic.migration import MigrationContext
from alembic.operations import Operations
from sqlalchemy import create_engine, inspect, text


def test_gram_migration_preserves_existing_users():
    path = Path(__file__).parents[1] / 'alembic/versions/c84f21b7a903_add_gram_reward_ledger.py'
    spec = importlib.util.spec_from_file_location('gram_revision', path)
    migration = importlib.util.module_from_spec(spec); spec.loader.exec_module(migration)
    engine = create_engine('sqlite://')
    with engine.begin() as connection:
        connection.execute(text('CREATE TABLE users (id INTEGER PRIMARY KEY, balance INTEGER NOT NULL)'))
        connection.execute(text('INSERT INTO users (id, balance) VALUES (1, 1250)'))
        with Operations.context(MigrationContext.configure(connection)):
            migration.upgrade()
            row = connection.execute(text('SELECT balance, gram_leaderboard_visible FROM users')).one()
            assert tuple(row) == (1250, 0)
            assert 'gram_rewards' in inspect(connection).get_table_names()
            assert inspect(connection).get_unique_constraints('gram_rewards')[0]['column_names'] == ['source_key']
            migration.downgrade()
        assert connection.execute(text('SELECT balance FROM users')).scalar_one() == 1250
        assert 'gram_rewards' not in inspect(connection).get_table_names()
    engine.dispose()
