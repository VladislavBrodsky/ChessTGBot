import sqlite3

conn = sqlite3.connect('backend/chess.db')
cursor = conn.cursor()

cursor.execute("""
    SELECT l.id, l.title, l.difficulty, COUNT(s.id) as step_count, SUM(CASE WHEN s.fen IS NOT NULL THEN 1 ELSE 0 END) as fen_count
    FROM lessons l
    LEFT JOIN lesson_steps s ON l.id = s.lesson_id
    GROUP BY l.id
    ORDER BY l.id ASC
""")

rows = cursor.fetchall()

print("| # | Lesson Title | Difficulty | Steps | FENs | Status |")
print("|---|---|---|---|---|---|")

for row in rows:
    l_id, title, difficulty, steps, fens = row
    status = "🟢 Completed" if steps > 0 else "🔴 Not Started"
    print(f"| {l_id} | {title} | {difficulty} | {steps} | {fens} | {status} |")

