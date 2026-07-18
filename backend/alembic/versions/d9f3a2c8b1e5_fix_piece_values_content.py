"""Fix piece values lesson content formatting — clean row-based HTML.

Revision ID: d9f3a2c8b1e5
Revises: c7d20b3f9e14
Create Date: 2026-07-18
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import text

revision = 'd9f3a2c8b1e5'
down_revision = 'c7d20b3f9e14'
branch_labels = None
depends_on = None

STEP1_CONTENT = """<div class="space-y-3">
<p>Every chess piece has a relative numerical value. Understanding these values helps you decide which trades are beneficial!</p>
<div style="display:flex;align-items:center;gap:12px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:12px;padding:12px 16px">
  <span style="font-size:1.5rem">♙</span>
  <span style="font-weight:900;text-transform:uppercase;letter-spacing:0.1em;font-size:0.75rem">PAWN</span>
  <span style="color:#FBBF24;font-weight:700;margin-left:auto;font-size:0.875rem">1 Point</span>
</div>
<div style="display:flex;align-items:center;gap:12px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:12px;padding:12px 16px">
  <span style="font-size:1.5rem">♗ ♘</span>
  <span style="font-weight:900;text-transform:uppercase;letter-spacing:0.1em;font-size:0.75rem">KNIGHT / BISHOP</span>
  <span style="color:#FBBF24;font-weight:700;margin-left:auto;font-size:0.875rem">3 Points</span>
</div>
</div>"""

STEP2_CONTENT = """<div class="space-y-3">
<p>The major pieces hold the most power. The King, however, cannot be captured — its value is <span style="color:#FBBF24;font-weight:700">infinite</span>!</p>
<div style="display:flex;align-items:center;gap:12px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:12px;padding:12px 16px">
  <span style="font-size:1.5rem">♖</span>
  <span style="font-weight:900;text-transform:uppercase;letter-spacing:0.1em;font-size:0.75rem">ROOK</span>
  <span style="color:#FBBF24;font-weight:700;margin-left:auto;font-size:0.875rem">5 Points</span>
</div>
<div style="display:flex;align-items:center;gap:12px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:12px;padding:12px 16px">
  <span style="font-size:1.5rem">♕</span>
  <span style="font-weight:900;text-transform:uppercase;letter-spacing:0.1em;font-size:0.75rem">QUEEN</span>
  <span style="color:#FBBF24;font-weight:700;margin-left:auto;font-size:0.875rem">9 Points</span>
</div>
<div style="display:flex;align-items:center;gap:12px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:12px;padding:12px 16px">
  <span style="font-size:1.5rem">♔</span>
  <span style="font-weight:900;text-transform:uppercase;letter-spacing:0.1em;font-size:0.75rem">KING</span>
  <span style="color:#FBBF24;font-weight:700;margin-left:auto;font-size:0.875rem">∞ Points</span>
</div>
<div style="margin-top:12px;padding:12px 16px;border-radius:12px;background:rgba(251,191,36,0.1);border:1px solid rgba(251,191,36,0.2)">
  <span style="font-size:0.625rem;font-weight:900;text-transform:uppercase;letter-spacing:0.1em;color:#FBBF24">💡 Strategic Tip</span>
  <p style="margin-top:4px;font-size:0.875rem;font-weight:500">Trading a 3-point piece for a 5-point piece is a great deal!</p>
</div>
</div>"""


def upgrade():
    conn = op.get_bind()

    # Get the piece-values lesson id
    result = conn.execute(text("SELECT id FROM lessons WHERE slug = 'piece-values'")).fetchone()
    if result:
        lesson_id = result[0]
        conn.execute(
            text("UPDATE lesson_steps SET content = :content WHERE lesson_id = :lid AND order_index = 1"),
            {"content": STEP1_CONTENT, "lid": lesson_id}
        )
        conn.execute(
            text("UPDATE lesson_steps SET content = :content WHERE lesson_id = :lid AND order_index = 2"),
            {"content": STEP2_CONTENT, "lid": lesson_id}
        )


def downgrade():
    pass
