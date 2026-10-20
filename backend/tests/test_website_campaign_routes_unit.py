"""Website campaign launches retain the promised product destination."""
from unittest.mock import AsyncMock

import pytest

from app.services import friend_invites, player_tracking


@pytest.mark.asyncio
@pytest.mark.parametrize(('parameter', 'destination'), [
    ('mk_web_play_arena', 'arena'),
    ('mk_web_academy', 'academy'),
    ('mk_web_rules', 'home'),
    ('mk_tg_2026_10_14_tg_community', 'home'),
])
async def test_marketing_launch_routes_without_invitation(monkeypatch, parameter, destination):
    attribute = AsyncMock(return_value=True)
    monkeypatch.setattr(player_tracking, 'attribute_marketing', attribute)
    db, user = object(), object()

    assert await friend_invites.preview(db, user, parameter) == {
        'kind': 'route', 'destination': destination,
    }
    attribute.assert_awaited_once_with(db, user, parameter)
