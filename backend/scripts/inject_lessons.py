import json

import pprint

def main():
    json_path = "backend/scripts/generated_lessons_full.json"
    alembic_path = "backend/alembic/versions/c7d20b3f9e14_seed_academy_content_and_gamification.py"
    
    with open(json_path, 'r') as f:
        generated = json.load(f)
        
    with open(alembic_path, 'r') as f:
        alembic_content = f.read()
        
    # Find the LESSONS = [ ... ] block
    # We'll just replace everything between LESSONS = [ and the PUZZLES = [
    # But wait, it's safer to just split by "PUZZLES = [" and replace the LESSONS part.
    
    original_lessons = [
        {
            "slug": "piece-values",
            "title": "Piece Values",
            "description": "Learn the relative values of each chess piece to make better trades.",
            "difficulty": "Beginner",
            "order_index": 1,
            "xp_reward": 50,
            "steps": [
                {"order_index": 1, "content": """<div class="space-y-4">
    <p>Every chess piece has a relative numerical value. Understanding these values helps you decide which trades are beneficial!</p>
    <div class="grid grid-cols-2 gap-4">
        <div class="glass-panel p-4 flex flex-col items-center justify-center rounded-2xl border border-white/5 bg-white/5">
            <span class="text-3xl mb-2 drop-shadow-md">♙</span>
            <span class="font-bold text-brand-primary text-xs uppercase tracking-widest">Pawn</span>
            <span class="text-amber-400 font-black text-lg">1 Point</span>
        </div>
        <div class="glass-panel p-4 flex flex-col items-center justify-center rounded-2xl border border-white/5 bg-white/5">
            <span class="text-3xl mb-2 drop-shadow-md">♘ ♗</span>
            <span class="font-bold text-brand-primary text-xs uppercase tracking-widest text-center">Knight / Bishop</span>
            <span class="text-amber-400 font-black text-lg">3 Points</span>
        </div>
    </div>
</div>""", "fen": None},
                {"order_index": 2, "content": """<div class="space-y-4">
    <p>The major pieces hold the most power. The King, however, cannot be captured, so its value is <span class="text-amber-400 font-bold">infinite</span>!</p>
    <div class="grid grid-cols-2 gap-4">
        <div class="glass-panel p-4 flex flex-col items-center justify-center rounded-2xl border border-white/5 bg-white/5">
            <span class="text-3xl mb-2 drop-shadow-md">♖</span>
            <span class="font-bold text-brand-primary text-xs uppercase tracking-widest">Rook</span>
            <span class="text-amber-400 font-black text-lg">5 Points</span>
        </div>
        <div class="glass-panel p-4 flex flex-col items-center justify-center rounded-2xl border border-white/5 bg-white/5">
            <span class="text-3xl mb-2 drop-shadow-md">♕</span>
            <span class="font-bold text-brand-primary text-xs uppercase tracking-widest">Queen</span>
            <span class="text-amber-400 font-black text-lg">9 Points</span>
        </div>
    </div>
    <div class="mt-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
        <span class="text-amber-400 font-black uppercase tracking-widest text-[10px]">Strategic Tip</span>
        <p class="text-sm mt-1 text-brand-primary/90 font-medium">Trading a 3-point piece for a 5-point piece is a great deal!</p>
    </div>
</div>""", "fen": None},
            ],
        },
        {
            "slug": "forks",
            "title": "Forks",
            "description": "Attack two pieces at once to gain a material advantage.",
            "difficulty": "Intermediate",
            "order_index": 2,
            "xp_reward": 100,
            "steps": [
                {"order_index": 1, "content": """<div class="space-y-4">
    <p>A <strong class="text-amber-400 font-black">fork</strong> is a devastating tactical maneuver where a single piece attacks two or more of the opponent's pieces at the exact same time.</p>
    <div class="p-4 rounded-2xl bg-brand-void/30 border border-white/5">
        <ul class="list-disc pl-5 space-y-2 text-sm text-brand-primary/80 font-medium">
            <li>It forces your opponent into a difficult choice.</li>
            <li>Since they can only move one piece per turn, the other piece is usually lost!</li>
        </ul>
    </div>
</div>""", "fen": "8/8/8/3N4/8/2q1k3/8/8 w - - 0 1"},
                {"order_index": 2, "content": """<div class="space-y-4">
    <p>While any piece can fork, <strong class="text-amber-400 font-black">Knights</strong> are the undisputed masters of this tactic.</p>
    <p class="text-sm text-brand-primary/80 leading-relaxed">Because of their unique L-shaped movement, knights can attack pieces without being attacked back in the same way. The most famous fork is the <em class="text-emerald-400 not-italic font-bold">Royal Fork</em>, which attacks the King and Queen simultaneously!</p>
</div>""", "fen": None},
            ],
        }
    ]
    
    all_lessons = original_lessons + generated
    
    # Use pprint.pformat to generate valid Python instead of JSON (which has null, true, false)
    lessons_str = "LESSONS = " + pprint.pformat(all_lessons, indent=4, sort_dicts=False)
    
    # Use string splitting to avoid re.sub escape character issues
    parts = alembic_content.split("PUZZLES = [")
    if len(parts) == 2:
        # Find the start of LESSONS = [
        prefix = parts[0][:parts[0].find("LESSONS = [")]
        new_content = prefix + lessons_str + "\n\nPUZZLES = [" + parts[1]
    else:
        print("Could not find PUZZLES = [ to anchor the split.")
        return
    
    with open(alembic_path, 'w') as f:
        f.write(new_content)
        
    print(f"Successfully injected {len(all_lessons)} lessons into Alembic seed.")

if __name__ == "__main__":
    main()
