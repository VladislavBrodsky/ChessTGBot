#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
STATE_DIR="$ROOT_DIR/marketing/content-ops/state"
PID_FILE="$STATE_DIR/autopilot.pid"

STOPPED=0

if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE" | tr -d '[:space:]')
    if kill -0 "$PID" > /dev/null 2>&1; then
        echo "Stopping Autopilot daemon (PID: $PID)..."
        kill "$PID" || true
        for i in {1..10}; do
            if ! kill -0 "$PID" > /dev/null 2>&1; then
                break
            fi
            sleep 0.5
        done
        STOPPED=1
    fi
    rm -f "$PID_FILE"
fi

# Fallback kill for any lingering autopilot process
for P in $(pgrep -f "autopilot.py --daemon" || true); do
    echo "Terminating lingering autopilot process $P..."
    kill "$P" || true
    STOPPED=1
done

if [ "$STOPPED" -eq 1 ]; then
    echo "Autopilot daemon stopped."
else
    echo "No running autopilot daemon found."
fi
