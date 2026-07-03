import json

transcript_path = r"C:\Users\dmitriy.ivanovskiy\.gemini\antigravity\brain\3cd6fc63-e7c4-4a89-809a-d120711dc79a\.system_generated\logs\transcript_full.jsonl"

with open(transcript_path, "r", encoding="utf-8") as f:
    lines = f.readlines()

print(f"Total lines: {len(lines)}")

# Let's inspect the last 5 lines
for i in range(1, min(10, len(lines) + 1)):
    try:
        data = json.loads(lines[-i])
        print(f"Line -{i}: type={data.get('type')}, status={data.get('status')}, source={data.get('source')}")
    except Exception as e:
        print(f"Line -{i} error: {e}")

# Now find the last USER_INPUT
for line in reversed(lines):
    try:
        data = json.loads(line)
        if data.get("type") == "USER_INPUT":
            content = data.get("content", "")
            print(f"\nLast USER_INPUT length: {len(content)}")
            print("First 1000 chars:")
            print(content[:1000])
            print("Last 1000 chars:")
            print(content[-1000:])
            break
    except Exception as e:
        pass
