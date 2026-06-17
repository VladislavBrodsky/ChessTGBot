import os
import json

logs_dir = "/Users/grandmaestro/Developer/ChessTGBot/Log Audit and Debugging"

for filename in os.listdir(logs_dir):
    if not filename.endswith(".json"):
        continue
    filepath = os.path.join(logs_dir, filename)
    with open(filepath, "r", encoding="utf-8") as f:
        data = json.load(f)
    
    for entry in data:
        message = entry.get("message", "")
        if "/users/sync" in message or "/sync" in message:
            print(f"[{filename}] {message}")
