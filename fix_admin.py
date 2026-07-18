import os

admin_path = 'frontend/src/app/[locale]/admin/page.tsx'
with open(admin_path, 'r') as f:
    content = f.read()

# Replace hardcoded purples with semantic tokens
content = content.replace('bg-purple-600', 'bg-brand-primary')
content = content.replace('bg-purple-500/15', 'bg-brand-primary/15')
content = content.replace('bg-purple-500/20', 'bg-brand-primary/20')
content = content.replace('bg-purple-500/5', 'bg-brand-primary/10')
content = content.replace('hover:bg-purple-500', 'hover:bg-brand-primary')
content = content.replace('border-purple-500/30', 'border-brand-primary/30')
content = content.replace('border-purple-500/20', 'border-brand-primary/20')
content = content.replace('border-purple-500', 'border-brand-primary')
content = content.replace('text-purple-300', 'text-brand-primary')
content = content.replace('text-purple-400', 'text-brand-primary')
content = content.replace('shadow-[0_0_15px_rgba(168,85,247,0.3)]', 'shadow-[0_0_15px_var(--color-brand-primary)]')
content = content.replace('shadow-[0_0_12px_rgba(147,51,234,0.5)]', 'shadow-[0_0_12px_var(--color-brand-primary)]')
content = content.replace('border-t-purple-500', 'border-t-brand-primary')

with open(admin_path, 'w') as f:
    f.write(content)

print("Admin panel UI updated.")
