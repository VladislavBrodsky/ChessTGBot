import json

transcript_path = r"C:\Users\dmitriy.ivanovskiy\.gemini\antigravity\brain\3cd6fc63-e7c4-4a89-809a-d120711dc79a\.system_generated\logs\transcript_full.jsonl"
output_path = r"C:\Users\dmitriy.ivanovskiy\.gemini\antigravity\brain\3cd6fc63-e7c4-4a89-809a-d120711dc79a\scratch\user_logs.txt"

with open(transcript_path, "r", encoding="utf-8") as f:
    lines = f.readlines()

for line in reversed(lines):
    try:
        data = json.loads(line)
        if data.get("type") == "USER_INPUT":
            content = data.get("content", "")
            if "had a top up transaction" in content:
                with open(output_path, "w", encoding="utf-8") as out:
                    out.write(content)
                print(f"Pasted logs successfully written to: {output_path}")
                print(f"File size: {len(content)} bytes")
                break
    except Exception as e:
        pass
