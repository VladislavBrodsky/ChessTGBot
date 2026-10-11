"""Bot games can never carry or refund a stake (regression for the abort-refund balance mint)."""
import pytest
from fastapi import HTTPException

from app.api.v1.endpoints.game import normalise_create_request
from app.services.game_service import refundable_stake


class _State:
    def __init__(self, black_player_id, bid_amount):
        self.black_player_id = black_player_id
        self.bid_amount = bid_amount


def test_bot_game_ignores_any_wager_the_client_sends():
    assert normalise_create_request("computer", 600, 100_000) == (True, 600, 0)
    assert normalise_create_request("computer", 600, 100) == (True, 600, 0)


def test_player_game_keeps_its_stake():
    assert normalise_create_request("online", 300, 500) == (False, 300, 500)


@pytest.mark.parametrize("wager", [0, 99, -500])
def test_player_game_needs_at_least_one_dollar(wager):
    with pytest.raises(HTTPException) as err:
        normalise_create_request("online", 600, wager)
    assert err.value.status_code == 400


@pytest.mark.parametrize("game_type", ["", "free", "COMPUTER", "tournament"])
def test_unknown_game_types_are_rejected(game_type):
    with pytest.raises(HTTPException):
        normalise_create_request(game_type, 600, 100)


@pytest.mark.parametrize("time_control", [0, 59, 3601, 10**9, -1])
def test_time_control_must_be_bounded(time_control):
    with pytest.raises(HTTPException):
        normalise_create_request("online", time_control, 100)


def test_aborting_a_bot_game_refunds_nothing_even_if_a_stake_was_stored():
    assert refundable_stake(_State(-1, 100_000)) == 0


def test_aborting_a_player_game_refunds_the_stored_stake():
    assert refundable_stake(_State(222, 500)) == 500
    assert refundable_stake(_State(None, 500)) == 500
    assert refundable_stake(_State(222, None)) == 0
    assert refundable_stake(_State(222, -5)) == 0
