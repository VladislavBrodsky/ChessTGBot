import os
import json

logs_dir = "/Users/grandmaestro/Developer/ChessTGBot/Log Audit and Debugging"
files = ["logs.1769384440006.json", "logs.1769384355235.json"]

for filename in files:
    filepath = os.path.join(logs_dir, filename)
    if not os.path.exists(filepath):
        print(f"File {filename} does not exist.")
        continue
    with open(filepath, "r", encoding="utf-8") as f:
        data = json.load(f)
    print(f"\n=================== {filename} ({len(data)} logs) ===================")
    
    # Print the last 40 logs in the file
    for entry in data[-40:]:
        timestamp = entry.get("timestamp", "")
        level = entry.get("attributes", {}).get("level", "info")
        message = entry.get("message", "")
        print(f"[{timestamp}] [{level.upper()}] {message}")
