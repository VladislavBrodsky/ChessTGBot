"""Update lesson HTML content

Revision ID: d7e30c4f8d22
Revises: c7d20b3f9e14
Create Date: 2026-07-16 20:15:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.sql import text

# revision identifiers, used by Alembic.
revision = 'd7e30c4f8d22'
down_revision = 'c7d20b3f9e14'
branch_labels = None
depends_on = None

def upgrade():
    # Update piece values
    op.execute(
        text('''
        UPDATE lesson_steps
        SET content = '<div class="space-y-4">
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
</div>'
        WHERE lesson_id = (SELECT id FROM lessons WHERE slug = 'piece-values') AND order_index = 1;
        ''')
    )
    
    op.execute(
        text('''
        UPDATE lesson_steps
        SET content = '<div class="space-y-4">
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
</div>'
        WHERE lesson_id = (SELECT id FROM lessons WHERE slug = 'piece-values') AND order_index = 2;
        ''')
    )

    # Update forks
    op.execute(
        text('''
        UPDATE lesson_steps
        SET content = '<div class="space-y-4">
    <p>A <strong class="text-amber-400 font-black">fork</strong> is a devastating tactical maneuver where a single piece attacks two or more of the opponent''s pieces at the exact same time.</p>
    <div class="p-4 rounded-2xl bg-brand-void/30 border border-white/5">
        <ul class="list-disc pl-5 space-y-2 text-sm text-brand-primary/80 font-medium">
            <li>It forces your opponent into a difficult choice.</li>
            <li>Since they can only move one piece per turn, the other piece is usually lost!</li>
        </ul>
    </div>
</div>'
        WHERE lesson_id = (SELECT id FROM lessons WHERE slug = 'forks') AND order_index = 1;
        ''')
    )
    
    op.execute(
        text('''
        UPDATE lesson_steps
        SET content = '<div class="space-y-4">
    <p>While any piece can fork, <strong class="text-amber-400 font-black">Knights</strong> are the undisputed masters of this tactic.</p>
    <p class="text-sm text-brand-primary/80 leading-relaxed">Because of their unique L-shaped movement, knights can attack pieces without being attacked back in the same way. The most famous fork is the <em class="text-emerald-400 not-italic font-bold">Royal Fork</em>, which attacks the King and Queen simultaneously!</p>
</div>'
        WHERE lesson_id = (SELECT id FROM lessons WHERE slug = 'forks') AND order_index = 2;
        ''')
    )

def downgrade():
    pass
