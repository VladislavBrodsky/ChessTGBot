import sqlite3
conn = sqlite3.connect('chess_tg_bot.db')
c = conn.cursor()
c.execute("DROP TABLE IF EXISTS broadcasts;")
conn.commit()
conn.close()
