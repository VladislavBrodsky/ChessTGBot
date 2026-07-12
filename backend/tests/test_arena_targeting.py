"""Unit tests for region-aware arena heads-up targeting. Pure logic: slot
assignment from region / behaviour / language and the nearest-slot math. The
DB-backed audience query (targeted_telegram_ids) is exercised by the arena
integration tests.
"""
from app.services.arena_targeting import (
    nearest_slot,
    _circular_hour_distance,
    _target_hour_for,
    REGION_OFFSETS,
    LANGUAGE_OFFSETS,
)

SLOTS = [(2, 0), (8, 0), (14, 0), (20, 0)]


# ── nearest-slot math ─────────────────────────────────────────────────────────

def test_circular_distance_wraps_midnight():
    assert _circular_hour_distance(23, 1) == 2
    assert _circular_hour_distance(1, 23) == 2
    assert _circular_hour_distance(0, 12) == 12


def test_nearest_slot_picks_closest():
    assert nearest_slot(19.0, SLOTS) == (20, 0)
    assert nearest_slot(3.0, SLOTS) == (2, 0)
    assert nearest_slot(13.0, SLOTS) == (14, 0)


def test_nearest_slot_wraps_across_midnight():
    # 23:30 is nearer 02:00 (2.5h) than 20:00 (3.5h)
    assert nearest_slot(23.5, SLOTS) == (2, 0)


def test_nearest_slot_tie_breaks_to_earlier():
    # 11:00 is equidistant from 08:00 and 14:00 -> earlier wins
    assert nearest_slot(11.0, SLOTS) == (8, 0)


def test_nearest_slot_empty():
    assert nearest_slot(12.0, []) is None


# ── signal priority ───────────────────────────────────────────────────────────

def test_every_region_maps_to_a_distinct_slot():
    assigned = {r: nearest_slot(_target_hour_for(r, None, None), SLOTS)
                for r in REGION_OFFSETS}
    # all four regions land on the four distinct slots
    assert set(assigned.values()) == set(SLOTS)


def test_region_overrides_behaviour_and_language():
    # APAC user who currently plays at 21:00 UTC and speaks en -> region wins
    hour = _target_hour_for("apac", "en", 21.0)
    assert nearest_slot(hour, SLOTS) == (8, 0)


def test_behaviour_overrides_language_when_no_region():
    # ja speaker but actually plays at 21:00 UTC -> behaviour wins
    hour = _target_hour_for(None, "ja", 21.0)
    assert nearest_slot(hour, SLOTS) == (20, 0)


def test_language_used_when_no_region_or_behaviour():
    hour = _target_hour_for(None, "ru", None)
    assert nearest_slot(hour, SLOTS) == (14, 0)


def test_unknown_language_defaults_to_utc_evening():
    # unknown / missing language -> UTC offset 0 -> 19:00 UTC -> 20:00 slot
    assert nearest_slot(_target_hour_for(None, None, None), SLOTS) == (20, 0)
    assert nearest_slot(_target_hour_for(None, "xx", None), SLOTS) == (20, 0)


def test_all_known_languages_resolve_to_a_slot():
    for lang in LANGUAGE_OFFSETS:
        assert nearest_slot(_target_hour_for(None, lang, None), SLOTS) in SLOTS
