output_path = r"C:\Users\dmitriy.ivanovskiy\.gemini\antigravity\brain\3cd6fc63-e7c4-4a89-809a-d120711dc79a\scratch\user_logs.txt"

with open(output_path, "r", encoding="utf-8") as f:
    lines = f.readlines()

print(f"Total lines: {len(lines)}")

interesting_lines = []
for idx, l in enumerate(lines):
    l_lower = l.lower()
    if "/api/v1/users/" in l_lower or "/api/v1/wallet/" in l_lower:
        continue
    # Let's clean empty lines and user request wrappers
    stripped = l.strip()
    if not stripped or stripped == "<USER_REQUEST>" or stripped == "</USER_REQUEST>":
        continue
    interesting_lines.append((idx + 1, stripped))

print(f"Interesting lines found: {len(interesting_lines)}")
for num, line in interesting_lines[:100]:
    print(f"{num}: {line}")
