"""Product rule: free play is the AI coach only; every game against a person is wagered.

One place for the minimum stake and the player-facing refusal so the REST create, the
socket join/rematch handlers and friend invitations cannot drift apart.
"""

MIN_HUMAN_STAKE_CENTS = 100

# Shown to players (and returned by the API) whenever a zero-stake human game is refused.
HUMAN_STAKE_REQUIRED_MESSAGE = (
    "Games against other players need a stake of at least $1.00. Practise free against Free Coach."
)

# Machine-readable code for clients that translate errors.
HUMAN_STAKE_REQUIRED_CODE = "stake_required"


def is_valid_human_stake(stake_cents) -> bool:
    try:
        return int(stake_cents) >= MIN_HUMAN_STAKE_CENTS
    except (TypeError, ValueError):
        return False
