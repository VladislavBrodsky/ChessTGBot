import os
import glob

def replace_in_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()
    
    # We want to replace "max-w-sm" with "max-w-sm md:max-w-xl lg:max-w-3xl"
    # But carefully avoiding lines where it's already done or replacing "max-w-sm md:max-w-md"
    
    new_content = content.replace("max-w-sm md:max-w-md", "max-w-sm md:max-w-xl lg:max-w-3xl")
    new_content = new_content.replace("max-w-sm mx-auto", "max-w-sm md:max-w-xl lg:max-w-3xl mx-auto")
    new_content = new_content.replace("max-w-sm flex", "max-w-sm md:max-w-xl lg:max-w-3xl flex")
    new_content = new_content.replace("max-w-sm text-center", "max-w-sm md:max-w-xl lg:max-w-3xl text-center")
    new_content = new_content.replace("max-w-sm w-full", "max-w-sm md:max-w-xl lg:max-w-3xl w-full")
    new_content = new_content.replace("max-w-sm premium-neon-card", "max-w-sm md:max-w-xl lg:max-w-3xl premium-neon-card")
    
    if new_content != content:
        with open(filepath, 'w') as f:
            f.write(new_content)
        print(f"Updated {filepath}")

for root, _, files in os.walk('frontend/src/app'):
    for file in files:
        if file.endswith('.tsx'):
            replace_in_file(os.path.join(root, file))

