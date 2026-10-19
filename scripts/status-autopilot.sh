#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
STATE_DIR="$ROOT_DIR/marketing/content-ops/state"
PID_FILE="$STATE_DIR/autopilot.pid"
LOG_FILE="$STATE_DIR/autopilot.log"
STATE_JSON="$STATE_DIR/autopilot_state.json"

echo "=== Web3Chess Autopilot Service Status ==="

IS_RUNNING=0
if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE" | tr -d '[:space:]')
    if kill -0 "$PID" > /dev/null 2>&1; then
        echo "Status: RUNNING (PID: $PID)"
        IS_RUNNING=1
    fi
fi

if [ "$IS_RUNNING" -eq 0 ]; then
    EXISTING_PID=$(pgrep -f "autopilot.py --daemon" | head -n 1 || true)
    if [ -n "$EXISTING_PID" ]; then
        if launchctl list 2>/dev/null | grep -q "com.web3chess.autopilot"; then
            echo "Status: RUNNING (PID: $EXISTING_PID, macOS LaunchAgent: com.web3chess.autopilot)"
        else
            echo "Status: RUNNING (PID: $EXISTING_PID, background process)"
        fi
        IS_RUNNING=1
    else
        echo "Status: STOPPED"
    fi
fi

if [ -f "$STATE_JSON" ]; then
    echo ""
    echo "--- Last State ---"
    python3 -c "
import json
from pathlib import Path
state = json.loads(Path('$STATE_JSON').read_text())
print('Ticks executed:   ', state.get('ticks', 0))
print('Last tick at:     ', state.get('last_tick_at', 'never'))
print('Last X post at:   ', state.get('last_x_post_at', 'never'))
print('Last TG post at:  ', state.get('last_tg_post_at', 'never'))
" || true
fi

echo ""
echo "--- Recent Autopilot Logs ---"
if [ -f "$LOG_FILE" ]; then
    tail -n 10 "$LOG_FILE"
else
    echo "No log file found."
fi
