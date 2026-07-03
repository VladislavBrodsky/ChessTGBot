import json

transcript_path = r"C:\Users\dmitriy.ivanovskiy\.gemini\antigravity\brain\3cd6fc63-e7c4-4a89-809a-d120711dc79a\.system_generated\logs\transcript_full.jsonl"

with open(transcript_path, "r", encoding="utf-8") as f:
    lines = f.readlines()

for line in reversed(lines):
    try:
        data = json.loads(line)
        if data.get("type") == "USER_INPUT":
            content = data.get("content", "")
            lines_in_logs = content.split("\n")
            
            # Print lines containing "verify" or "deposit"
            found = False
            for l in lines_in_logs:
                if "verify" in l.lower() or "deposit" in l.lower():
                    print(l)
                    found = True
            if found:
                break
    except Exception as e:
        pass
