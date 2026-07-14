import os

def search_dir(d):
    for root, dirs, files in os.walk(d):
        if "node_modules" in root or ".next" in root or ".git" in root or ".venv" in root:
            continue
        for f in files:
            path = os.path.join(root, f)
            try:
                with open(path, "r", encoding="utf-8") as file:
                    content = file.read()
                    if "BRIDGE" in content or "THORSwap" in content or "EXCHANGE ACCOUNT" in content:
                        print(f"FOUND IN: {path}")
            except Exception:
                pass

search_dir(".")
