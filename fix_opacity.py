import os
import re

directory = 'frontend/src'

patterns = [
    # text-brand-primary/10, text-brand-primary/20, etc
    (re.compile(r'text-brand-primary/[1-9]0'), r'text-brand-muted'),
    
    # text-brand-primary opacity-10, opacity-20, etc. (Handles variable spacing)
    (re.compile(r'text-brand-primary\s+opacity-[1-9]0'), r'text-brand-muted'),
    
    # opacity-10 text-brand-primary, opacity-20 text-brand-primary, etc.
    (re.compile(r'opacity-[1-9]0\s+text-brand-primary'), r'text-brand-muted'),
]

files_changed = 0

for root, _, files in os.walk(directory):
    for file in files:
        if file.endswith('.tsx') or file.endswith('.ts'):
            path = os.path.join(root, file)
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            new_content = content
            for pattern, replacement in patterns:
                new_content = pattern.sub(replacement, new_content)
                
            if new_content != content:
                with open(path, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                files_changed += 1
                print(f"Fixed: {path}")

print(f"Total files updated: {files_changed}")
