#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
STATE_DIR="$ROOT_DIR/marketing/content-ops/state"
PID_FILE="$STATE_DIR/autopilot.pid"
LOG_FILE="$STATE_DIR/autopilot.log"
DAEMON_OUT="$STATE_DIR/daemon.log"

mkdir -p "$STATE_DIR"

if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE" | tr -d '[:space:]')
    if kill -0 "$PID" > /dev/null 2>&1; then
        echo "Autopilot daemon is already running (PID: $PID)."
        exit 0
    else
        rm -f "$PID_FILE"
    fi
fi

# Fallback check for any running autopilot process
EXISTING_PID=$(pgrep -f "autopilot.py --daemon" | head -n 1 || true)
if [ -n "$EXISTING_PID" ]; then
    echo "Autopilot daemon found running (PID: $EXISTING_PID). Saving PID file."
    echo "$EXISTING_PID" > "$PID_FILE"
    exit 0
fi

echo "Starting Web3Chess Content Autopilot daemon..."
cd "$ROOT_DIR"

nohup /Library/Frameworks/Python.framework/Versions/3.13/bin/python3 \
    "$ROOT_DIR/marketing/content-ops/autopilot.py" \
    --daemon \
    --live \
    --interval-seconds 60 \
    >> "$DAEMON_OUT" 2>&1 &

NEW_PID=$!
echo "$NEW_PID" > "$PID_FILE"
echo "Autopilot daemon started successfully (PID: $NEW_PID)."
echo "Logs: $LOG_FILE"
