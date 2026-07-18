import re

with open('frontend/src/app/[locale]/profile/page.tsx', 'r') as f:
    content = f.read()

# L63: SVG Chart stroke colors
content = content.replace('isPositiveTrend ? "#10b981" : "#f43f5e"', 'isPositiveTrend ? "var(--color-brand-success)" : "var(--color-brand-danger)"')

# Shadows
content = content.replace('shadow-[0_8px_32px_rgba(0,0,0,0.3)]', 'shadow-premium')

# Premium badge
content = content.replace('border-purple-500/30 bg-gradient-to-br from-purple-500/20 to-purple-700/20 text-purple-400 text-[10px] font-black uppercase tracking-widest whitespace-nowrap shadow-[0_0_12px_rgba(168,85,247,0.25)]', 'border-brand-gold/30 bg-gradient-to-br from-brand-gold/20 to-brand-gold/40 text-brand-gold text-[10px] font-black uppercase tracking-widest whitespace-nowrap shadow-neon')
content = content.replace('👑 PREMIUM', '{t.has(\'premium_title\') ? t(\'premium_title\') : \'👑 PREMIUM\'}')

# Combatant
content = content.replace('"Combatant"', '(t.has(\'combatant\') ? t(\'combatant\') : \'Combatant\')')

# Day Streak
content = content.replace('text-orange-500 bg-orange-500/10 px-3 py-1 rounded-full border border-orange-500/20 shadow-[0_0_10px_rgba(249,115,22,0.2)]', 'text-brand-gold bg-brand-gold/10 px-3 py-1 rounded-full border border-brand-gold/20 shadow-neon')

# Dark modifiers in badges
content = content.replace('dark:bg-slate-500', 'bg-brand-surface')
content = content.replace('dark:text-emerald-400', 'text-brand-success')

# Emerald/Rose in W/L breakdown
content = content.replace('bg-emerald-500', 'bg-brand-success')
content = content.replace('text-emerald-500', 'text-brand-success')
content = content.replace('bg-rose-500', 'bg-brand-danger')
content = content.replace('text-rose-500', 'text-brand-danger')

# Strings
content = content.replace('"Rating Trajectory"', '{t.has(\'rating_trajectory\') ? t(\'rating_trajectory\') : \'Rating Trajectory\'}')
content = content.replace('"Last 10 Games"', '{t.has(\'last_10_games\') ? t(\'last_10_games\') : \'Last 10 Games\'}')
content = content.replace('"Inventory & Boosters"', '{t.has(\'inventory_boosters\') ? t(\'inventory_boosters\') : \'Inventory & Boosters\'}')
content = content.replace('"Active Booster"', '{t.has(\'active_booster\') ? t(\'active_booster\') : \'Active Booster\'}')
content = content.replace('"Expires:"', '{t.has(\'expires\') ? t(\'expires\') : \'Expires:\'}')
content = content.replace('"Cosmetics Owned"', '{t.has(\'cosmetics_owned\') ? t(\'cosmetics_owned\') : \'Cosmetics Owned\'}')
content = content.replace('"Profile Styles"', '{t.has(\'profile_styles\') ? t(\'profile_styles\') : \'Profile Styles\'}')
content = content.replace('>vs<', '>{t.has(\'vs\') ? t(\'vs\') : \'vs\'}<')
content = content.replace('AI Engine', "{t.has('ai_engine') ? t('ai_engine') : 'AI Engine'}")

# Booster block
content = content.replace('border-purple-500/30 shadow-[0_8px_32px_rgba(168,85,247,0.15)] bg-gradient-to-br from-purple-500/15 to-transparent', 'border-brand-primary/30 shadow-premium bg-gradient-to-br from-brand-primary/15 to-transparent')
content = content.replace('text-purple-400 drop-shadow-[0_0_12px_rgba(168,85,247,0.6)]', 'text-brand-primary drop-shadow-md')

# Game outcome hover glow
content = content.replace('group-hover:shadow-[0_0_12px_rgba(16,185,129,0.2)]', 'group-hover:shadow-neon')
content = content.replace('group-hover:shadow-[0_0_12px_rgba(239,68,68,0.2)]', 'group-hover:shadow-neon')
content = content.replace('text-emerald-400', 'text-brand-success')
content = content.replace('text-red-400', 'text-brand-danger')
content = content.replace('bg-emerald-500/20 text-emerald-500', 'bg-brand-success/20 text-brand-success')
content = content.replace('bg-red-500/20 text-red-500', 'bg-brand-danger/20 text-brand-danger')
content = content.replace('bg-emerald-500/10 text-emerald-500', 'bg-brand-success/10 text-brand-success')
content = content.replace('bg-red-500/10 text-red-500', 'bg-brand-danger/10 text-brand-danger')


with open('frontend/src/app/[locale]/profile/page.tsx', 'w') as f:
    f.write(content)
