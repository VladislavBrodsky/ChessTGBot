"""RepeatCollapsingHandler: an error storm must not flood Railway's per-replica
log rate limit. The first occurrence is logged in full, identical repeats within
the window are counted, and one summary line reports them when the window ends."""
import io
import logging

from app.core.logger import RepeatCollapsingHandler


class Clock:
    def __init__(self):
        self.now = 1000.0

    def __call__(self):
        return self.now


def _setup():
    stream, clock = io.StringIO(), Clock()
    handler = RepeatCollapsingHandler(stream, window=60, clock=clock)
    handler.setFormatter(logging.Formatter("%(levelname)s %(message)s"))
    logger = logging.getLogger("tests.repeat_collapsing")
    logger.handlers[:] = [handler]
    logger.propagate = False
    logger.setLevel(logging.INFO)
    return logger, handler, stream, clock


def _lines(stream):
    return [line for line in stream.getvalue().splitlines() if line and not line.startswith(("Traceback", "  ", "ValueError"))]


def _fail(logger, user_id):
    try:
        raise ValueError(f"bad payload from {user_id}")
    except ValueError:
        logger.exception(f"Deposit check failed for user {user_id}")


def test_repeated_errors_are_logged_once_then_summarized():
    logger, _, stream, clock = _setup()
    for user_id in range(500):  # ids differ but normalize to one fingerprint
        _fail(logger, user_id)
    assert stream.getvalue().count("Traceback") == 1
    assert _lines(stream) == ["ERROR Deposit check failed for user 0"]
    clock.now += 61
    logger.info("tick")  # any later record closes the expired window
    lines = _lines(stream)
    assert lines[1] == ("ERROR Previous message repeated 499 more times in 61s (suppressed): "
                        "Deposit check failed for user 0")
    assert lines[2] == "INFO tick"


def test_after_the_window_the_error_is_logged_in_full_again():
    logger, _, stream, clock = _setup()
    _fail(logger, 1)
    clock.now += 61
    _fail(logger, 2)
    assert stream.getvalue().count("Traceback") == 2
    assert "repeated" not in stream.getvalue()  # nothing was suppressed


def test_different_errors_and_info_records_are_never_collapsed():
    logger, _, stream, _ = _setup()
    for _ in range(3):
        logger.info("http_request")
    logger.warning("Payout wallet low")
    logger.error("Payout wallet low")         # same text, different level
    logger.warning("Redis reconnecting")
    assert _lines(stream) == ["INFO http_request"] * 3 + [
        "WARNING Payout wallet low", "ERROR Payout wallet low", "WARNING Redis reconnecting"]


def test_close_reports_pending_suppressed_counts():
    logger, handler, stream, clock = _setup()
    for _ in range(4):
        logger.warning("Fair-play screening pass failed: timeout")
    clock.now += 5
    handler.close()
    assert _lines(stream)[-1] == ("WARNING Previous message repeated 3 more times in 5s (suppressed): "
                                  "Fair-play screening pass failed: timeout")
