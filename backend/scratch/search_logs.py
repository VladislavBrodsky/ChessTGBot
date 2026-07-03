import os
import json

log_dir = r"c:\Users\dmitriy.ivanovskiy\Documents\ChessTGBot-main\Log Audit and Debugging"

found = 0
for filename in os.listdir(log_dir):
    if filename.endswith(".json"):
        filepath = os.path.join(log_dir, filename)
        try:
            with open(filepath, "r", encoding="utf-8") as f:
                data = json.load(f)
                for entry in data:
                    msg = entry.get("message", "")
                    if "start command" in msg.lower() or "telegram_bot" in msg.lower() or "error" in msg.lower() or "fail" in msg.lower():
                        # print the log message
                        print(f"[{filename}] {entry.get('timestamp')}: {msg}")
                        found += 1
        except Exception as e:
            print(f"Error reading {filename}: {e}")

print(f"Search complete. Found {found} matching entries.")
