"""Seed academy content, achievements, and themes

The academy went DB-driven (5b106fd5041a / 859df7f35d7b) but nothing populated
production: backend/scripts/seed_content.py and seed_gamification.py are
standalone scripts nobody runs on deploy, so the Mastery Tracks list, the
achievements page, and the theme shop all rendered empty. Seed the same data
here so it ships with `alembic upgrade head`.

Idempotent by natural key (lessons.slug, puzzles.fen, achievements.code,
themes.code): existing rows are left untouched — no DELETE, since
user_achievements/user_inventory hold foreign keys into these tables.

Revision ID: c7d20b3f9e14
Revises: 5b106fd5041a
Create Date: 2026-07-15 15:40:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.sql import table, column

# revision identifiers, used by Alembic.
revision: str = 'c7d20b3f9e14'
down_revision: Union[str, Sequence[str], None] = '5b106fd5041a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


lessons_t = table(
    'lessons',
    column('id', sa.Integer),
    column('slug', sa.String),
    column('title', sa.String),
    column('description', sa.Text),
    column('difficulty', sa.String),
    column('order_index', sa.Integer),
    column('xp_reward', sa.Integer),
)

lesson_steps_t = table(
    'lesson_steps',
    column('id', sa.Integer),
    column('lesson_id', sa.Integer),
    column('order_index', sa.Integer),
    column('content', sa.Text),
    column('fen', sa.String),
)

puzzles_t = table(
    'puzzles',
    column('id', sa.Integer),
    column('fen', sa.String),
    column('solution', sa.String),
    column('theme', sa.String),
    column('difficulty', sa.String),
    column('rating', sa.Integer),
    column('xp_reward', sa.Integer),
)

achievements_t = table(
    'achievements',
    column('id', sa.Integer),
    column('code', sa.String),
    column('title', sa.String),
    column('description', sa.String),
    column('icon', sa.String),
    column('xp_reward', sa.Integer),
    column('requirement_type', sa.String),
    column('requirement_value', sa.Integer),
)

themes_t = table(
    'themes',
    column('id', sa.Integer),
    column('code', sa.String),
    # 'BOARD'/'PIECES' are the labels of the themetype enum created in 859df7f35d7b.
    column('theme_type', sa.Enum('BOARD', 'PIECES', name='themetype')),
    column('name', sa.String),
    column('description', sa.String),
    column('price_xp', sa.Integer),
    column('css_class', sa.String),
)

LESSONS = [   {   'slug': 'piece-values',
        'title': 'Piece Values',
        'description': 'Learn the relative values of each chess piece to make '
                       'better trades.',
        'difficulty': 'Beginner',
        'order_index': 1,
        'xp_reward': 50,
        'steps': [   {   'order_index': 1,
                         'content': '<div class="space-y-3">\n'
                                    '    <p>Every chess piece has a relative '
                                    'numerical value. Understanding these '
                                    'values helps you decide which trades are '
                                    'beneficial!</p>\n'
                                    '    <div class="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3">\n'
                                    '        <span class="text-2xl drop-shadow-md">♙</span>\n'
                                    '        <span class="font-black text-brand-primary uppercase tracking-widest text-xs">PAWN</span>\n'
                                    '        <span class="text-amber-400 font-bold ml-auto text-sm">1 Point</span>\n'
                                    '    </div>\n'
                                    '    <div class="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3">\n'
                                    '        <span class="text-2xl drop-shadow-md">♗ ♘</span>\n'
                                    '        <span class="font-black text-brand-primary uppercase tracking-widest text-xs">KNIGHT / BISHOP</span>\n'
                                    '        <span class="text-amber-400 font-bold ml-auto text-sm">3 Points</span>\n'
                                    '    </div>\n'
                                    '</div>',
                         'fen': None},
                     {   'order_index': 2,
                         'content': '<div class="space-y-3">\n'
                                    '    <p>The major pieces hold the most '
                                    'power. The King, however, cannot be '
                                    'class="text-amber-400 font-bold">infinite</span>!</p>\n'
                                    '    <div class="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3">\n'
                                    '        <span class="text-2xl drop-shadow-md">♖</span>\n'
                                    '        <span class="font-black text-brand-primary uppercase tracking-widest text-xs">ROOK</span>\n'
                                    '        <span class="text-amber-400 font-bold ml-auto text-sm">5 Points</span>\n'
                                    '    </div>\n'
                                    '    <div class="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3">\n'
                                    '        <span class="text-2xl drop-shadow-md">♕</span>\n'
                                    '        <span class="font-black text-brand-primary uppercase tracking-widest text-xs">QUEEN</span>\n'
                                    '        <span class="text-amber-400 font-bold ml-auto text-sm">9 Points</span>\n'
                                    '    </div>\n'
                                    '    <div class="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3">\n'
                                    '        <span class="text-2xl drop-shadow-md">♔</span>\n'
                                    '        <span class="font-black text-brand-primary uppercase tracking-widest text-xs">KING</span>\n'
                                    '        <span class="text-amber-400 font-bold ml-auto text-sm">∞ Points</span>\n'
                                    '    </div>\n'
                                    '</div>',
                         'fen': None}]},
    {   'slug': 'forks',
        'title': 'Forks',
        'description': 'Attack two pieces at once to gain a material '
                       'advantage.',
        'difficulty': 'Intermediate',
        'order_index': 2,
        'xp_reward': 100,
        'steps': [   {   'order_index': 1,
                         'content': '<div class="space-y-4">\n'
                                    '    <p>A <strong class="text-amber-400 '
                                    'font-black">fork</strong> is a '
                                    'devastating tactical maneuver where a '
                                    'single piece attacks two or more of the '
                                    "opponent's pieces at the exact same "
                                    'time.</p>\n'
                                    '    <div class="p-4 rounded-2xl '
                                    'bg-brand-void/30 border border-white/5">\n'
                                    '        <ul class="list-disc pl-5 '
                                    'space-y-2 text-sm text-brand-primary/80 '
                                    'font-medium">\n'
                                    '            <li>It forces your opponent '
                                    'into a difficult choice.</li>\n'
                                    '            <li>Since they can only move '
                                    'one piece per turn, the other piece is '
                                    'usually lost!</li>\n'
                                    '        </ul>\n'
                                    '    </div>\n'
                                    '</div>',
                         'fen': '8/8/8/3N4/8/2q1k3/8/8 w - - 0 1'},
                     {   'order_index': 2,
                         'content': '<div class="space-y-4">\n'
                                    '    <p>While any piece can fork, <strong '
                                    'class="text-amber-400 '
                                    'font-black">Knights</strong> are the '
                                    'undisputed masters of this tactic.</p>\n'
                                    '    <p class="text-sm '
                                    'text-brand-primary/80 '
                                    'leading-relaxed">Because of their unique '
                                    'L-shaped movement, knights can attack '
                                    'pieces without being attacked back in the '
                                    'same way. The most famous fork is the <em '
                                    'class="text-emerald-400 not-italic '
                                    'font-bold">Royal Fork</em>, which attacks '
                                    'the King and Queen simultaneously!</p>\n'
                                    '</div>',
                         'fen': None}]},
    {   'slug': 'the-chessboard-coordinates',
        'title': 'The Chessboard & Coordinates',
        'description': 'Learn the basics of the chessboard layout and how to '
                       'identify squares using coordinates.',
        'difficulty': 'Beginner',
        'xp_reward': 50,
        'steps': [   {   'order_index': 1,
                         'content': '<strong>Welcome to the '
                                    'Chessboard!</strong> The chessboard '
                                    'consists of 64 squares arranged in an 8x8 '
                                    'grid. Each square can be identified by a '
                                    'unique coordinate, which combines a '
                                    'letter and a number. The columns are '
                                    'labeled <em>a</em> to <em>h</em> from '
                                    'left to right, and the rows are numbered '
                                    '<em>1</em> to <em>8</em> from bottom to '
                                    'top.',
                         'fen': None},
                     {   'order_index': 2,
                         'content': '<strong>Understanding '
                                    'Coordinates:</strong> Each square on the '
                                    'board is represented by a coordinate such '
                                    'as <em>a1</em>, <em>e4</em>, or '
                                    '<em>h8</em>. The letter indicates the '
                                    'column, and the number indicates the row. '
                                    'For example, <em>a1</em> is the '
                                    'bottom-left corner of the board.',
                         'fen': None},
                     {   'order_index': 3,
                         'content': '<strong>Practice Identifying '
                                    'Squares:</strong> Look at the chessboard '
                                    'and try to identify the coordinates of '
                                    'specific squares. For example, what is '
                                    'the coordinate of the square in the '
                                    'second row and the fifth column?',
                         'fen': None},
                     {   'order_index': 4,
                         'content': '<strong>Quiz Yourself:</strong> Can you '
                                    'name the coordinates of all the squares '
                                    'in the first row? Remember, they start '
                                    'from <em>a1</em> to <em>h1</em>. Test '
                                    'your knowledge!',
                         'fen': None}],
        'order_index': 1},
    {   'slug': 'the-mighty-pawns',
        'title': 'The Mighty Pawns',
        'description': 'Discover the power of pawns and how they move and '
                       'capture on the chessboard.',
        'difficulty': 'Beginner',
        'xp_reward': 50,
        'steps': [   {   'order_index': 1,
                         'content': '<strong>Pawns</strong> are the most '
                                    'numerous pieces on the board, and they '
                                    'move forward <em>one square</em> at a '
                                    'time. However, on their first move, they '
                                    'can choose to move <em>two squares</em> '
                                    'forward.',
                         'fen': 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR'},
                     {   'order_index': 2,
                         'content': 'Pawns capture pieces '
                                    '<strong>diagonally</strong>, moving one '
                                    'square forward to the left or right. This '
                                    'is an important tactic to remember!',
                         'fen': 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR'},
                     {   'order_index': 3,
                         'content': '<strong>En passant</strong> is a special '
                                    'pawn capture that can occur when a pawn '
                                    'moves two squares forward from its '
                                    'starting position and lands beside an '
                                    "opponent's pawn. The opponent can capture "
                                    'it as if it had only moved one square.',
                         'fen': 'rnbqkbnr/pppppppp/8/8/8/P7/PPPPPPPP/RNBQKBNR'},
                     {   'order_index': 4,
                         'content': 'When a pawn reaches the opposite end of '
                                    'the board, it can be '
                                    '<strong>promoted</strong> to any other '
                                    'piece (except a king), usually a queen. '
                                    'This makes pawns powerful in the endgame!',
                         'fen': 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR'}],
        'order_index': 2},
    {   'slug': 'the-noble-knights',
        'title': 'The Noble Knights',
        'description': 'Discover the unique movement of knights and how they '
                       'can control the board with their L-shaped jumps.',
        'difficulty': 'Beginner',
        'xp_reward': 50,
        'steps': [   {   'order_index': 1,
                         'content': '<strong>Welcome to the world of '
                                    'knights!</strong> In chess, knights move '
                                    'in an <em>L-shape</em>: two squares in '
                                    'one direction and then one square '
                                    'perpendicular. This unique movement '
                                    'allows them to jump over other pieces.',
                         'fen': None},
                     {   'order_index': 2,
                         'content': "<strong>Let's practice!</strong> Move "
                                    'your knight from <em>b1</em> to '
                                    '<em>c3</em>. Remember, knights can jump '
                                    "over pieces, so don't worry about what's "
                                    'in between!',
                         'fen': 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w '
                                'KQkq - 0 1'},
                     {   'order_index': 3,
                         'content': '<strong>Great job!</strong> Now, try '
                                    'moving your knight from <em#g1</em> to '
                                    '<em>f2</em>. Can you find other squares '
                                    'your knight can jump to?',
                         'fen': 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w '
                                'KQkq - 0 1'},
                     {   'order_index': 4,
                         'content': '<strong>Challenge yourself!</strong> Move '
                                    'both knights to create a strong position. '
                                    'Remember, knights are powerful in the '
                                    'center of the board!',
                         'fen': 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w '
                                'KQkq - 0 1'}],
        'order_index': 3},
    {   'slug': 'the-swift-bishops',
        'title': 'The Swift Bishops',
        'description': 'Learn how to control the board using the powerful '
                       'diagonal movements of the bishops.',
        'difficulty': 'Beginner',
        'xp_reward': 50,
        'steps': [   {   'order_index': 1,
                         'content': '<strong>Bishops move diagonally</strong> '
                                    'across the board, which allows them to '
                                    'control long stretches of squares. '
                                    '<em>Understanding their movement is key '
                                    'to utilizing them effectively.</em>',
                         'fen': None},
                     {   'order_index': 2,
                         'content': 'In this position, notice how the bishops '
                                    'can control multiple squares. <strong>Try '
                                    'to visualize the diagonals they can '
                                    'cover!</strong>',
                         'fen': 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w '
                                'KQkq - 0 1'},
                     {   'order_index': 3,
                         'content': '<strong>Practice moving your '
                                    'bishops!</strong> Move your bishop from '
                                    'c1 to f4 and observe the squares it now '
                                    'controls. <em>This is a great way to '
                                    'apply pressure on your opponent!</em>',
                         'fen': 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w '
                                'KQkq - 0 1'},
                     {   'order_index': 4,
                         'content': 'Now, try to place your bishops on squares '
                                    "where they can attack your opponent's "
                                    'pieces. <strong>Remember, the more '
                                    'diagonals you control, the stronger your '
                                    'position!</strong>',
                         'fen': 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w '
                                'KQkq - 0 1'}],
        'order_index': 4},
    {   'slug': 'the-heavy-rooks',
        'title': 'The Heavy Rooks',
        'description': 'Learn how to dominate the board using your rooks '
                       'effectively on files and ranks.',
        'difficulty': 'Beginner',
        'xp_reward': 50,
        'steps': [   {   'order_index': 1,
                         'content': '<strong>Rooks</strong> are powerful '
                                    'pieces that control entire <em>files</em> '
                                    'and <em>ranks</em>. Understanding how to '
                                    'utilize them can change the outcome of '
                                    'the game.',
                         'fen': None},
                     {   'order_index': 2,
                         'content': 'In the opening, aim to connect your rooks '
                                    'by moving your <strong>pawns</strong> and '
                                    '<strong>knights</strong> out of the way. '
                                    'This allows your rooks to control the '
                                    'center of the board.',
                         'fen': 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w '
                                'KQkq - 0 1'},
                     {   'order_index': 3,
                         'content': 'Once your rooks are connected, place them '
                                    'on open <em>files</em> where they can '
                                    "exert pressure on your opponent's "
                                    'position. Look for opportunities to '
                                    'double your rooks.',
                         'fen': 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w '
                                'KQkq - 0 1'},
                     {   'order_index': 4,
                         'content': 'In the endgame, rooks become even more '
                                    'powerful. Use them to control '
                                    '<strong>ranks</strong> and cut off your '
                                    "opponent's king from escaping. This can "
                                    'lead to checkmate!',
                         'fen': '8/8/8/8/8/8/8/R7 w - - 0 1'}],
        'order_index': 5},
    {   'slug': 'the-all-powerful-queen',
        'title': 'The All-Powerful Queen',
        'description': 'Discover the incredible power of the queen and how to '
                       'use her combined movement to dominate the board.',
        'difficulty': 'Beginner',
        'xp_reward': 50,
        'steps': [   {   'order_index': 1,
                         'content': "<strong>The Queen's Movement:</strong> "
                                    'The queen can move <em>any number of '
                                    'squares</em> in a straight line, whether '
                                    'horizontally, vertically, or diagonally. '
                                    'This makes her the most powerful piece on '
                                    'the board.',
                         'fen': 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w '
                                'KQkq - 0 1'},
                     {   'order_index': 2,
                         'content': '<strong>Combining Movements:</strong> The '
                                    "queen's ability to combine the movements "
                                    'of both the rook and the bishop allows '
                                    'her to control large areas of the board. '
                                    'Practice moving her to different squares '
                                    'to see her range.',
                         'fen': 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w '
                                'KQkq - 0 1'},
                     {   'order_index': 3,
                         'content': '<strong>Check and Checkmate:</strong> Use '
                                    "your queen to put your opponent's king in "
                                    '<em>check</em> or even '
                                    '<em>checkmate</em>. Remember, the queen '
                                    'can attack from a distance, making her a '
                                    'key player in your strategy.',
                         'fen': 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w '
                                'KQkq - 0 1'}],
        'order_index': 6},
    {   'slug': 'the-king-check',
        'title': 'The King & Check',
        'description': 'Learn how to defend your king from threats and ensure '
                       'its safety in the game of chess.',
        'difficulty': 'Beginner',
        'xp_reward': 50,
        'steps': [   {   'order_index': 1,
                         'content': '<strong>Understanding Check:</strong> In '
                                    'chess, when your king is under threat '
                                    "from an opponent's piece, it is said to "
                                    'be in <em>check</em>. You must respond to '
                                    'this threat immediately.',
                         'fen': 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR'},
                     {   'order_index': 2,
                         'content': '<strong>Moving the King:</strong> One way '
                                    'to get out of check is to move your king '
                                    'to a safe square. Remember, the king can '
                                    'only move one square in any direction.',
                         'fen': 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR'},
                     {   'order_index': 3,
                         'content': '<strong>Blocking the Check:</strong> '
                                    'Another option is to place one of your '
                                    'pieces between the attacking piece and '
                                    'your king. This is known as '
                                    '<em>blocking</em> the check.',
                         'fen': 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR'},
                     {   'order_index': 4,
                         'content': '<strong>Capturing the Attacker:</strong> '
                                    'If possible, you can also capture the '
                                    'piece that is putting your king in check. '
                                    'This removes the threat entirely.',
                         'fen': 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR'}],
        'order_index': 7},
    {   'slug': 'checkmate-the-goal',
        'title': 'Checkmate: The Goal',
        'description': 'Learn the ultimate objective of chess: to checkmate '
                       "your opponent's king!",
        'difficulty': 'Beginner',
        'xp_reward': 50,
        'steps': [   {   'order_index': 1,
                         'content': '<strong>Checkmate</strong> is the '
                                    "position in chess where the opponent's "
                                    'king is in <em>check</em> and cannot '
                                    'escape. Your goal is to put your '
                                    "opponent's king in checkmate to win the "
                                    'game.',
                         'fen': None},
                     {   'order_index': 2,
                         'content': 'To achieve checkmate, you must attack the '
                                    'king while ensuring it has no legal moves '
                                    'left. This often involves coordinating '
                                    'your pieces effectively.',
                         'fen': None},
                     {   'order_index': 3,
                         'content': 'Practice recognizing checkmate patterns, '
                                    'such as the back rank mate or the classic '
                                    'checkmate with a queen and king against a '
                                    'lone king.',
                         'fen': '8/8/8/8/8/5K2/5Q2/8 w - - 0 1'},
                     {   'order_index': 4,
                         'content': 'Now, try to checkmate your opponent! Set '
                                    'up a position and see if you can find the '
                                    'winning move. Remember to think about '
                                    "your opponent's responses.",
                         'fen': 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w '
                                'KQkq - 0 1'}],
        'order_index': 8},
    {   'slug': 'castling',
        'title': 'Castling',
        'description': 'Learn how to protect your king and connect your rooks '
                       'with the special move called castling.',
        'difficulty': 'Beginner',
        'xp_reward': 50,
        'steps': [   {   'order_index': 1,
                         'content': '<strong>Castling</strong> is a special '
                                    'move in chess that allows you to move '
                                    'your king two squares towards a rook and '
                                    'then move that rook to the square next to '
                                    'the king. This move helps in '
                                    '<em>protecting your king</em> and '
                                    '<em>connecting your rooks</em>.',
                         'fen': 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR'},
                     {   'order_index': 2,
                         'content': '<strong>Conditions for Castling:</strong> '
                                    'You can only castle if neither the king '
                                    'nor the rook has moved, there are no '
                                    'pieces between them, and the king is not '
                                    'in check, nor does it pass through or '
                                    'land on a square that is attacked.',
                         'fen': 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR'},
                     {   'order_index': 3,
                         'content': '<strong>Types of Castling:</strong> There '
                                    'are two types of castling: '
                                    '<em>kingside</em> (short) and '
                                    '<em>queenside</em> (long). In kingside '
                                    'castling, the king moves towards the rook '
                                    'on the right, while in queenside '
                                    'castling, it moves towards the rook on '
                                    'the left.',
                         'fen': 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR'},
                     {   'order_index': 4,
                         'content': '<strong>Practice Castling:</strong> Try '
                                    'to castle in the following position. '
                                    'Remember to check the conditions before '
                                    'you make the move!',
                         'fen': 'rnbqkb1r/pppppppp/5n2/8/8/8/PPPPPPPP/RNBQKBNR'}],
        'order_index': 9},
    {   'slug': 'en-passant',
        'title': 'En Passant',
        'description': 'Learn the unique pawn capture rule that can surprise '
                       'your opponents!',
        'difficulty': 'Beginner',
        'xp_reward': 50,
        'steps': [   {   'order_index': 1,
                         'content': '<strong>En Passant</strong> is a special '
                                    'pawn capture that allows a pawn to take '
                                    "an opponent's pawn that has just moved "
                                    'two squares forward from its starting '
                                    'position, landing beside your pawn. '
                                    '<em>This move can only be made '
                                    "immediately after the opponent's pawn "
                                    'makes the two-square move.</em>',
                         'fen': None},
                     {   'order_index': 2,
                         'content': 'To perform an <strong>En Passant</strong> '
                                    'capture, move your pawn diagonally to the '
                                    "square behind the opponent's pawn. "
                                    '<em>Remember, this move is optional and '
                                    'can only be done right after the '
                                    'two-square advance!</em>',
                         'fen': '8/8/8/8/1P6/8/8/8 w - - 0 1'},
                     {   'order_index': 3,
                         'content': 'If you miss the chance to capture '
                                    '<strong>En Passant</strong>, you cannot '
                                    'do it later. <em>Timing is crucial!</em>',
                         'fen': '8/8/8/8/1P6/8/8/8 b - - 0 1'}],
        'order_index': 10},
    {   'slug': 'pawn-promotion',
        'title': 'Pawn Promotion',
        'description': 'Learn how to turn your pawns into powerful pieces and '
                       'change the course of the game!',
        'difficulty': 'Beginner',
        'xp_reward': 50,
        'steps': [   {   'order_index': 1,
                         'content': '<strong>Pawn Promotion</strong> occurs '
                                    "when a pawn reaches the opponent's back "
                                    'rank. When this happens, you can '
                                    '<em>promote</em> it to any piece, usually '
                                    'a queen, which can greatly increase your '
                                    'chances of winning.',
                         'fen': '8/8/8/8/8/8/5P2/8 w - - 0 1'},
                     {   'order_index': 2,
                         'content': 'To promote your pawn, move it to the last '
                                    "rank on the opponent's side. You will "
                                    'then choose which piece to promote it to. '
                                    '<strong>Most players choose a '
                                    'queen</strong> because of its power and '
                                    'versatility.',
                         'fen': '8/8/8/8/8/8/8/P7 w - - 0 1'},
                     {   'order_index': 3,
                         'content': 'Remember, you can only promote a pawn '
                                    'when it reaches the 8th rank (for white) '
                                    'or the 1st rank (for black). '
                                    '<em>Strategically plan your moves</em> to '
                                    'protect your pawn as it advances.',
                         'fen': '8/8/8/8/8/5P2/8/8 w - - 0 1'},
                     {   'order_index': 4,
                         'content': 'In this position, try to promote your '
                                    'pawn while keeping it safe from capture. '
                                    '<strong>Practice makes perfect!</strong>',
                         'fen': '8/8/8/8/8/8/5P2/8 w - - 0 1'}],
        'order_index': 11},
    {   'slug': 'stalemate-and-draws',
        'title': 'Stalemate & Draws',
        'description': 'Learn how to recognize stalemates and draws to avoid '
                       'losing your game.',
        'difficulty': 'Beginner',
        'xp_reward': 50,
        'steps': [   {   'order_index': 1,
                         'content': '<strong>Stalemate</strong> occurs when a '
                                    'player has no legal moves and their king '
                                    'is not in check. This results in a '
                                    '<em>draw</em>.',
                         'fen': None},
                     {   'order_index': 2,
                         'content': 'A game can also end in a draw if there '
                                    'are insufficient pieces to checkmate, '
                                    'such as <strong>king vs. king</strong>.',
                         'fen': None},
                     {   'order_index': 3,
                         'content': 'Another way to achieve a draw is through '
                                    '<strong>threefold repetition</strong>, '
                                    'where the same position occurs three '
                                    'times with the same player to move.',
                         'fen': None},
                     {   'order_index': 4,
                         'content': 'Finally, a <strong>mutual '
                                    'agreement</strong> between players can '
                                    'also result in a draw, where both players '
                                    'decide to end the game.',
                         'fen': None}],
        'order_index': 12},
    {   'slug': 'the-3-opening-principles',
        'title': 'The 3 Opening Principles',
        'description': 'Learn the essential strategies for a strong chess '
                       'opening to set yourself up for success.',
        'difficulty': 'Beginner',
        'xp_reward': 50,
        'steps': [   {   'order_index': 1,
                         'content': '<strong>Control the Center:</strong> In '
                                    'the opening, it is crucial to control the '
                                    'center of the board, specifically the '
                                    'squares <em>d4</em>, <em>d5</em>, '
                                    '<em>e4</em>, and <em>e5</em>. This allows '
                                    'your pieces to have greater mobility and '
                                    'influence over the game.',
                         'fen': 'rnbqkb1r/pppppppp/8/8/4P3/8/PPPPPPPP/RNBQKBNR '
                                'w KQkq - 0 1'},
                     {   'order_index': 2,
                         'content': '<strong>Develop Your Pieces:</strong> '
                                    'Move your knights and bishops out from '
                                    'their starting positions to active '
                                    'squares where they can control the center '
                                    'and prepare for an attack. Avoid moving '
                                    'the same piece multiple times in the '
                                    'opening unless necessary.',
                         'fen': 'rnbqkb1r/pppppppp/8/8/4P3/8/PPPPPPPP/RNBQKBNR '
                                'w KQkq - 0 1'},
                     {   'order_index': 3,
                         'content': '<strong>Castle Early:</strong> Castling '
                                    'is an important move that not only '
                                    'protects your king but also connects your '
                                    'rooks. Aim to castle within the first 10 '
                                    "moves to ensure your king's safety and "
                                    'enhance your position.',
                         'fen': 'rnbqkb1r/pppppppp/8/8/4P3/8/PPPPPPPP/RNBQKBNR '
                                'w KQkq - 0 1'}],
        'order_index': 13},
    {   'slug': 'basic-mates-2-rooks',
        'title': 'Basic Mates: 2 Rooks',
        'description': 'Learn how to deliver checkmate using two rooks in a '
                       'ladder formation.',
        'difficulty': 'Beginner',
        'xp_reward': 50,
        'steps': [   {   'order_index': 1,
                         'content': '<strong>Welcome to the Ladder Checkmate '
                                    'lesson!</strong> In this lesson, you will '
                                    'learn how to use <em>two rooks</em> to '
                                    "checkmate your opponent's king. The key "
                                    'is to control the board and push the '
                                    'enemy king to the edge.',
                         'fen': None},
                     {   'order_index': 2,
                         'content': '<strong>Step 1:</strong> Position your '
                                    'rooks on the same rank or file to limit '
                                    'the movement of the opposing king. This '
                                    'is the first step in creating a ladder '
                                    'formation.',
                         'fen': '8/8/8/8/8/8/8/RR6/k7 w - - 0 1'},
                     {   'order_index': 3,
                         'content': '<strong>Step 2:</strong> Move one rook to '
                                    "cut off the king's escape route. Ensure "
                                    'that the other rook is ready to support '
                                    'and control the next rank or file.',
                         'fen': '8/8/8/8/8/8/R7/RK6/k7 w - - 0 1'},
                     {   'order_index': 4,
                         'content': '<strong>Step 3:</strong> Continue to push '
                                    'the opposing king to the edge of the '
                                    'board using your rooks in tandem. '
                                    'Remember to keep them on the same rank or '
                                    'file to maintain control.',
                         'fen': '8/8/8/8/8/8/R7/RK6/k7 w - - 0 1'}],
        'order_index': 14},
    {   'slug': 'basic-mates-king-queen',
        'title': 'Basic Mates: King & Queen',
        'description': 'Learn how to checkmate your opponent using the '
                       'powerful combination of a king and queen.',
        'difficulty': 'Beginner',
        'xp_reward': 50,
        'steps': [   {   'order_index': 1,
                         'content': '<strong>Welcome to the Basic Mates '
                                    'lesson!</strong> In this step, we will '
                                    'introduce the <em>Box Method</em>, a '
                                    "technique to restrict your opponent's "
                                    'king and deliver checkmate using your '
                                    'king and queen.',
                         'fen': None},
                     {   'order_index': 2,
                         'content': '<strong>Step 1:</strong> Position your '
                                    'queen to control key squares and limit '
                                    'the movement of the enemy king. Use your '
                                    'king to support your queen and gradually '
                                    'push the enemy king back into a corner.',
                         'fen': '8/8/8/8/8/5KQ/8/8 w - - 0 1'},
                     {   'order_index': 3,
                         'content': '<strong>Step 2:</strong> Once the enemy '
                                    'king is confined to a smaller area, use '
                                    "your queen to create a 'box' around the "
                                    'king. This will restrict its movement '
                                    'further, making it easier to checkmate.',
                         'fen': '8/8/8/8/8/5KQ/8/8 w - - 0 1'},
                     {   'order_index': 4,
                         'content': '<strong>Final Step:</strong> Deliver '
                                    'checkmate by positioning your queen in a '
                                    'way that the enemy king has no legal '
                                    'moves left. Remember to keep your own '
                                    'king close to protect your queen!',
                         'fen': '8/8/8/8/8/5KQ/8/8 w - - 0 1'}],
        'order_index': 15},
    {   'slug': 'basic-mates-king-rook',
        'title': 'Basic Mates: King & Rook',
        'description': 'Learn how to checkmate your opponent using just a king '
                       'and a rook, mastering the concept of opposition.',
        'difficulty': 'Beginner',
        'xp_reward': 50,
        'steps': [   {   'order_index': 1,
                         'content': '<strong>Understanding '
                                    'Opposition:</strong> In chess, '
                                    '<em>opposition</em> is a key concept that '
                                    'helps you control the board and restrict '
                                    "your opponent's king. The player who has "
                                    'the move is said to be in opposition if '
                                    'their king is directly in front of the '
                                    "opponent's king with one square between "
                                    'them.',
                         'fen': None},
                     {   'order_index': 2,
                         'content': '<strong>Setting Up the Board:</strong> '
                                    'Place your king on <em>e4</em> and your '
                                    "rook on <em>e5</em>. Your opponent's king "
                                    'should be on <em>e7</em>. This position '
                                    'allows you to practice using opposition '
                                    "to force your opponent's king back.",
                         'fen': '5k2/5p1p/8/8/5K1R/8/8/8 w - - 0 1'},
                     {   'order_index': 3,
                         'content': '<strong>Executing the Mate:</strong> Move '
                                    'your rook to <em>e6</em> to cut off the '
                                    "opponent's king. Then, use your king to "
                                    'approach and maintain opposition until '
                                    "you can checkmate the opponent's king on "
                                    'the back rank.',
                         'fen': '5k2/5p1p/8/8/5K1R/8/8/8 w - - 0 1'},
                     {   'order_index': 4,
                         'content': '<strong>Practice:</strong> Set up the '
                                    'final position with your rook on '
                                    '<em>e8</em> and your king on <em>f7</em>. '
                                    "The opponent's king should be on "
                                    "<em>h8</em>. Checkmate your opponent's "
                                    'king by moving your rook to <em>e8</em> '
                                    'while your king supports it.',
                         'fen': '5k2/5p1p/8/8/5K1R/8/8/8 w - - 0 1'}],
        'order_index': 16},
    {   'slug': 'hanging-pieces',
        'title': 'Hanging Pieces',
        'description': 'Learn to identify and protect your pieces to avoid '
                       'losing them for free.',
        'difficulty': 'Beginner',
        'xp_reward': 50,
        'steps': [   {   'order_index': 1,
                         'content': '<strong>Hanging pieces</strong> are '
                                    'pieces that can be captured without any '
                                    "compensation. <em>In this lesson, you'll "
                                    'learn how to spot them and protect your '
                                    'valuable pieces!</em>',
                         'fen': 'rnbqkb1r/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w '
                                'KQkq - 0 1'},
                     {   'order_index': 2,
                         'content': '<strong>Identify hanging pieces:</strong> '
                                    'Look for pieces that are not defended by '
                                    'any other pieces. <em>Try to visualize '
                                    "the threats from your opponent's "
                                    'pieces.</em>',
                         'fen': 'rnbqkb1r/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w '
                                'KQkq - 0 1'},
                     {   'order_index': 3,
                         'content': '<strong>Protect your pieces:</strong> '
                                    'Always ensure your pieces are defended by '
                                    'another piece. <em>Consider how you can '
                                    'move your pieces to provide support.</em>',
                         'fen': 'rnbqkb1r/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w '
                                'KQkq - 0 1'},
                     {   'order_index': 4,
                         'content': '<strong>Practice spotting hanging '
                                    'pieces:</strong> Look at the board and '
                                    'identify any hanging pieces for both '
                                    'sides. <em>Can you find a way to protect '
                                    'your pieces while attacking your '
                                    "opponent's?</em>",
                         'fen': 'rnbqkb1r/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w '
                                'KQkq - 0 1'}],
        'order_index': 17},
    {   'slug': 'counting-defenders',
        'title': 'Counting Defenders',
        'description': 'Learn how to evaluate safe trades by counting the '
                       'defenders of each piece.',
        'difficulty': 'Beginner',
        'xp_reward': 50,
        'steps': [   {   'order_index': 1,
                         'content': '<strong>Welcome to the Counting Defenders '
                                    'lesson!</strong> In this lesson, you will '
                                    'learn how to assess whether a trade is '
                                    'safe by counting the number of defenders '
                                    'protecting each piece. <em>Understanding '
                                    'this concept is crucial for making sound '
                                    'trading decisions in your games.</em>',
                         'fen': None},
                     {   'order_index': 2,
                         'content': '<strong>Step 1:</strong> Look at the '
                                    'board and identify the pieces you want to '
                                    'trade. Count how many pieces are '
                                    'defending each of them. <em>For example, '
                                    "if you want to capture an opponent's "
                                    'knight, check how many of your pieces are '
                                    'defending your attacking piece.</em>',
                         'fen': 'rnbqkb1r/pppppppp/8/8/4P3/8/PPPPPPPP/RNBQKBNR '
                                'w KQkq - 0 1'},
                     {   'order_index': 3,
                         'content': "<strong>Step 2:</strong> Now, let's "
                                    'practice! In this position, can you '
                                    'determine if the trade of your bishop for '
                                    "the opponent's knight is safe? <em>Count "
                                    'the defenders for both pieces before '
                                    'making your decision.</em>',
                         'fen': 'rnbqkb1r/pppppppp/8/8/4P3/8/PPPPPPPP/RNBQKBNR '
                                'w KQkq - 0 1'},
                     {   'order_index': 4,
                         'content': '<strong>Step 3:</strong> After evaluating '
                                    'the defenders, make your trade decision. '
                                    '<em>If your piece has more defenders than '
                                    "the opponent's piece, it's a safe "
                                    'trade!</em>',
                         'fen': None}],
        'order_index': 18},
    {   'slug': 'scholars-mate',
        'title': "The Scholar's Mate",
        'description': 'Learn how to execute one of the fastest checkmates in '
                       'chess, perfect for beginners.',
        'difficulty': 'Beginner',
        'xp_reward': 50,
        'steps': [   {   'order_index': 1,
                         'content': "<strong>Welcome to the Scholar's Mate "
                                    'lesson!</strong> In this lesson, you will '
                                    'learn how to trap your opponent early in '
                                    'the game using a simple yet effective '
                                    "strategy. <em>Let's get started!</em>",
                         'fen': None},
                     {   'order_index': 2,
                         'content': '<strong>Step 1:</strong> Begin with the '
                                    'moves <em>e4</em> and <em>e5</em>. This '
                                    'opens up lines for your pieces and sets '
                                    'the stage for your attack.',
                         'fen': 'rnbqkb1r/pppppppp/8/8/4P3/8/PPPPPPPP/RNBQKBNR '
                                'w KQkq - 0 1'},
                     {   'order_index': 3,
                         'content': '<strong>Step 2:</strong> Next, move your '
                                    'queen to <em>h5</em>. This puts pressure '
                                    'on the f7 pawn, which is a weak spot for '
                                    'Black.',
                         'fen': 'rnbqkb1r/pppppppp/8/8/4P3/5Q2/PPPPPPPP/RNB1KBNR '
                                'b KQkq - 0 1'},
                     {   'order_index': 4,
                         'content': '<strong>Step 3:</strong> Finally, move '
                                    'your bishop to <em>c4</em>. This '
                                    "completes the Scholar's Mate setup, "
                                    'threatening checkmate on <em>f7</em>.',
                         'fen': 'rnbqkb1r/pppppppp/8/8/2B1P3/5Q2/PPPPPPPP/RNB1KBNR '
                                'b KQkq - 0 1'}],
        'order_index': 19},
    {   'slug': 'pins-absolute-relative',
        'title': 'Pins: Absolute & Relative',
        'description': "Learn how to paralyze your opponent's pieces using the "
                       'powerful tactic of pins.',
        'difficulty': 'Intermediate',
        'xp_reward': 50,
        'steps': [   {   'order_index': 1,
                         'content': '<strong>What is a Pin?</strong> A '
                                    '<em>pin</em> is a tactical motif where a '
                                    'piece cannot move without exposing a more '
                                    'valuable piece behind it to capture. '
                                    'Understanding this concept is crucial for '
                                    'gaining a material advantage.',
                         'fen': 'rnbqkb1r/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w '
                                'KQkq - 0 1'},
                     {   'order_index': 2,
                         'content': '<strong>Absolute Pin:</strong> An '
                                    '<em>absolute pin</em> occurs when the '
                                    'pinned piece cannot legally move because '
                                    'doing so would place the king in check. '
                                    'This is a powerful tactic that can lead '
                                    'to significant advantages.',
                         'fen': 'rnbqkb1r/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w '
                                'KQkq - 0 1'},
                     {   'order_index': 3,
                         'content': '<strong>Relative Pin:</strong> A '
                                    '<em>relative pin</em> happens when the '
                                    'pinned piece can legally move, but doing '
                                    'so would expose a more valuable piece '
                                    '(like the queen) to capture. Use this to '
                                    'create threats and force your opponent to '
                                    'react.',
                         'fen': 'rnbqkb1r/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w '
                                'KQkq - 0 1'},
                     {   'order_index': 4,
                         'content': '<strong>Practice:</strong> Set up a '
                                    'position where you can practice '
                                    'identifying and exploiting pins. Look for '
                                    "opportunities to pin your opponent's "
                                    'pieces and paralyze their position.',
                         'fen': 'rnbqkb1r/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w '
                                'KQkq - 0 1'}],
        'order_index': 20},
    {   'slug': 'skewers',
        'title': 'Skewers',
        'description': 'Learn how to use skewers to gain material advantage in '
                       'your chess games.',
        'difficulty': 'Intermediate',
        'xp_reward': 50,
        'steps': [   {   'order_index': 1,
                         'content': '<strong>Skewers</strong> are tactical '
                                    'maneuvers where a valuable piece is '
                                    'attacked, forcing it to move and exposing '
                                    'a less valuable piece behind it. '
                                    '<em>Understanding skewers can turn the '
                                    'tide of a game!</em>',
                         'fen': 'r1bqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w '
                                'KQkq - 0 1'},
                     {   'order_index': 2,
                         'content': '<strong>Reverse Pins</strong> occur when '
                                    'a piece is pinned against a more valuable '
                                    'piece, allowing you to skewer the pinned '
                                    'piece later. <em>Recognize these patterns '
                                    "to exploit your opponent's position!</em>",
                         'fen': 'rnbqkb1r/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR '
                                'w KQkq - 0 1'},
                     {   'order_index': 3,
                         'content': 'In this position, consider how you can '
                                    "use a skewer to attack your opponent's "
                                    'pieces. <strong>Look for opportunities to '
                                    'create threats!</strong>',
                         'fen': 'rnbqkb1r/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR '
                                'w KQkq - 0 1'},
                     {   'order_index': 4,
                         'content': 'Try to visualize how a skewer can be '
                                    'applied in this scenario. '
                                    '<strong>Practice makes perfect!</strong> '
                                    '<em>Identify the key pieces and plan your '
                                    'attack.</em>',
                         'fen': 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR '
                                'w KQkq - 0 1'}],
        'order_index': 21},
    {   'slug': 'discovered-attacks',
        'title': 'Discovered Attacks',
        'description': 'Master the art of unmasking threats with discovered '
                       'attacks to gain a tactical advantage.',
        'difficulty': 'Intermediate',
        'xp_reward': 50,
        'steps': [   {   'order_index': 1,
                         'content': '<strong>Discovered attacks</strong> occur '
                                    'when one piece moves away, revealing an '
                                    'attack from another piece behind it. '
                                    '<em>Understanding this tactic can lead to '
                                    'powerful combinations!</em>',
                         'fen': 'rnbqkb1r/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w '
                                'KQkq - 0 1'},
                     {   'order_index': 2,
                         'content': '<strong>Example Position:</strong> In '
                                    'this position, moving the knight will '
                                    'reveal an attack from the bishop on the '
                                    'enemy queen. <em>Can you find the best '
                                    'move?</em>',
                         'fen': 'rnbqkb1r/pppppppp/8/8/4N3/8/PPPPPPPP/RNBQKB1R '
                                'w KQkq - 0 1'},
                     {   'order_index': 3,
                         'content': '<strong>Practice:</strong> Try to create '
                                    'a discovered attack in this position by '
                                    'moving your pieces strategically. '
                                    '<em>Look for opportunities to reveal '
                                    'threats!</em>',
                         'fen': 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR '
                                'w KQkq - 0 1'},
                     {   'order_index': 4,
                         'content': '<strong>Challenge:</strong> In this final '
                                    'position, can you find a move that not '
                                    'only attacks but also sets up a '
                                    'discovered attack for your next turn? '
                                    '<em>Think ahead!</em>',
                         'fen': 'rnbqkb1r/pppppppp/8/8/4N3/8/PPPPPPPP/RNBQKBNR '
                                'w KQkq - 0 1'}],
        'order_index': 22},
    {   'slug': 'discovered-checks',
        'title': 'Discovered Checks',
        'description': 'Learn how to unleash powerful discovered checks to '
                       'gain a tactical advantage over your opponent.',
        'difficulty': 'Intermediate',
        'xp_reward': 50,
        'steps': [   {   'order_index': 1,
                         'content': '<strong>Discovered Check</strong> occurs '
                                    'when a piece moves away, revealing an '
                                    'attack from another piece on the '
                                    "opponent's king. <em>This tactic can lead "
                                    'to devastating consequences for your '
                                    'opponent!</em>',
                         'fen': 'rnbqkb1r/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w '
                                'KQkq - 0 1'},
                     {   'order_index': 2,
                         'content': 'In this position, move your bishop to '
                                    '<strong>c4</strong>. This will reveal a '
                                    'check from your rook on '
                                    '<strong>e1</strong>. <em>Can you find the '
                                    'best response for Black?</em>',
                         'fen': 'rnbqkb1r/pppppppp/8/8/2B5/8/PPPPPPPP/RNBQKBNR '
                                'w KQkq - 0 1'},
                     {   'order_index': 3,
                         'content': 'After the discovered check, Black must '
                                    'respond. If they block with a piece, '
                                    'consider how you can capitalize on their '
                                    'weakened position. <em>What move will you '
                                    'make next?</em>',
                         'fen': 'rnbqkb1r/pppppppp/8/8/2B5/8/PPPPPPPP/RNBQKBNR '
                                'w KQkq - 0 1'},
                     {   'order_index': 4,
                         'content': "Now, let's practice! Set up a position "
                                    'where you can execute a discovered check. '
                                    '<strong>Think about how to use your '
                                    'pieces effectively!</strong>',
                         'fen': 'rnbqkb1r/pppppppp/8/8/2B5/8/PPPPPPPP/RNBQKBNR '
                                'w KQkq - 0 1'}],
        'order_index': 23},
    {   'slug': 'double-checks',
        'title': 'Double Checks',
        'description': 'Master the art of delivering double checks to maximize '
                       'pressure on your opponent.',
        'difficulty': 'Intermediate',
        'xp_reward': 50,
        'steps': [   {   'order_index': 1,
                         'content': '<strong>Double checks</strong> occur when '
                                    'a player delivers a check to the '
                                    "opponent's king from two pieces "
                                    'simultaneously. This tactic can create '
                                    '<em>maximum danger</em> as it forces the '
                                    'opponent to respond immediately, often '
                                    'leading to devastating consequences.',
                         'fen': 'rnbqkb1r/pppppppp/8/8/4Q3/8/PPPPPPPP/RNB1KBNR '
                                'w KQkq - 0 1'},
                     {   'order_index': 2,
                         'content': 'In this position, notice how the queen on '
                                    'e4 can deliver a double check with the '
                                    'rook on a1. When both pieces check the '
                                    'king, the opponent must move the king, as '
                                    'blocking or capturing one of the checking '
                                    'pieces is not an option.',
                         'fen': 'rnbqkb1r/pppppppp/8/8/4Q3/8/PPPPPPPP/RNB1KBNR '
                                'w KQkq - 0 1'},
                     {   'order_index': 3,
                         'content': 'To practice, try to find a way to create '
                                    'a double check in this position. Consider '
                                    'how you can coordinate your pieces to put '
                                    "the opponent's king in a precarious "
                                    'situation.',
                         'fen': 'rnbqkb1r/pppppppp/8/8/4Q3/8/PPPPPPPP/RNB1KBNR '
                                'w KQkq - 0 1'},
                     {   'order_index': 4,
                         'content': 'Remember, double checks can often lead to '
                                    'forks or other tactical opportunities. '
                                    'Always be on the lookout for ways to '
                                    'combine your pieces for maximum effect!',
                         'fen': 'rnbqkb1r/pppppppp/8/8/4Q3/8/PPPPPPPP/RNB1KBNR '
                                'w KQkq - 0 1'}],
        'order_index': 24},
    {   'slug': 'removing-the-defender',
        'title': 'Removing the Defender',
        'description': 'Learn how to exploit overloaded pieces to gain a '
                       'tactical advantage in your games.',
        'difficulty': 'Intermediate',
        'xp_reward': 50,
        'steps': [   {   'order_index': 1,
                         'content': '<strong>Overloading</strong> is a '
                                    'tactical theme where a piece is tasked '
                                    'with defending multiple pieces or '
                                    'squares, making it vulnerable to attack. '
                                    'In this lesson, we will focus on how to '
                                    '<em>remove the defender</em> to gain '
                                    'material or a better position.',
                         'fen': 'rnbqkb1r/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w '
                                'KQkq - 0 1'},
                     {   'order_index': 2,
                         'content': 'Consider the position where a knight is '
                                    'defending a pawn and also controlling a '
                                    'key square. By attacking the knight with '
                                    'a pawn, you can force it to move, thereby '
                                    '<strong>removing its defense</strong> of '
                                    'the pawn. This is a practical example of '
                                    '<em>overloading</em>.',
                         'fen': 'rnbqkb1r/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w '
                                'KQkq - 0 1'},
                     {   'order_index': 3,
                         'content': "Now, let's practice! In the following "
                                    'position, identify the overloaded piece '
                                    'and suggest a move that would '
                                    '<strong>remove its defense</strong>. '
                                    'Remember, the goal is to create a '
                                    'situation where the opponent must choose '
                                    'which piece to save.',
                         'fen': 'rnbqkb1r/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR '
                                'w KQkq - 0 1'},
                     {   'order_index': 4,
                         'content': 'After making your move, analyze the '
                                    'consequences. Did you successfully '
                                    '<em>remove the defender</em>? If so, how '
                                    'did it change the dynamics of the '
                                    'position? Reflect on the importance of '
                                    'recognizing overloaded pieces in your '
                                    'games.',
                         'fen': 'rnbqkb1r/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR '
                                'w KQkq - 0 1'}],
        'order_index': 25},
    {   'slug': 'deflection',
        'title': 'Deflection',
        'description': "Learn how to lure your opponent's pieces away from key "
                       'squares to gain a tactical advantage.',
        'difficulty': 'Intermediate',
        'xp_reward': 50,
        'steps': [   {   'order_index': 1,
                         'content': '<strong>Deflection</strong> is a tactical '
                                    "motif where you <em>lure an opponent's "
                                    'piece away</em> from its defensive '
                                    'duties. This can create opportunities to '
                                    'attack other pieces or exploit weaknesses '
                                    'in their position.',
                         'fen': 'rnbqkb1r/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w '
                                'KQkq - 0 1'},
                     {   'order_index': 2,
                         'content': 'Consider this position: If you can lure '
                                    'the knight on f6 away from defending the '
                                    'e4 pawn, you can attack it with your '
                                    'queen. Look for ways to create threats '
                                    'that force the knight to move.',
                         'fen': 'rnbqkb1r/pppppppp/5n2/8/4P3/8/PPPP1PPP/RNBQKBNR '
                                'w KQkq - 0 1'},
                     {   'order_index': 3,
                         'content': 'In this scenario, if you play '
                                    '<strong>Qh5</strong>, you threaten the '
                                    'knight and also create a double attack on '
                                    'the e4 pawn. This is a classic example of '
                                    '<em>deflection</em> in action.',
                         'fen': 'rnbqkb1r/pppppppp/5n2/8/4P3/8/PPPP1PPP/RNBQKBNR '
                                'w KQkq - 0 1'},
                     {   'order_index': 4,
                         'content': 'Now, try to find a position where you can '
                                    'use deflection to your advantage. Look '
                                    'for pieces that are defending key squares '
                                    'and think about how you can lure them '
                                    'away.',
                         'fen': 'rnbqkb1r/pppppppp/5n2/8/4P3/8/PPPP1PPP/RNBQKBNR '
                                'w KQkq - 0 1'}],
        'order_index': 26},
    {   'slug': 'decoy-sacrifices',
        'title': 'Decoy Sacrifices',
        'description': 'Learn how to use decoy sacrifices to force your '
                       "opponent's king into a vulnerable position.",
        'difficulty': 'Intermediate',
        'xp_reward': 50,
        'steps': [   {   'order_index': 1,
                         'content': '<strong>Decoy sacrifices</strong> are '
                                    'tactical maneuvers where you sacrifice a '
                                    "piece to lure the opponent's king into a "
                                    'less secure position. This can create '
                                    'opportunities for checkmate or winning '
                                    'material. <em>Understanding this concept '
                                    'is crucial for improving your attacking '
                                    'skills.</em>',
                         'fen': 'rnbqkb1r/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w '
                                'KQkq - 0 1'},
                     {   'order_index': 2,
                         'content': "Consider a position where your opponent's "
                                    'king is well-defended. A <strong>decoy '
                                    'sacrifice</strong> can disrupt this '
                                    'defense. Look for pieces that can be '
                                    'sacrificed to draw the king out into the '
                                    'open.',
                         'fen': 'rnbqkb1r/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR '
                                'w KQkq - 0 1'},
                     {   'order_index': 3,
                         'content': 'In the following position, you can '
                                    'sacrifice your knight to lure the king '
                                    'away from its protective pawns. This will '
                                    'expose it to a potential checkmate. '
                                    '<em>Always calculate the consequences of '
                                    'your sacrifice!</em>',
                         'fen': 'rnbqkb1r/pppppppp/8/8/4P3/5N2/PPPP1PPP/RNBQKB1R '
                                'w KQkq - 0 1'},
                     {   'order_index': 4,
                         'content': 'After executing a decoy sacrifice, assess '
                                    "the new position of the opponent's king. "
                                    'Look for immediate threats or follow-up '
                                    "moves that can capitalize on the king's "
                                    'new location. <strong>Timing is '
                                    'key!</strong>',
                         'fen': 'rnbqkb1r/pppppppp/8/8/4P3/5N2/PPPP1PPP/RNBQKB1R '
                                'w KQkq - 0 1'}],
        'order_index': 27},
    {   'slug': 'clearance-sacrifices',
        'title': 'Clearance Sacrifices',
        'description': 'Learn how to create powerful attacking chances by '
                       'sacrificing material for strategic gains.',
        'difficulty': 'Intermediate',
        'xp_reward': 50,
        'steps': [   {   'order_index': 1,
                         'content': '<strong>Clearance sacrifices</strong> '
                                    'involve giving up material to clear a '
                                    'path for your pieces, often leading to '
                                    'devastating attacks. <em>Understanding '
                                    'when and how to execute these sacrifices '
                                    'is crucial for intermediate players.</em>',
                         'fen': 'rnbqkb1r/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w '
                                'KQkq - 0 1'},
                     {   'order_index': 2,
                         'content': 'Consider the position where a pawn '
                                    'sacrifice can open lines for your rooks. '
                                    '<strong>Identify the key squares</strong> '
                                    'that will become accessible after the '
                                    'sacrifice.',
                         'fen': 'rnbqkb1r/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w '
                                'KQkq - 0 1'},
                     {   'order_index': 3,
                         'content': 'Practice executing a clearance sacrifice '
                                    'in this position. <em>Think about how '
                                    'your pieces will coordinate after the '
                                    'sacrifice.</em>',
                         'fen': 'rnbqkb1r/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w '
                                'KQkq - 0 1'},
                     {   'order_index': 4,
                         'content': 'After the sacrifice, analyze the '
                                    'resulting position. <strong>Evaluate the '
                                    'strengths and weaknesses</strong> of both '
                                    'sides and plan your next moves '
                                    'accordingly.',
                         'fen': 'rnbqkb1r/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w '
                                'KQkq - 0 1'}],
        'order_index': 28},
    {   'slug': 'interference',
        'title': 'Interference',
        'description': "Learn how to disrupt your opponent's plans by blocking "
                       'their key pieces.',
        'difficulty': 'Intermediate',
        'xp_reward': 50,
        'steps': [   {   'order_index': 1,
                         'content': '<strong>Interference</strong> is a '
                                    'tactical theme where you <em>block</em> '
                                    "an opponent's piece from defending "
                                    'another piece or square. This can create '
                                    'opportunities for you to gain material or '
                                    'achieve a better position.',
                         'fen': 'rnbqkb1r/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w '
                                'KQkq - 0 1'},
                     {   'order_index': 2,
                         'content': 'In this position, consider how you might '
                                    'use a piece to <strong>interfere</strong> '
                                    "with your opponent's defense. Look for "
                                    'ways to <em>block</em> their key pieces '
                                    'from protecting each other.',
                         'fen': 'rnbqkb1r/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR '
                                'w KQkq - 0 1'},
                     {   'order_index': 3,
                         'content': 'Now, try to identify the best move that '
                                    'creates interference. Can you find a way '
                                    'to <strong>disrupt</strong> your '
                                    "opponent's coordination?",
                         'fen': 'rnbqk2r/pppppppp/5n2/8/4P3/8/PPPP1PPP/RNBQKBNR '
                                'w KQkq - 0 1'},
                     {   'order_index': 4,
                         'content': 'After making your move, analyze how your '
                                    "interference has affected your opponent's "
                                    'position. Did you successfully '
                                    '<em>block</em> their defense?',
                         'fen': 'rnbqk2r/pppppppp/5n2/8/4P3/8/PPPP1PPP/RNBQKBNR '
                                'b KQkq - 0 1'}],
        'order_index': 29},
    {   'slug': 'x-ray-attacks',
        'title': 'X-Ray Attacks',
        'description': 'Learn how to exploit the power of x-ray attacks to '
                       'gain a strategic advantage in your games.',
        'difficulty': 'Intermediate',
        'xp_reward': 50,
        'steps': [   {   'order_index': 1,
                         'content': '<strong>X-ray attacks</strong> occur when '
                                    "a piece attacks an opponent's piece while "
                                    'being protected by another piece. '
                                    '<em>Understanding this concept can help '
                                    'you find tactical opportunities.</em>',
                         'fen': 'rnbqkb1r/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w '
                                'KQkq - 0 1'},
                     {   'order_index': 2,
                         'content': 'In this position, notice how the '
                                    '<strong>rook</strong> on e1 can attack '
                                    'the <strong>queen</strong> on d8 through '
                                    'the <strong>pawn</strong> on d7. <em>Can '
                                    'you find a way to exploit this?</em>',
                         'fen': 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w '
                                'KQkq - 0 1'},
                     {   'order_index': 3,
                         'content': 'When you move your <strong>rook</strong> '
                                    'to e8, it attacks the '
                                    '<strong>king</strong> on e8 and '
                                    'indirectly attacks the '
                                    '<strong>queen</strong> on d8. <em>What '
                                    'will your opponent do next?</em>',
                         'fen': 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w '
                                'KQkq - 0 1'},
                     {   'order_index': 4,
                         'content': 'Remember, x-ray attacks can be powerful. '
                                    '<strong>Always look for opportunities to '
                                    'attack through other pieces!</strong> '
                                    '<em>Practice this tactic in your '
                                    'games.</em>',
                         'fen': 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w '
                                'KQkq - 0 1'}],
        'order_index': 30},
    {   'slug': 'windmills',
        'title': 'Windmills',
        'description': 'Master the art of executing repeated discovered checks '
                       'to gain a decisive advantage in your games.',
        'difficulty': 'Intermediate',
        'xp_reward': 50,
        'steps': [   {   'order_index': 1,
                         'content': '<strong>Welcome to the Windmills '
                                    'lesson!</strong> In this lesson, you will '
                                    'learn how to execute <em>repeated '
                                    'discovered checks</em> to create powerful '
                                    'tactical opportunities. A windmill occurs '
                                    'when a piece moves to give a check while '
                                    'simultaneously attacking another piece, '
                                    'allowing for a sequence of checks and '
                                    'captures.',
                         'fen': 'rnbqkb1r/pppppppp/8/8/4P3/8/PPPPPPPP/RNBQKBNR '
                                'w KQkq - 0 1'},
                     {   'order_index': 2,
                         'content': '<strong>Step 1:</strong> In this '
                                    'position, move your bishop to c4. This '
                                    'move gives a discovered check with your '
                                    'queen on d1. Can you find the best '
                                    'response for your opponent?',
                         'fen': 'rnbqkb1r/pppppppp/8/8/2B1P3/8/PPPPPPPP/RNBQK1NR '
                                'b KQkq - 0 1'},
                     {   'order_index': 3,
                         'content': '<strong>Step 2:</strong> After your '
                                    'opponent moves their king, move your '
                                    'queen to d4. This will give another '
                                    'discovered check with your bishop. What '
                                    'will your opponent do next?',
                         'fen': 'rnbqkb1r/pppppppp/8/8/2B1P3/8/PPPPPPPP/RNBQK1NR '
                                'w KQkq - 0 1'},
                     {   'order_index': 4,
                         'content': '<strong>Step 3:</strong> Finally, after '
                                    "the opponent's response, move your bishop "
                                    'to b2. This will allow you to continue '
                                    'the windmill effect. Can you visualize '
                                    'the sequence of checks and captures that '
                                    'follow?',
                         'fen': 'rnbqkb1r/pppppppp/8/8/2B1P3/8/PPPPPPPP/RNBQK1NR '
                                'b KQkq - 0 1'}],
        'order_index': 31},
    {   'slug': 'trapped-pieces',
        'title': 'Trapped Pieces',
        'description': "Learn how to restrict your opponent's mobility and "
                       'trap their pieces effectively.',
        'difficulty': 'Intermediate',
        'xp_reward': 50,
        'steps': [   {   'order_index': 1,
                         'content': '<strong>Understanding Mobility:</strong> '
                                    'In chess, controlling the mobility of '
                                    "your opponent's pieces is crucial. "
                                    '<em>Trapping</em> a piece means limiting '
                                    'its movement options, making it '
                                    'vulnerable.',
                         'fen': 'rnbqkb1r/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w '
                                'KQkq - 0 1'},
                     {   'order_index': 2,
                         'content': '<strong>Example Scenario:</strong> '
                                    'Consider a knight on the edge of the '
                                    'board. <em>How can you restrict its '
                                    'movement?</em> Look for pawns and pieces '
                                    'that can block its escape routes.',
                         'fen': 'rnbqkb1r/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w '
                                'KQkq - 0 1'},
                     {   'order_index': 3,
                         'content': '<strong>Practice Exercise:</strong> Set '
                                    'up a position where a piece is trapped. '
                                    '<em>Can you find a way to restrict its '
                                    'mobility further?</em> Analyze the board '
                                    'and make your move.',
                         'fen': 'rnbqkb1r/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w '
                                'KQkq - 0 1'},
                     {   'order_index': 4,
                         'content': '<strong>Review:</strong> After trapping a '
                                    'piece, consider how you can capitalize on '
                                    'this advantage. <em>What is your next '
                                    'move?</em> Always think ahead!',
                         'fen': 'rnbqkb1r/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w '
                                'KQkq - 0 1'}],
        'order_index': 32},
    {   'slug': 'zwischenzug',
        'title': 'Zwischenzug (In-between Move)',
        'description': "Master the art of disrupting your opponent's flow with "
                       'tactical in-between moves.',
        'difficulty': 'Intermediate',
        'xp_reward': 50,
        'steps': [   {   'order_index': 1,
                         'content': '<strong>What is a Zwischenzug?</strong> A '
                                    '<em>Zwischenzug</em>, or in-between move, '
                                    'is a tactical maneuver where you make a '
                                    'surprising move before responding to your '
                                    "opponent's threat, often leading to a "
                                    'more favorable position.',
                         'fen': 'rnbqkb1r/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w '
                                'KQkq - 0 1'},
                     {   'order_index': 2,
                         'content': '<strong>Example of a '
                                    'Zwischenzug:</strong> In the following '
                                    'position, instead of immediately '
                                    'capturing the knight, you can play '
                                    '<em>Qe2</em> to create a double threat, '
                                    'forcing your opponent to respond '
                                    'differently.',
                         'fen': 'rnbqkb1r/pppppppp/5n2/8/4Q3/8/PPPPPPPP/RNB1KBNR '
                                'w KQkq - 0 1'},
                     {   'order_index': 3,
                         'content': '<strong>Why use a Zwischenzug?</strong> '
                                    'Utilizing a <em>Zwischenzug</em> can '
                                    "disrupt your opponent's plans and create "
                                    'tactical opportunities that may not be '
                                    'immediately apparent.',
                         'fen': None},
                     {   'order_index': 4,
                         'content': '<strong>Practice:</strong> In this '
                                    'position, find the best '
                                    '<em>Zwischenzug</em> move for White to '
                                    'gain the upper hand.',
                         'fen': 'rnbqkb1r/pppppppp/5n2/8/4Q3/8/PPPPPPPP/RNB1KBNR '
                                'w KQkq - 0 1'}],
        'order_index': 33},
    {   'slug': 'back-rank-mates',
        'title': 'Back Rank Mates',
        'description': 'Learn how to exploit weak ranks to deliver checkmate '
                       'with your rooks and queen.',
        'difficulty': 'Intermediate',
        'xp_reward': 50,
        'steps': [   {   'order_index': 1,
                         'content': '<strong>Back rank mates</strong> occur '
                                    'when a king is trapped on the back rank '
                                    'and cannot escape due to its own pieces. '
                                    '<em>Understanding this concept is crucial '
                                    "for exploiting your opponent's "
                                    'weaknesses.</em>',
                         'fen': '8/5k2/8/8/8/8/5R2/6K1 w - - 0 1'},
                     {   'order_index': 2,
                         'content': "<strong>In this position</strong>, it's "
                                    "White's turn to move. <em>Look for ways "
                                    'to deliver checkmate on the back '
                                    'rank.</em>',
                         'fen': '8/5k2/8/8/8/5R2/6K1 w - - 0 1'},
                     {   'order_index': 3,
                         'content': '<strong>Once you identify the back rank '
                                    'weakness</strong>, you can use your rook '
                                    'to deliver checkmate. <em>Practice '
                                    'recognizing these patterns in your '
                                    'games!</em>',
                         'fen': '8/5k2/8/8/8/5R2/6K1 w - - 0 1'}],
        'order_index': 34},
    {   'slug': 'smothered-mates',
        'title': 'Smothered Mates',
        'description': 'Discover the art of delivering checkmate with a knight '
                       'in a confined space.',
        'difficulty': 'Intermediate',
        'xp_reward': 50,
        'steps': [   {   'order_index': 1,
                         'content': '<strong>Smothered Mate</strong> occurs '
                                    'when a king is surrounded by its own '
                                    'pieces and is checkmated by a knight. '
                                    '<em>Understanding this tactic can turn '
                                    'the tide of a game!</em>',
                         'fen': '8/5k2/5p2/8/8/8/8/7N w - - 0 1'},
                     {   'order_index': 2,
                         'content': '<strong>In this position, notice how the '
                                    'black king is trapped.</strong> <em>To '
                                    'achieve a smothered mate, consider how '
                                    'you can use your knight effectively.</em>',
                         'fen': '8/5k2/5p2/8/8/8/8/7N w - - 0 1'},
                     {   'order_index': 3,
                         'content': '<strong>Try moving your knight to create '
                                    'a checkmate.</strong> <em>Think about the '
                                    'squares the knight controls and the '
                                    'escape routes for the black king.</em>',
                         'fen': '8/5k2/5p2/8/8/8/8/7N w - - 0 1'},
                     {   'order_index': 4,
                         'content': '<strong>Congratulations!</strong> <em>You '
                                    'have successfully executed a smothered '
                                    'mate. Practice this tactic in different '
                                    'positions to master it!</em>',
                         'fen': '8/5k2/5p2/8/8/8/8/7N w - - 0 1'}],
        'order_index': 35},
    {   'slug': 'anastasias-mate',
        'title': "Anastasia's Mate",
        'description': 'Learn the powerful mating pattern involving a rook and '
                       'a knight that can catch your opponent off guard.',
        'difficulty': 'Intermediate',
        'xp_reward': 50,
        'steps': [   {   'order_index': 1,
                         'content': '<strong>Step 1:</strong> In this '
                                    'position, we will explore how to use the '
                                    'rook and knight to deliver checkmate. '
                                    '<em>Pay attention to the coordination '
                                    'between your pieces.</em>',
                         'fen': '8/8/8/8/8/5K2/5N2/7R w - - 0 1'},
                     {   'order_index': 2,
                         'content': '<strong>Step 2:</strong> Move your knight '
                                    'to control key squares and restrict the '
                                    "opponent's king movement. <em>Think about "
                                    'how the rook can assist in cutting off '
                                    'escape routes.</em>',
                         'fen': '8/8/8/8/8/5K2/5N2/7R b - - 0 1'},
                     {   'order_index': 3,
                         'content': '<strong>Step 3:</strong> Now, position '
                                    'your rook to deliver check while your '
                                    'knight protects it. <em>This is the '
                                    "essence of Anastasia's Mate!</em>",
                         'fen': '8/8/8/8/8/5K2/5N2/7R w - - 0 1'},
                     {   'order_index': 4,
                         'content': '<strong>Step 4:</strong> Finally, execute '
                                    'the checkmate. <em>Notice how the knight '
                                    'and rook work together to trap the '
                                    'king.</em>',
                         'fen': '8/8/8/8/8/5K2/5N2/7R b - - 0 1'}],
        'order_index': 36},
    {   'slug': 'arabian-mate',
        'title': 'Arabian Mate',
        'description': 'Learn how to deliver checkmate using the powerful '
                       'combination of a rook and knight.',
        'difficulty': 'Intermediate',
        'xp_reward': 50,
        'steps': [   {   'order_index': 1,
                         'content': '<strong>Welcome to the Arabian Mate '
                                    'lesson!</strong> In this lesson, we will '
                                    'explore how to use a <em>rook</em> and a '
                                    '<em>knight</em> to deliver checkmate to '
                                    "your opponent's king.",
                         'fen': None},
                     {   'order_index': 2,
                         'content': '<strong>Step 1:</strong> Position your '
                                    'rook to cut off the escape routes of the '
                                    'enemy king. This is crucial for setting '
                                    'up the checkmate. <em>Remember</em> to '
                                    'keep your knight close to support the '
                                    'rook.',
                         'fen': '8/5k2/8/8/8/8/5R2/5N2 w - - 0 1'},
                     {   'order_index': 3,
                         'content': '<strong>Step 2:</strong> Move your knight '
                                    'to a square that restricts the movement '
                                    'of the enemy king further. '
                                    '<em>Coordination</em> between your rook '
                                    'and knight is key to achieving the mate.',
                         'fen': '8/5k2/8/8/8/8/5R2/5N2 w - - 0 1'},
                     {   'order_index': 4,
                         'content': '<strong>Final Step:</strong> Deliver the '
                                    'checkmate by positioning your rook and '
                                    'knight correctly. The enemy king will '
                                    'have no legal moves left! <em>Practice '
                                    'this setup</em> to master the Arabian '
                                    'Mate.',
                         'fen': '8/5k2/8/8/8/5R2/5N2 w - - 0 1'}],
        'order_index': 37},
    {   'slug': 'fools-mate-quick-traps',
        'title': "Fool's Mate & Quick Traps",
        'description': 'Discover the quickest ways to lose a game and learn '
                       'how to avoid them.',
        'difficulty': 'Intermediate',
        'xp_reward': 50,
        'steps': [   {   'order_index': 1,
                         'content': "<strong>Fool's Mate</strong> is the "
                                    'fastest checkmate possible in chess, '
                                    'occurring in just two moves. It typically '
                                    'involves a series of poor opening moves '
                                    'by White, allowing Black to deliver '
                                    'checkmate with their queen. '
                                    '<em>Understanding this can help you avoid '
                                    'similar mistakes!</em>',
                         'fen': None},
                     {   'order_index': 2,
                         'content': "To achieve <strong>Fool's Mate</strong>, "
                                    'White must play <em>f3</em> and '
                                    '<em>g4</em>. Black can then play '
                                    '<em>Qh4#</em> to deliver checkmate. '
                                    '<strong>Always be cautious of exposing '
                                    'your king!</strong>',
                         'fen': 'rnbqkb1r/pppppppp/8/8/5P2/5P2/PPPPPPPP/RNBQKBNR '
                                'w KQkq - 0 1'},
                     {   'order_index': 3,
                         'content': '<strong>Quick Traps</strong> can also '
                                    'occur in other openings. For example, '
                                    'after 1.e4 e5 2.Nf3 Nc6 3.Bc4, if Black '
                                    'plays <em>f5</em>, they fall into the '
                                    '<strong>Fried Liver Attack</strong>. '
                                    'White can respond with <em>exf5</em> and '
                                    'create threats against the f7 pawn.',
                         'fen': 'rnbqkb1r/pppppppp/5n2/8/2B5/5N2/PPPPPPPP/RNBQKBNR '
                                'w KQkq - 0 1'},
                     {   'order_index': 4,
                         'content': 'Recognizing these traps is crucial. '
                                    "Always be aware of your opponent's "
                                    'threats and avoid making moves that '
                                    'expose your king or critical squares. '
                                    '<strong>Practice these scenarios to '
                                    'improve your opening play!</strong>',
                         'fen': None}],
        'order_index': 38},
    {   'slug': 'good-vs-bad-bishops',
        'title': 'Good vs. Bad Bishops',
        'description': 'Explore the strategic differences between good and bad '
                       'bishops to enhance your minor piece value '
                       'understanding.',
        'difficulty': 'Intermediate',
        'xp_reward': 50,
        'steps': [   {   'order_index': 1,
                         'content': '<strong>Understanding Good '
                                    'Bishops:</strong> A good bishop controls '
                                    'many squares and works well with pawns. '
                                    '<em>Identify positions where your bishop '
                                    'can influence the center of the '
                                    'board.</em>',
                         'fen': 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w '
                                'KQkq - 0 1'},
                     {   'order_index': 2,
                         'content': '<strong>Identifying Bad Bishops:</strong> '
                                    'A bad bishop is often blocked by its own '
                                    'pawns and has limited mobility. <em>Look '
                                    'for scenarios where your bishop is '
                                    'trapped behind pawns of the same '
                                    'color.</em>',
                         'fen': 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w '
                                'KQkq - 0 1'},
                     {   'order_index': 3,
                         'content': '<strong>Practical Exercise:</strong> Move '
                                    'your pieces to create a position with a '
                                    'good bishop and a bad bishop. <em>Analyze '
                                    'how each bishop can influence the game '
                                    'differently.</em>',
                         'fen': 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w '
                                'KQkq - 0 1'},
                     {   'order_index': 4,
                         'content': '<strong>Conclusion:</strong> Recognizing '
                                    'the value of good and bad bishops can '
                                    'significantly impact your strategy. '
                                    '<em>Practice identifying these bishops in '
                                    'your games!</em>',
                         'fen': 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w '
                                'KQkq - 0 1'}],
        'order_index': 39},
    {   'slug': 'outposts',
        'title': 'Outposts',
        'description': 'Master the art of knight positioning by learning how '
                       'to create and utilize outposts effectively.',
        'difficulty': 'Intermediate',
        'xp_reward': 50,
        'steps': [   {   'order_index': 1,
                         'content': '<strong>Outposts</strong> are squares '
                                    'that are protected by your pawns and '
                                    'cannot be attacked by enemy pawns. '
                                    '<em>Knights</em> placed on these squares '
                                    'can be very powerful, controlling key '
                                    'areas of the board.',
                         'fen': None},
                     {   'order_index': 2,
                         'content': 'Consider the square <strong>c5</strong> '
                                    'in this position. If you can place your '
                                    'knight on <em>c5</em>, it will be an '
                                    'excellent outpost, controlling important '
                                    'squares and putting pressure on your '
                                    "opponent's position.",
                         'fen': 'rnbqkb1r/pppppppp/8/8/4P3/8/PPPPPPPP/RNBQKBNR '
                                'w KQkq - 0 1'},
                     {   'order_index': 3,
                         'content': 'In this position, notice how the knight '
                                    'on <strong>e5</strong> is supported by '
                                    'the pawn on <em>f4</em>. This creates a '
                                    'strong outpost that can be difficult for '
                                    'your opponent to challenge.',
                         'fen': 'rnbqkb1r/pppppppp/8/8/4P3/5N2/PPPPPPPP/RNBQKBNR '
                                'w KQkq - 0 1'},
                     {   'order_index': 4,
                         'content': 'To maximize the effectiveness of your '
                                    'knights, look for squares like '
                                    '<strong>d6</strong> or <em>f6</em> that '
                                    'can serve as outposts in the endgame, '
                                    'where they can dominate the board.',
                         'fen': 'rnbqkb1r/pppppppp/8/8/4P3/5N2/PPPPPPPP/RNBQKBNR '
                                'w KQkq - 0 1'}],
        'order_index': 40},
    {   'slug': 'the-bishop-pair',
        'title': 'The Bishop Pair',
        'description': 'Learn how to leverage the power of two bishops to '
                       'dominate the board.',
        'difficulty': 'Intermediate',
        'xp_reward': 50,
        'steps': [   {   'order_index': 1,
                         'content': '<strong>The Bishop Pair</strong> is a '
                                    'powerful advantage in chess, especially '
                                    'in open positions. <em>Two bishops can '
                                    'control long diagonals and work together '
                                    'to create threats.</em>',
                         'fen': 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR'},
                     {   'order_index': 2,
                         'content': '<strong>Positioning</strong> your bishops '
                                    'on complementary colors allows them to '
                                    'cover more squares and support each '
                                    'other. <em>Try to keep them active and '
                                    'coordinated.</em>',
                         'fen': 'rnbqkbnr/pppppppp/8/8/4B3/8/PPPPPPPP/RNBQK1NR'},
                     {   'order_index': 3,
                         'content': '<strong>Creating Weaknesses</strong> in '
                                    "your opponent's pawn structure can help "
                                    'you utilize your bishops effectively. '
                                    '<em>Look for opportunities to attack '
                                    'isolated pawns or weak squares.</em>',
                         'fen': 'rnbqkbnr/pppppppp/8/8/4B3/8/PPPPPPPP/RNBQK1NR'},
                     {   'order_index': 4,
                         'content': '<strong>Endgame Strategy</strong>: In the '
                                    'endgame, two bishops can dominate against '
                                    'a knight or pawn structure. <em>Use them '
                                    'to control key squares and restrict the '
                                    "opponent's pieces.</em>",
                         'fen': '8/8/8/8/4B3/8/8/4K3'}],
        'order_index': 41},
    {   'slug': 'open-files-and-rooks',
        'title': 'Open Files & Rooks',
        'description': 'Master the art of controlling open files with your '
                       'rooks to dominate the chessboard.',
        'difficulty': 'Intermediate',
        'xp_reward': 50,
        'steps': [   {   'order_index': 1,
                         'content': '<strong>Open files</strong> are columns '
                                    'on the chessboard that have no pawns from '
                                    'either side. <em>Rooks</em> are most '
                                    'powerful when placed on these open files, '
                                    'allowing them to control multiple squares '
                                    "and exert pressure on the opponent's "
                                    'position.',
                         'fen': 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR'},
                     {   'order_index': 2,
                         'content': 'To <strong>control an open file</strong>, '
                                    'you should aim to place your rooks on it '
                                    'while preventing your opponent from doing '
                                    'the same. <em>Double rooks</em> on an '
                                    'open file can create significant threats '
                                    'and pressure.',
                         'fen': 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR'},
                     {   'order_index': 3,
                         'content': 'When your opponent has a rook on an open '
                                    'file, consider '
                                    '<strong>challenging</strong> it with your '
                                    'own rook or <em>placing a pawn</em> in '
                                    'front of it to limit its mobility and '
                                    'control.',
                         'fen': 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR'},
                     {   'order_index': 4,
                         'content': 'Practice identifying open files in your '
                                    'games and <strong>develop a '
                                    'strategy</strong> to utilize your rooks '
                                    'effectively. Remember, <em>control of the '
                                    'open file</em> can often lead to tactical '
                                    'advantages and winning positions.',
                         'fen': 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR'}],
        'order_index': 42},
    {   'slug': 'the-7th-rank',
        'title': 'The 7th Rank',
        'description': 'Master the art of utilizing your rooks and pawns on '
                       'the 7th rank to dominate your opponent.',
        'difficulty': 'Intermediate',
        'xp_reward': 50,
        'steps': [   {   'order_index': 1,
                         'content': '<strong>Understanding the 7th '
                                    'Rank:</strong> The 7th rank is a powerful '
                                    'position for your pieces, especially '
                                    'rooks and pawns. <em>Controlling this '
                                    'rank can lead to significant '
                                    'advantages.</em>',
                         'fen': '8/8/8/8/8/8/7P/7R w - - 0 1'},
                     {   'order_index': 2,
                         'content': '<strong>Rook on the 7th:</strong> When '
                                    'your rook reaches the 7th rank, it can '
                                    'attack multiple targets and restrict your '
                                    "opponent's pieces. <em>Try to place your "
                                    'rook on the 7th rank whenever '
                                    'possible.</em>',
                         'fen': '8/8/8/8/8/8/7P/7R w - - 0 1'},
                     {   'order_index': 3,
                         'content': '<strong>Pawn Promotion:</strong> A pawn '
                                    'on the 7th rank is one step away from '
                                    'promotion. <em>Use this to create threats '
                                    'and force your opponent to react.</em>',
                         'fen': '8/8/8/8/8/8/7P/7R w - - 0 1'},
                     {   'order_index': 4,
                         'content': '<strong>Combining Forces:</strong> '
                                    'Coordinate your rook and pawn on the 7th '
                                    'rank to create a powerful offensive. '
                                    '<em>This synergy can overwhelm your '
                                    "opponent's defenses.</em>",
                         'fen': '8/8/8/8/8/8/7P/7R w - - 0 1'}],
        'order_index': 43},
    {   'slug': 'doubled-pawns',
        'title': 'Doubled Pawns',
        'description': 'Explore the impact of doubled pawns on pawn structure '
                       'and overall game strategy.',
        'difficulty': 'Intermediate',
        'xp_reward': 50,
        'steps': [   {   'order_index': 1,
                         'content': '<strong>Doubled pawns</strong> occur when '
                                    'two pawns of the same color are stacked '
                                    'on the same file, creating a '
                                    '<em>structural weakness</em> that can be '
                                    'exploited by the opponent. Understanding '
                                    'this concept is crucial for improving '
                                    'your endgame strategy.',
                         'fen': None},
                     {   'order_index': 2,
                         'content': 'Consider the position where White has '
                                    'doubled pawns on the c-file. Analyze how '
                                    "these pawns can hinder White's mobility "
                                    'and create weaknesses in their position.',
                         'fen': 'rnbqkb1r/pppppppp/8/8/2P5/8/PPPPPPPP/RNBQKBNR '
                                'w KQkq - 0 1'},
                     {   'order_index': 3,
                         'content': '<strong>Identify</strong> the weaknesses '
                                    'created by doubled pawns in this '
                                    'position. Discuss potential strategies '
                                    'for Black to exploit these weaknesses, '
                                    'such as targeting the pawns with pieces.',
                         'fen': 'rnbqkb1r/pppppppp/8/8/2P5/8/PPPPPPPP/RNBQKBNR '
                                'b KQkq - 0 1'},
                     {   'order_index': 4,
                         'content': 'In this final position, practice finding '
                                    'the best moves for both sides. How can '
                                    'White defend the doubled pawns, and how '
                                    'can Black capitalize on them?',
                         'fen': 'rnbqkb1r/pppppppp/8/8/2P5/8/PPPPPPPP/RNBQKBNR '
                                'w KQkq - 0 1'}],
        'order_index': 44},
    {   'slug': 'isolated-pawns-iqp',
        'title': 'Isolated Pawns (IQP)',
        'description': 'Explore the strategic implications of isolated pawns '
                       'and learn how to leverage their strengths and '
                       'weaknesses.',
        'difficulty': 'Intermediate',
        'xp_reward': 50,
        'steps': [   {   'order_index': 1,
                         'content': '<strong>Isolated Pawns</strong> are pawns '
                                    'that have no friendly pawns on adjacent '
                                    'files. They can be both a strength and a '
                                    'weakness in your position. '
                                    '<em>Understanding how to play with and '
                                    'against them is crucial for intermediate '
                                    'players.</em>',
                         'fen': 'rnbqkb1r/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w '
                                'KQkq - 0 1'},
                     {   'order_index': 2,
                         'content': '<strong>Dynamic Play:</strong> When you '
                                    'have an isolated pawn, you often gain '
                                    '<em>activity</em> for your pieces. Focus '
                                    'on creating threats and controlling open '
                                    'files to maximize your advantage.',
                         'fen': 'rnbqkb1r/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w '
                                'KQkq - 0 1'},
                     {   'order_index': 3,
                         'content': '<strong>Static Play:</strong> When facing '
                                    'an isolated pawn, aim to '
                                    '<em>blockade</em> it with your pieces. '
                                    'This can limit its potential and give you '
                                    'a long-term advantage in the endgame.',
                         'fen': 'rnbqkb1r/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w '
                                'KQkq - 0 1'},
                     {   'order_index': 4,
                         'content': '<strong>Practice Position:</strong> Set '
                                    'up a position with an isolated pawn and '
                                    'analyze the strengths and weaknesses for '
                                    'both sides. <em>How can you exploit the '
                                    'isolated pawn?</em>',
                         'fen': 'rnbqkb1r/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w '
                                'KQkq - 0 1'}],
        'order_index': 45},
    {   'slug': 'backward-pawns',
        'title': 'Backward Pawns',
        'description': 'Learn how to identify and exploit backward pawns to '
                       'gain a strategic advantage in your games.',
        'difficulty': 'Intermediate',
        'xp_reward': 50,
        'steps': [   {   'order_index': 1,
                         'content': '<strong>Backward pawns</strong> are pawns '
                                    'that are behind their neighboring pawns '
                                    'and cannot advance without being '
                                    'captured. <em>Understanding how to '
                                    'exploit these weaknesses is crucial for '
                                    'improving your positional play.</em>',
                         'fen': None},
                     {   'order_index': 2,
                         'content': 'In this position, identify the backward '
                                    'pawn on <strong>c6</strong> and discuss '
                                    'how it can be targeted by your pieces. '
                                    '<em>Control of the square in front of the '
                                    'backward pawn is essential.</em>',
                         'fen': 'r1bqkbnr/ppp2ppp/2n5/3p4/2P5/2N5/PPP2PPP/R1BQK2R '
                                'w KQkq - 0 1'},
                     {   'order_index': 3,
                         'content': 'Consider the strategic implications of '
                                    'the backward pawn. <strong>How can you '
                                    'use your rooks and knights to apply '
                                    'pressure on the backward pawn?</strong> '
                                    '<em>Look for ways to double your rooks on '
                                    'the file of the backward pawn.</em>',
                         'fen': 'r1bqkbnr/ppp2ppp/2n5/3p4/2P5/2N5/PPP2PPP/R1BQK2R '
                                'w KQkq - 0 1'},
                     {   'order_index': 4,
                         'content': 'Finally, practice converting your '
                                    'advantage. <strong>What tactics can you '
                                    'employ to capture the backward '
                                    'pawn?</strong> <em>Think about using '
                                    'forks, pins, and discovered attacks.</em>',
                         'fen': 'r1bqkbnr/ppp2ppp/2n5/3p4/2P5/2N5/PPP2PPP/R1BQK2R '
                                'w KQkq - 0 1'}],
        'order_index': 46},
    {   'slug': 'passed-pawns',
        'title': 'Passed Pawns',
        'description': 'Master the art of utilizing passed pawns to secure '
                       'victory in the endgame.',
        'difficulty': 'Intermediate',
        'xp_reward': 50,
        'steps': [   {   'order_index': 1,
                         'content': '<strong>What is a Passed Pawn?</strong> '
                                    '<em>A passed pawn is one that has no '
                                    'opposing pawns blocking its path to '
                                    'promotion.</em> Understanding the power '
                                    'of passed pawns is crucial in endgames.',
                         'fen': None},
                     {   'order_index': 2,
                         'content': '<strong>Creating a Passed Pawn:</strong> '
                                    '<em>To create a passed pawn, you must '
                                    'advance your pawns while eliminating your '
                                    "opponent's pawns in the same file or "
                                    'adjacent files.</em> Look for '
                                    'opportunities to exchange pawns '
                                    'favorably.',
                         'fen': '8/8/8/8/4P3/8/8/7K w - - 0 1'},
                     {   'order_index': 3,
                         'content': '<strong>Supporting Your Passed '
                                    'Pawn:</strong> <em>Once you have a passed '
                                    'pawn, support it with your king or other '
                                    'pieces to ensure it can advance '
                                    'safely.</em> Coordination is key in '
                                    'promoting your pawn.',
                         'fen': '8/8/8/8/4P3/7K/8/8 w - - 0 1'},
                     {   'order_index': 4,
                         'content': '<strong>Opposing Passed Pawns:</strong> '
                                    "<em>When facing an opponent's passed "
                                    'pawn, try to block it with your pieces '
                                    'and create counterplay elsewhere on the '
                                    'board.</em> Always be aware of the '
                                    'potential threats.',
                         'fen': '8/8/8/8/4P3/7K/8/8 b - - 0 1'}],
        'order_index': 47},
    {   'slug': 'pawn-chains',
        'title': 'Pawn Chains',
        'description': 'Learn how to effectively utilize pawn chains to '
                       'control the board and support your pieces.',
        'difficulty': 'Intermediate',
        'xp_reward': 50,
        'steps': [   {   'order_index': 1,
                         'content': '<strong>Pawn chains</strong> are a '
                                    'formation of pawns that support each '
                                    'other, creating a strong defensive '
                                    'structure. The <em>base</em> of the pawn '
                                    'chain is the pawn that is furthest back, '
                                    'while the <em>head</em> is the pawn that '
                                    'is furthest forward.',
                         'fen': 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR'},
                     {   'order_index': 2,
                         'content': 'In this position, notice how the pawns on '
                                    '<strong>d4</strong> and '
                                    '<strong>e5</strong> form a chain. The '
                                    'pawn on <strong>d4</strong> is the base, '
                                    'while <strong>e5</strong> is the head. '
                                    'This structure can control key squares '
                                    'and support your pieces effectively.',
                         'fen': 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR'},
                     {   'order_index': 3,
                         'content': 'To strengthen your pawn chains, try to '
                                    'avoid moving the base pawn unless '
                                    'necessary. This will keep your structure '
                                    'intact and maintain control over the '
                                    'center of the board.',
                         'fen': 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR'},
                     {   'order_index': 4,
                         'content': 'Analyze this position and identify the '
                                    'base and head of the pawn chain. Consider '
                                    'how you can use this structure to launch '
                                    'an attack or defend against your '
                                    "opponent's threats.",
                         'fen': 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR'}],
        'order_index': 48},
    {   'slug': 'space-advantage',
        'title': 'Space Advantage',
        'description': 'Learn how to control the board and limit your '
                       "opponent's options to gain a strategic edge.",
        'difficulty': 'Intermediate',
        'xp_reward': 50,
        'steps': [   {   'order_index': 1,
                         'content': '<strong>Space advantage</strong> refers '
                                    'to controlling more squares than your '
                                    'opponent, allowing you to <em>maneuver '
                                    'your pieces freely</em> while restricting '
                                    'their movement. In this lesson, we will '
                                    'explore how to effectively squeeze your '
                                    'opponent by gaining space.',
                         'fen': 'rnbqkb1r/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w '
                                'KQkq - 0 1'},
                     {   'order_index': 2,
                         'content': 'In the following position, notice how '
                                    'White can expand on the kingside. '
                                    '<strong>Focus on developing your '
                                    'pieces</strong> to control the center and '
                                    'prepare for an attack. <em>Identify '
                                    'squares that your opponent cannot easily '
                                    'contest.</em>',
                         'fen': 'rnbqkb1r/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR '
                                'w KQkq - 0 1'},
                     {   'order_index': 3,
                         'content': 'As you continue to develop, <strong>look '
                                    'for opportunities to push your '
                                    'pawns</strong> and gain more space. This '
                                    "will <em>limit your opponent's piece "
                                    'activity</em> and create weaknesses in '
                                    'their position.',
                         'fen': 'rnbqkb1r/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR '
                                'w KQkq - 0 1'},
                     {   'order_index': 4,
                         'content': 'Finally, <strong>maintain your space '
                                    'advantage</strong> by coordinating your '
                                    'pieces effectively. <em>Use your rooks '
                                    'and queen to control open files</em> and '
                                    'keep your opponent cramped.',
                         'fen': 'rnbqkb1r/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR '
                                'w KQkq - 0 1'}],
        'order_index': 49},
    {   'slug': 'prophylaxis',
        'title': 'Prophylaxis',
        'description': "Learn how to anticipate and prevent your opponent's "
                       'threats to gain a strategic advantage.',
        'difficulty': 'Intermediate',
        'xp_reward': 50,
        'steps': [   {   'order_index': 1,
                         'content': '<strong>Prophylaxis</strong> is the art '
                                    "of preventing your opponent's plans "
                                    'before they can execute them. '
                                    "<em>Understanding your opponent's "
                                    'threats</em> is crucial to maintaining '
                                    'control of the game.',
                         'fen': 'rnbqkb1r/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w '
                                'KQkq - 0 1'},
                     {   'order_index': 2,
                         'content': 'Identify potential threats in your '
                                    "opponent's position. <strong>Consider "
                                    'moves that can block or counteract these '
                                    'threats.</strong> <em>Effective '
                                    'prophylaxis can turn the tide of the '
                                    'game.</em>',
                         'fen': 'rnbqkb1r/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR '
                                'b KQkq - 0 1'},
                     {   'order_index': 3,
                         'content': 'Practice making prophylactic moves. '
                                    '<strong>Ask yourself:</strong> What is my '
                                    'opponent planning? <em>How can I stop '
                                    'them?</em> This mindset will improve your '
                                    'overall strategic thinking.',
                         'fen': 'rnbqkb1r/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR '
                                'w KQkq - 0 1'}],
        'order_index': 50},
    {   'slug': 'improving-the-worst-piece',
        'title': 'Improving the Worst Piece',
        'description': 'Learn how to identify and improve your worst piece to '
                       'enhance your overall position.',
        'difficulty': 'Intermediate',
        'xp_reward': 50,
        'steps': [   {   'order_index': 1,
                         'content': '<strong>Identifying the Worst '
                                    'Piece:</strong> In this position, take a '
                                    'moment to assess which piece is the least '
                                    'active. <em>Consider how you can '
                                    'reposition it for greater influence.</em>',
                         'fen': 'rnbqkb1r/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w '
                                'KQkq - 0 1'},
                     {   'order_index': 2,
                         'content': '<strong>Repositioning the Piece:</strong> '
                                    'Now, move your worst piece to a more '
                                    'active square. <em>Think about how this '
                                    'new position can help control the center '
                                    'or support other pieces.</em>',
                         'fen': 'rnbqkb1r/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w '
                                'KQkq - 0 1'},
                     {   'order_index': 3,
                         'content': '<strong>Evaluating the Change:</strong> '
                                    'After repositioning, evaluate the new '
                                    'position of your piece. <em>Is it more '
                                    'effective? How does it contribute to your '
                                    'overall strategy?</em>',
                         'fen': 'rnbqkb1r/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w '
                                'KQkq - 0 1'}],
        'order_index': 51},
    {   'slug': 'the-center-classical',
        'title': 'The Center: Classical',
        'description': 'Master the art of occupying the center to control the '
                       'game and enhance your strategic play.',
        'difficulty': 'Intermediate',
        'xp_reward': 50,
        'steps': [   {   'order_index': 1,
                         'content': '<strong>Understanding the '
                                    'Center:</strong> In chess, the center '
                                    'consists of the four squares: '
                                    '<em>d4</em>, <em>d5</em>, <em>e4</em>, '
                                    'and <em>e5</em>. Controlling these '
                                    'squares allows for greater mobility and '
                                    'influence over the board.',
                         'fen': None},
                     {   'order_index': 2,
                         'content': '<strong>Opening Principles:</strong> '
                                    'During the opening, aim to develop your '
                                    'pieces towards the center. For example, '
                                    'moving your pawns to <em>d4</em> and '
                                    '<em>e4</em> helps establish a strong '
                                    'foothold.',
                         'fen': 'rnbqkb1r/pppppppp/8/8/4P3/4P3/PPPPPPPP/RNBQKBNR '
                                'w KQkq - 0 1'},
                     {   'order_index': 3,
                         'content': '<strong>Piece Coordination:</strong> Once '
                                    'you have occupied the center, ensure your '
                                    'pieces work together. Knights on '
                                    '<em>c3</em> and <em>f3</em> support your '
                                    'central pawns while controlling key '
                                    'squares.',
                         'fen': 'rnbqkb1r/pppppppp/8/8/4P3/4P3/PPPPPPPP/RNBQKBNR '
                                'w KQkq - 0 1'},
                     {   'order_index': 4,
                         'content': '<strong>Exploiting the Center:</strong> '
                                    'After establishing control, look for '
                                    'tactics and opportunities to attack your '
                                    "opponent's position. A well-placed piece "
                                    'in the center can often lead to tactical '
                                    'advantages.',
                         'fen': 'rnbqkb1r/pppppppp/8/8/4P3/4P3/PPPPPPPP/RNBQKBNR '
                                'w KQkq - 0 1'}],
        'order_index': 52},
    {   'slug': 'the-center-hypermodern',
        'title': 'The Center: Hypermodern',
        'description': 'Explore the fascinating world of hypermodern chess, '
                       'where control of the center is achieved indirectly.',
        'difficulty': 'Intermediate',
        'xp_reward': 50,
        'steps': [   {   'order_index': 1,
                         'content': '<strong>Hypermodernism</strong> is a '
                                    'chess strategy that emphasizes '
                                    '<em>control of the center</em> without '
                                    'occupying it directly. Instead of placing '
                                    'pawns in the center, hypermodern players '
                                    'often fianchetto their bishops and '
                                    'develop pieces to exert influence from a '
                                    'distance.',
                         'fen': None},
                     {   'order_index': 2,
                         'content': 'In this position, notice how Black allows '
                                    'White to occupy the center with pawns, '
                                    'while planning to undermine and attack it '
                                    'later. <strong>Key Idea:</strong> '
                                    '<em>Control the center indirectly.</em>',
                         'fen': 'rnbqkb1r/pppppppp/8/8/PPPPPPPP/RNBQKBNR/5N2/8'},
                     {   'order_index': 3,
                         'content': 'As the game progresses, look for '
                                    "opportunities to challenge White's "
                                    'center. <strong>Example Move:</strong> '
                                    '...d5 can strike at the center and open '
                                    'lines for your pieces. <em>Timing is '
                                    'crucial!</em>',
                         'fen': 'rnbqkb1r/pppppppp/8/8/PPPPPPPP/RNBQKBNR/5N2/8'},
                     {   'order_index': 4,
                         'content': 'Practice this concept by playing through '
                                    'a series of positions where you must find '
                                    'ways to exert control over the center '
                                    'without direct occupation. '
                                    '<strong>Remember:</strong> <em>Patience '
                                    'and strategy are key!</em>',
                         'fen': None}],
        'order_index': 53},
    {   'slug': 'weak-color-complexes',
        'title': 'Weak Color Complexes',
        'description': 'Learn how to exploit weak color complexes in your '
                       "opponent's position to gain a strategic advantage.",
        'difficulty': 'Intermediate',
        'xp_reward': 50,
        'steps': [   {   'order_index': 1,
                         'content': '<strong>Weak color complexes</strong> '
                                    'refer to areas on the board where one '
                                    'color of squares is poorly defended, '
                                    'often leading to tactical opportunities. '
                                    '<em>Understanding how to identify and '
                                    'exploit these weaknesses can turn the '
                                    'tide of a game.</em>',
                         'fen': 'rnbqkb1r/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w '
                                'KQkq - 0 1'},
                     {   'order_index': 2,
                         'content': 'In this position, notice how the '
                                    '<strong>dark squares</strong> around the '
                                    'black king are weak due to the absence of '
                                    'pawns. <em>Consider how you might place '
                                    'your pieces to exploit these '
                                    'weaknesses.</em>',
                         'fen': 'rnbqkb1r/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w '
                                'KQkq - 0 1'},
                     {   'order_index': 3,
                         'content': 'To exploit the weak dark squares, '
                                    '<strong>develop your pieces</strong> '
                                    'towards these squares. <em>For example, '
                                    'moving your bishop to c4 can target f7, a '
                                    'critical weak point.</em>',
                         'fen': 'rnbqkb1r/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w '
                                'KQkq - 0 1'},
                     {   'order_index': 4,
                         'content': 'Once you have established control over '
                                    'the weak squares, <strong>look for '
                                    'tactical opportunities</strong> such as '
                                    'forks or pins. <em>These tactics can lead '
                                    'to material gain or a strong positional '
                                    'advantage.</em>',
                         'fen': 'rnbqkb1r/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w '
                                'KQkq - 0 1'}],
        'order_index': 54},
    {   'slug': 'minority-attacks',
        'title': 'Minority Attacks',
        'description': "Learn how to create weaknesses in your opponent's pawn "
                       'structure through strategic minority attacks.',
        'difficulty': 'Intermediate',
        'xp_reward': 50,
        'steps': [   {   'order_index': 1,
                         'content': '<strong>Minority Attack</strong> is a '
                                    'strategic concept where you use fewer '
                                    'pawns to attack a larger pawn structure, '
                                    'aiming to create weaknesses. <em>In this '
                                    'lesson, you will learn how to execute a '
                                    'minority attack effectively.</em>',
                         'fen': 'rnbqkb1r/pppppppp/8/8/4P3/8/PPPPPPPP/RNBQKBNR '
                                'w KQkq - 0 1'},
                     {   'order_index': 2,
                         'content': 'Identify the target pawn structure of '
                                    'your opponent. <strong>Focus on the '
                                    'weaknesses that can be created by '
                                    'attacking with fewer pawns.</strong> '
                                    '<em>Consider the potential for creating '
                                    'isolated or doubled pawns.</em>',
                         'fen': 'rnbqkb1r/pppppppp/8/8/4P3/8/PPPPPPPP/RNBQKBNR '
                                'w KQkq - 0 1'},
                     {   'order_index': 3,
                         'content': 'Execute the minority attack by advancing '
                                    "your pawns towards the opponent's "
                                    'structure. <strong>Remember to support '
                                    'your pawns with pieces to maximize '
                                    'pressure.</strong> <em>Watch for '
                                    'counterplay from your opponent!</em>',
                         'fen': 'rnbqkb1r/pppppppp/8/8/4P3/8/PPPPPPPP/RNBQKBNR '
                                'w KQkq - 0 1'},
                     {   'order_index': 4,
                         'content': 'After creating weaknesses, '
                                    '<strong>capitalize on them by targeting '
                                    'the weak pawns with your pieces.</strong> '
                                    '<em>This will help you gain a material '
                                    'advantage or create a winning '
                                    'position.</em>',
                         'fen': 'rnbqkb1r/pppppppp/8/8/4P3/8/PPPPPPPP/RNBQKBNR '
                                'w KQkq - 0 1'}],
        'order_index': 55},
    {   'slug': 'blockades',
        'title': 'Blockades',
        'description': 'Learn how to effectively stop passed pawns and control '
                       'the board with strategic blockades.',
        'difficulty': 'Intermediate',
        'xp_reward': 50,
        'steps': [   {   'order_index': 1,
                         'content': '<strong>Blockades</strong> are a vital '
                                    'strategy in chess, especially when '
                                    'dealing with <em>passed pawns</em>. A '
                                    'passed pawn is one that has no opposing '
                                    'pawns in front of it on its way to '
                                    'promotion. To stop these pawns, you can '
                                    'place your pieces directly in their path, '
                                    'creating a blockade.',
                         'fen': '8/8/8/8/8/8/1P6/1K6 w - - 0 1'},
                     {   'order_index': 2,
                         'content': 'In this position, White has a passed pawn '
                                    'on b6. <strong>To effectively blockade '
                                    'it</strong>, you should consider the '
                                    'position of your king. Moving your king '
                                    'to b5 will prevent the pawn from '
                                    'advancing further. <em>Remember, the king '
                                    'is a powerful piece in endgames!</em>',
                         'fen': '8/8/8/8/8/8/1K6/1P6 w - - 0 1'},
                     {   'order_index': 3,
                         'content': 'Once your king is positioned on b5, '
                                    '<strong>you can also bring your other '
                                    'pieces into play</strong>. For example, '
                                    'if you have a rook, positioning it on the '
                                    "7th rank can help control the pawn's "
                                    'movement and threaten to capture it if it '
                                    'advances.',
                         'fen': '8/8/8/8/8/8/1K6/1P6 w - - 0 1'},
                     {   'order_index': 4,
                         'content': 'Practice this concept by setting up '
                                    'different scenarios with passed pawns. '
                                    '<strong>Try to find the best '
                                    'blockade</strong> for each situation, '
                                    'using your king and other pieces to stop '
                                    'the pawn from promoting.',
                         'fen': None}],
        'order_index': 56},
    {   'slug': 'centralizing-the-king',
        'title': 'Centralizing the King',
        'description': 'Master the art of endgame strategy by learning how to '
                       'effectively centralize your king for maximum influence '
                       'on the board.',
        'difficulty': 'Intermediate',
        'xp_reward': 50,
        'steps': [   {   'order_index': 1,
                         'content': '<strong>Understanding the Importance of '
                                    'the King:</strong> In the endgame, the '
                                    'king becomes a powerful piece. '
                                    '<em>Centralizing your king</em> allows it '
                                    'to control key squares and support your '
                                    'pawns.',
                         'fen': None},
                     {   'order_index': 2,
                         'content': '<strong>Step 1: Move Your King to the '
                                    'Center:</strong> Start by moving your '
                                    'king towards the center of the board. '
                                    'This increases its activity and '
                                    'influence. For example, if your king is '
                                    'on e1, aim to move it to e4 or d4.',
                         'fen': '8/5k2/8/8/8/8/5K2/8 w - - 0 1'},
                     {   'order_index': 3,
                         'content': '<strong>Step 2: Support Your '
                                    'Pawns:</strong> Once your king is '
                                    'centralized, use it to support your pawns '
                                    'as they advance. This synergy can create '
                                    'a passed pawn that is difficult for your '
                                    'opponent to stop.',
                         'fen': '8/5k2/8/8/8/5P2/5K2/8 w - - 0 1'},
                     {   'order_index': 4,
                         'content': '<strong>Step 3: Create a Winning '
                                    'Position:</strong> With your king '
                                    'centralized and supporting your pawns, '
                                    'look for opportunities to promote a pawn '
                                    'to a queen. <em>Always keep your king '
                                    'close to your pawns!</em>',
                         'fen': '8/5k2/8/8/5P2/5K2/8 w - - 0 1'}],
        'order_index': 57},
    {   'slug': 'evaluating-the-position',
        'title': 'Evaluating the Position',
        'description': "Learn how to assess chess positions using Silman's "
                       'Imbalances to make better strategic decisions.',
        'difficulty': 'Intermediate',
        'xp_reward': 50,
        'steps': [   {   'order_index': 1,
                         'content': '<strong>Understanding '
                                    'Imbalances:</strong> In chess, evaluating '
                                    'a position involves recognizing '
                                    '<em>imbalances</em> such as material, '
                                    'pawn structure, piece activity, and king '
                                    'safety. Each imbalance can influence your '
                                    'strategy and decision-making.',
                         'fen': None},
                     {   'order_index': 2,
                         'content': '<strong>Material Imbalance:</strong> When '
                                    'you have an extra piece or pawn, consider '
                                    'how to maximize its potential. Look for '
                                    'ways to trade down into a favorable '
                                    'endgame or create threats that exploit '
                                    'your material advantage.',
                         'fen': 'rnbqkb1r/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w '
                                'KQkq - 0 1'},
                     {   'order_index': 3,
                         'content': '<strong>Pawn Structure:</strong> Analyze '
                                    'the pawn structure to identify '
                                    'weaknesses. Is there an isolated pawn or '
                                    'a backward pawn? Use this information to '
                                    'plan your attack or defense accordingly.',
                         'fen': 'rnbqkb1r/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR '
                                'w KQkq - 0 1'},
                     {   'order_index': 4,
                         'content': '<strong>Piece Activity:</strong> Evaluate '
                                    'the activity of your pieces. Are they '
                                    'well-placed and coordinated? If not, '
                                    'consider how to reposition them for '
                                    'greater influence over the board.',
                         'fen': 'rnbqkb1r/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR '
                                'w KQkq - 0 1'}],
        'order_index': 58},
    {   'slug': 'e4-vs-d4-the-philosophy',
        'title': 'e4 vs d4: The Philosophy',
        'description': 'Explore the strategic depths of choosing between 1.e4 '
                       'and 1.d4 in chess openings.',
        'difficulty': 'Advanced',
        'xp_reward': 50,
        'steps': [   {   'order_index': 1,
                         'content': '<strong>1.e4</strong> is often considered '
                                    'the most aggressive opening move, leading '
                                    'to open positions and tactical battles. '
                                    '<em>It aims for quick development and '
                                    'control of the center.</em>',
                         'fen': None},
                     {   'order_index': 2,
                         'content': '<strong>1.d4</strong>, on the other hand, '
                                    'is more strategic, often leading to '
                                    'closed positions that require deep '
                                    'understanding of pawn structures. '
                                    '<em>This move emphasizes solid '
                                    'development and long-term planning.</em>',
                         'fen': None},
                     {   'order_index': 3,
                         'content': 'When choosing between '
                                    '<strong>1.e4</strong> and '
                                    '<strong>1.d4</strong>, consider your '
                                    'playing style: <em>Do you prefer tactical '
                                    'skirmishes or strategic maneuvering?</em>',
                         'fen': None},
                     {   'order_index': 4,
                         'content': 'Both openings can lead to rich and '
                                    'complex middlegames. '
                                    '<strong>Understanding the resulting pawn '
                                    'structures</strong> and typical plans is '
                                    'crucial for success in either choice. '
                                    '<em>Study key games to deepen your '
                                    'knowledge.</em>',
                         'fen': None}],
        'order_index': 59},
    {   'slug': 'the-italian-game',
        'title': 'The Italian Game',
        'description': 'Dive deep into one of the oldest and most popular '
                       'openings in chess, mastering the strategies behind the '
                       'Italian Game.',
        'difficulty': 'Advanced',
        'xp_reward': 50,
        'steps': [   {   'order_index': 1,
                         'content': '<strong>The Italian Game</strong> begins '
                                    'with the moves <em>1.e4 e5 2.Nf3 Nc6 '
                                    '3.Bc4</em>. This opening aims to control '
                                    'the center and prepare for rapid '
                                    'development.',
                         'fen': None},
                     {   'order_index': 2,
                         'content': 'After <em>3... Nf6</em>, White can choose '
                                    'to play <strong>4. d4</strong>, '
                                    'initiating the Italian Gambit. This '
                                    'aggressive move seeks to open the center '
                                    'and create tactical opportunities.',
                         'fen': 'rnbqkb1r/pppppppp/8/8/4P3/2N5/PPPPPPPP/R1BQKB1R '
                                'w KQkq - 0 4'},
                     {   'order_index': 3,
                         'content': 'If Black responds with <em>4... '
                                    'exd4</em>, White can play <strong>5. '
                                    'O-O</strong>, bringing the rook into play '
                                    'and increasing pressure on the f7 pawn.',
                         'fen': 'rnbqkb1r/pppppppp/8/8/4P3/2N5/PPPPPPPP/R1BQ1RK1 '
                                'w kq - 0 5'},
                     {   'order_index': 4,
                         'content': 'In the position after <em>5... Be7</em>, '
                                    'White can continue with <strong>6. '
                                    'e5</strong>, attacking the knight on f6 '
                                    'and aiming for a strong center.',
                         'fen': 'rnbqkb1r/pppppppp/5n2/8/4P3/2N5/PPPPPPPP/R1BQ1RK1 '
                                'w kq - 0 6'}],
        'order_index': 60},
    {   'slug': 'the-ruy-lopez-spanish',
        'title': 'The Ruy Lopez (Spanish)',
        'description': 'Dive into the intricacies of the Ruy Lopez, a classic '
                       'opening that has shaped the course of chess history.',
        'difficulty': 'Advanced',
        'xp_reward': 50,
        'steps': [   {   'order_index': 1,
                         'content': '<strong>Welcome to the Ruy '
                                    'Lopez!</strong> This opening begins with '
                                    '<em>1.e4 e5 2.Nf3 Nc6 3.Bb5</em>, aiming '
                                    'to put pressure on the knight that '
                                    'defends the e5 pawn.',
                         'fen': None},
                     {   'order_index': 2,
                         'content': '<strong>Understanding the Morphy '
                                    'Defense:</strong> After <em>3...a6</em>, '
                                    'White typically responds with '
                                    '<em>4.Ba4</em>. This move maintains the '
                                    'tension and prepares for a strong center.',
                         'fen': 'rnbqkbnr/ppp1pppp/3p4/1B6/4P3/2N5/PPP2PPP/R1BQK1NR '
                                'w KQkq - 0 4'},
                     {   'order_index': 3,
                         'content': '<strong>Exploring the Closed Ruy '
                                    'Lopez:</strong> After <em>4...Nf6 5.O-O '
                                    'Be7</em>, we enter the Closed Ruy Lopez. '
                                    'Here, both sides develop their pieces '
                                    'while keeping the center solid.',
                         'fen': 'rnbq1rk1/ppp2ppp/5n2/1B6/4P3/2N5/PPP2PPP/R1BQK2R '
                                'w KQ - 0 6'},
                     {   'order_index': 4,
                         'content': '<strong>Key Ideas:</strong> In this '
                                    'position, White aims to play '
                                    '<em>d2-d4</em> to challenge the center, '
                                    'while Black will look to counter with '
                                    '...d6 and ...O-O.',
                         'fen': 'rnbq1rk1/ppp2ppp/5n2/1B6/4P3/2N5/PPP2PPP/R1BQK2R '
                                'w KQ - 0 6'}],
        'order_index': 61},
    {   'slug': 'the-sicilian-defense',
        'title': 'The Sicilian Defense',
        'description': 'Explore the dynamic and complex nature of the Sicilian '
                       'Defense, focusing on the critical imbalances created '
                       'by the move c5.',
        'difficulty': 'Advanced',
        'xp_reward': 50,
        'steps': [   {   'order_index': 1,
                         'content': '<strong>Introduction to the Sicilian '
                                    'Defense:</strong> The Sicilian Defense '
                                    'arises after <em>1.e4 c5</em>, leading to '
                                    'asymmetrical pawn structures and rich '
                                    'tactical opportunities.',
                         'fen': None},
                     {   'order_index': 2,
                         'content': '<strong>Understanding the c5 Pawn '
                                    'Move:</strong> The move <em>c5</em> '
                                    "immediately challenges White's center and "
                                    'creates imbalances, allowing Black to '
                                    'counterattack effectively.',
                         'fen': 'rnbqkb1r/ppp2ppp/3p4/3p4/4P3/8/PPP2PPP/RNBQKBNR '
                                'w KQkq - 0 2'},
                     {   'order_index': 3,
                         'content': '<strong>Key Variations:</strong> Explore '
                                    'the <em>Sicilian Najdorf</em> and '
                                    '<em>Sicilian Dragon</em> variations, '
                                    'which exemplify the imbalances and '
                                    'tactical themes that arise from c5.',
                         'fen': None},
                     {   'order_index': 4,
                         'content': '<strong>Strategic Plans for Both '
                                    'Sides:</strong> Learn the strategic ideas '
                                    'for both White and Black in the Sicilian, '
                                    'focusing on pawn structure, piece '
                                    'activity, and king safety.',
                         'fen': 'rnbqkb1r/ppp2ppp/3p4/3P4/4P3/8/PPP2PPP/RNBQKBNR '
                                'b KQkq - 0 2'}],
        'order_index': 62},
    {   'slug': 'the-french-defense',
        'title': 'The French Defense',
        'description': 'Master the solid structures of the French Defense and '
                       'learn to outmaneuver your opponent.',
        'difficulty': 'Advanced',
        'xp_reward': 50,
        'steps': [   {   'order_index': 1,
                         'content': '<strong>The French Defense</strong> '
                                    'begins with the moves <em>1.e4 e6</em>. '
                                    'This opening is known for its solid pawn '
                                    'structure and counterattacking potential.',
                         'fen': None},
                     {   'order_index': 2,
                         'content': 'After <strong>2.d4 d5</strong>, Black '
                                    'aims to challenge the center. The pawn on '
                                    'e6 supports the d5 pawn, creating a '
                                    'stronghold.',
                         'fen': 'rnbqkb1r/pppppppp/8/8/4P3/8/PPPPPPPP/RNBQKBNR '
                                'w KQkq - 0 1'},
                     {   'order_index': 3,
                         'content': 'In the <strong>Exchange '
                                    'Variation</strong> with <em>3.exd5 '
                                    'exd5</em>, Black retains a solid pawn '
                                    'structure while preparing to develop '
                                    'pieces actively.',
                         'fen': 'rnbqkb1r/pppppppp/8/8/4P3/8/PPPPPPPP/RNBQKBNR '
                                'w KQkq - 0 1'},
                     {   'order_index': 4,
                         'content': 'Understanding the <strong>e6 '
                                    'pawn</strong> is crucial; it supports the '
                                    'center and can later advance to e5, '
                                    "challenging White's position.",
                         'fen': 'rnbqkb1r/pppppppp/8/8/4P3/8/PPPPPPPP/RNBQKBNR '
                                'w KQkq - 0 1'}],
        'order_index': 63},
    {   'slug': 'the-caro-kann',
        'title': 'The Caro-Kann',
        'description': 'Explore the solid structures of the Caro-Kann Defense '
                       'and learn how to leverage them for a strong position.',
        'difficulty': 'Advanced',
        'xp_reward': 50,
        'steps': [   {   'order_index': 1,
                         'content': '<strong>The Caro-Kann Defense</strong> '
                                    'begins with <em>1.e4 c6</em>. This '
                                    'opening is known for its solid pawn '
                                    'structure and resilience against '
                                    'aggressive play.',
                         'fen': 'rnbqkb1r/ppp2ppp/3p4/3Pp3/4P3/8/PPP2PPP/RNBQKBNR'},
                     {   'order_index': 2,
                         'content': '<strong>After 2.d4 d5</strong>, Black '
                                    'aims to challenge the center. The pawn on '
                                    'c6 supports the d5 pawn, creating a '
                                    'robust formation that is hard to break.',
                         'fen': 'rnbqkb1r/ppp2ppp/3p4/3Pp3/4P3/8/PPP2PPP/RNBQKBNR'},
                     {   'order_index': 3,
                         'content': '<strong>When White plays 3.Nc3</strong>, '
                                    'consider the move <em>3...dxe4</em>. This '
                                    'captures the pawn and opens lines for '
                                    'your pieces, while maintaining a solid '
                                    'structure.',
                         'fen': 'rnbqkb1r/ppp2ppp/3p4/3Pp3/4P3/8/PPP2PPP/RNBQKBNR'},
                     {   'order_index': 4,
                         'content': '<strong>After 4.Nxe4</strong>, you can '
                                    'play <em>4...Bf5</em>. This develops your '
                                    'bishop outside the pawn chain and '
                                    'prepares for a solid middle game.',
                         'fen': 'rnbqkb1r/ppp2ppp/3p4/3Pp3/4P3/8/PPP2PPP/RNBQKBNR'}],
        'order_index': 64},
    {   'slug': 'the-queens-gambit',
        'title': "The Queen's Gambit",
        'description': 'Dive deep into the strategic intricacies of the '
                       "Queen's Gambit and enhance your d4 d5 repertoire.",
        'difficulty': 'Advanced',
        'xp_reward': 50,
        'steps': [   {   'order_index': 1,
                         'content': "<strong>The Queen's Gambit</strong> "
                                    'begins with the moves <em>1. d4 d5 2. '
                                    'c4</em>. This opening aims to challenge '
                                    "Black's central pawn and create "
                                    "opportunities for White's pieces.",
                         'fen': 'rnbqkbnr/pppppppp/8/8/PPPPPPPP/RNBQKBNR'},
                     {   'order_index': 2,
                         'content': '<strong>Accepting the Gambit</strong> '
                                    'with <em>2...dxc4</em> allows Black to '
                                    'gain a pawn, but can lead to a positional '
                                    "struggle against White's active pieces. "
                                    'Consider the implications of this choice '
                                    'carefully.',
                         'fen': 'rnbqkbnr/pppppppp/8/8/PPPPPPPP/RNBQKBNR'},
                     {   'order_index': 3,
                         'content': '<strong>Declining the Gambit</strong> '
                                    'with <em>2...e6</em> is a solid choice, '
                                    'maintaining the pawn structure and '
                                    'preparing to develop pieces harmoniously. '
                                    'Explore the plans that arise from this '
                                    'setup.',
                         'fen': 'rnbqkbnr/pppppppp/8/8/PPPPPPPP/RNBQKBNR'},
                     {   'order_index': 4,
                         'content': '<strong>Key Ideas</strong>: After '
                                    '<em>2...e6</em>, White can continue with '
                                    '<em>3. Nf3</em> or <em>3. e3</em>, '
                                    'focusing on piece development and control '
                                    'of the center. Analyze the resulting '
                                    'positions to understand the strategic '
                                    'nuances.',
                         'fen': 'rnbqkbnr/pppppppp/8/8/PPPPPPPP/RNBQKBNR'}],
        'order_index': 65},
    {   'slug': 'the-slav-defense',
        'title': 'The Slav Defense',
        'description': 'Explore the robust and strategic foundations of the '
                       'Slav Defense, a solid choice for players looking to '
                       'counter 1.d4.',
        'difficulty': 'Advanced',
        'xp_reward': 50,
        'steps': [   {   'order_index': 1,
                         'content': '<strong>The Slav Defense</strong> begins '
                                    'with the moves <em>1.d4 d5 2.c4 c6</em>. '
                                    'This setup aims to support the center '
                                    'while maintaining a solid pawn structure.',
                         'fen': 'rnbqkb1r/ppp2ppp/3p1n2/3Pp3/2P5/8/PPP2PPP/RNBQKBNR '
                                'w KQkq - 0 3'},
                     {   'order_index': 2,
                         'content': 'In the Slav Defense, '
                                    '<strong>Black</strong> often aims for '
                                    '<em>...e6</em> to develop the '
                                    'light-squared bishop and reinforce the '
                                    'center. Understanding this pawn structure '
                                    'is crucial.',
                         'fen': 'rnbqkb1r/ppp2ppp/3p1n2/3Pp3/2P5/8/PPP2PPP/RNBQKBNR '
                                'w KQkq - 0 3'},
                     {   'order_index': 3,
                         'content': 'One common variation is the '
                                    '<strong>Exchange Variation</strong>, '
                                    'where <em>3.cxd5 cxd5</em> leads to '
                                    'symmetrical pawn structures, emphasizing '
                                    'piece development over pawn tension.',
                         'fen': 'rnbqkb1r/ppp2ppp/3p4/3Pp3/2P5/8/PPP2PPP/RNBQKBNR '
                                'w KQkq - 0 3'},
                     {   'order_index': 4,
                         'content': 'Another important line is the '
                                    '<strong>Slav Accepted</strong>, where '
                                    'after <em>3.cxd5 Nf6</em>, Black seeks to '
                                    'regain the pawn while developing pieces '
                                    'actively.',
                         'fen': 'rnbqkb1r/ppp2ppp/5n2/3Pp3/2P5/8/PPP2PPP/RNBQKBNR '
                                'w KQkq - 0 3'}],
        'order_index': 66},
    {   'slug': 'the-kings-indian-defense',
        'title': "The King's Indian Defense",
        'description': "Explore the rich and dynamic strategies of the King's "
                       'Indian Defense, a favorite among hypermodern players.',
        'difficulty': 'Advanced',
        'xp_reward': 50,
        'steps': [   {   'order_index': 1,
                         'content': "<strong>Introduction to the King's Indian "
                                    'Defense:</strong> This defense is '
                                    'characterized by <em>flexible pawn '
                                    'structures</em> and aims to control the '
                                    'center with pieces rather than pawns.',
                         'fen': None},
                     {   'order_index': 2,
                         'content': '<strong>Key Moves:</strong> The typical '
                                    'moves begin with <em>1.d4 Nf6 2.c4 g6 '
                                    '3.Nc3 Bg7 4.e4 d6</em>. This setup allows '
                                    "Black to challenge White's center later.",
                         'fen': 'rnbqkb1r/ppp2ppp/5n2/3p4/4p3/2N5/PPP2PPP/R1BQKBNR'},
                     {   'order_index': 3,
                         'content': '<strong>Strategic Ideas:</strong> Black '
                                    'aims for a <em>...e5</em> or '
                                    "<em>...c5</em> break to undermine White's "
                                    'center. Understanding these pawn breaks '
                                    'is crucial for success.',
                         'fen': 'rnbqkb1r/ppp2ppp/5n2/3p4/4p3/2N5/PPP2PPP/R1BQKBNR'},
                     {   'order_index': 4,
                         'content': '<strong>Common Plans:</strong> After '
                                    'achieving a solid setup, look for '
                                    'opportunities to launch a kingside attack '
                                    'with <em>...f5</em> and piece activity, '
                                    'especially with knights and bishops.',
                         'fen': 'rnbqkb1r/ppp2ppp/5n2/3p4/4p3/2N5/PPP2PPP/R1BQKBNR'}],
        'order_index': 67},
    {   'slug': 'the-nimzo-indian',
        'title': 'The Nimzo-Indian',
        'description': 'Master the art of pinning the knight in the '
                       'Nimzo-Indian Defense to gain a strategic advantage.',
        'difficulty': 'Advanced',
        'xp_reward': 50,
        'steps': [   {   'order_index': 1,
                         'content': '<strong>Welcome to the Nimzo-Indian '
                                    'Defense!</strong> In this opening, Black '
                                    'aims to control the center while '
                                    'developing pieces efficiently. One key '
                                    'idea is to <em>pin the knight on c3</em> '
                                    'to create tactical opportunities.',
                         'fen': 'rnbqkb1r/ppp2ppp/5n2/3p4/3P4/2N5/PPP2PPP/R1BQKB1R'},
                     {   'order_index': 2,
                         'content': '<strong>Understanding the Pin:</strong> '
                                    'When you pin the knight on c3 with your '
                                    'bishop, it cannot move without exposing '
                                    'the queen. This can lead to tactical '
                                    'advantages if played correctly. '
                                    "<em>Consider your opponent's "
                                    'responses!</em>',
                         'fen': 'rnbqkb1r/ppp2ppp/5n2/3p4/3P4/2N5/PPP2PPP/R1BQKB1R'},
                     {   'order_index': 3,
                         'content': '<strong>Practice the Pin:</strong> In '
                                    'this position, try to find the best move '
                                    'to pin the knight on c3. Remember to '
                                    'think about how your opponent might react '
                                    'and plan your next moves accordingly.',
                         'fen': 'rnbqkb1r/ppp2ppp/5n2/3p4/3P4/2N5/PPP2PPP/R1BQKB1R'},
                     {   'order_index': 4,
                         'content': '<strong>Review:</strong> After pinning '
                                    'the knight, analyze the position to see '
                                    'how it affects the game. <em>What are '
                                    'your next strategic goals?</em> Look for '
                                    'ways to exploit the pin and gain a '
                                    'material advantage.',
                         'fen': 'rnbqkb1r/ppp2ppp/5n2/3p4/3P4/2N5/PPP2PPP/R1BQKB1R'}],
        'order_index': 68},
    {   'slug': 'the-english-opening',
        'title': 'The English Opening',
        'description': 'Explore the strategic depth and flexibility of the '
                       'English Opening, a powerful flank opening that can '
                       'lead to rich, complex positions.',
        'difficulty': 'Advanced',
        'xp_reward': 50,
        'steps': [   {   'order_index': 1,
                         'content': '<strong>The English Opening</strong> '
                                    'begins with <em>1. c4</em>, a move that '
                                    'controls the center indirectly and '
                                    'prepares for flexible pawn structures.',
                         'fen': None},
                     {   'order_index': 2,
                         'content': 'After <em>1. c4</em>, Black has various '
                                    'responses. A common reply is <em>1... '
                                    'e5</em>, leading to a symmetrical '
                                    'structure. Consider how you can develop '
                                    'your pieces effectively.',
                         'fen': 'rnbqkb1r/pppppppp/8/8/2P5/8/PPPPPPPP/RNBQKBNR '
                                'w KQkq - 0 1'},
                     {   'order_index': 3,
                         'content': '<strong>2. Nf3</strong> is a natural '
                                    'developing move. It prepares to control '
                                    'the center and can lead to various '
                                    'setups, including the Reversed Sicilian.',
                         'fen': 'rnbqkb1r/pppppppp/8/8/2P5/5N2/PPPPPPPP/RNBQKB1R '
                                'b KQkq - 1 1'},
                     {   'order_index': 4,
                         'content': 'Consider the move <strong>3. d4</strong> '
                                    'to challenge the center directly. This '
                                    'can lead to open positions and dynamic '
                                    'play, typical of the English Opening.',
                         'fen': 'rnbqkb1r/pppppppp/8/8/2P5/5N2/PPPPPPPP/RNBQKB1R '
                                'b KQkq - 1 1'}],
        'order_index': 69},
    {   'slug': 'gambits-kings-gambit',
        'title': "Gambits: King's Gambit",
        'description': "Dive into the thrilling world of the King's Gambit, "
                       'where bold sacrifices lead to dynamic play and rich '
                       'tactical opportunities.',
        'difficulty': 'Advanced',
        'xp_reward': 50,
        'steps': [   {   'order_index': 1,
                         'content': "<strong>The King's Gambit</strong> begins "
                                    'with the moves <em>1.e4 e5 2.f4</em>. '
                                    'This opening is designed to challenge '
                                    "Black's control of the center and create "
                                    'immediate tactical chances.',
                         'fen': 'rnbqkb1r/pppppppp/8/8/4P3/5P2/PPPP1PPP/RNBQKBNR '
                                'w KQkq - 0 1'},
                     {   'order_index': 2,
                         'content': '<strong>Accepting the Gambit</strong> '
                                    'with <em>2...exf4</em> is the most common '
                                    'response. This move allows Black to gain '
                                    "material but opens the door for White's "
                                    'aggressive play.',
                         'fen': 'rnbqkb1r/pppppppp/8/8/4P3/5P2/PPPP1PPP/RNBQKBNR '
                                'w KQkq - 0 1'},
                     {   'order_index': 3,
                         'content': '<strong>After 3.Nf3</strong>, White aims '
                                    'to regain the pawn on f4 and develop '
                                    'pieces rapidly. This move also prepares '
                                    'for a potential kingside attack.',
                         'fen': 'rnbqkb1r/pppppppp/8/8/4P3/5P2/PPPP1PPP/RNBQKBNR '
                                'w KQkq - 0 1'},
                     {   'order_index': 4,
                         'content': "<strong>Key Ideas</strong>: In the King's "
                                    'Gambit, look for tactical opportunities '
                                    'and be prepared to sacrifice material for '
                                    'a strong initiative. Remember, the goal '
                                    'is to create imbalances that favor your '
                                    'attacking chances.',
                         'fen': 'rnbqkb1r/pppppppp/8/8/4P3/5P2/PPPP1PPP/RNBQKBNR '
                                'w KQkq - 0 1'}],
        'order_index': 70},
    {   'slug': 'gambits-evans-gambit',
        'title': 'Gambits: Evans Gambit',
        'description': 'Dive into the aggressive and tactical world of the '
                       'Evans Gambit, where rapid development can lead to a '
                       'swift victory.',
        'difficulty': 'Advanced',
        'xp_reward': 50,
        'steps': [   {   'order_index': 1,
                         'content': '<strong>Introduction to the Evans '
                                    'Gambit:</strong> The Evans Gambit is an '
                                    'aggressive opening that arises after '
                                    '<em>1.e4 e5 2.Nf3 Nc6 3.Bc4 Bc5 '
                                    '4.b4</em>. This gambit aims to sacrifice '
                                    'a pawn for rapid development and control '
                                    'of the center.',
                         'fen': 'rnbqkbnr/pppppppp/8/8/2B5/8/PPPPPPPP/RNBQKBNR '
                                'w KQkq - 0 1'},
                     {   'order_index': 2,
                         'content': '<strong>Key Ideas:</strong> After '
                                    '<em>4...Bxb4</em>, White can play '
                                    '<em>5.c3</em> to challenge the center and '
                                    'open lines for the pieces. The goal is to '
                                    'develop quickly and create threats '
                                    "against Black's position.",
                         'fen': 'rnbqkbnr/pppppppp/8/8/2B5/2P5/PPPPPPPP/RNBQKBNR '
                                'w KQkq - 0 1'},
                     {   'order_index': 3,
                         'content': '<strong>Example Continuation:</strong> '
                                    'After <em>5...Ba5 6.d4</em>, White has '
                                    'excellent chances for rapid piece '
                                    'development and can aim for a strong '
                                    'initiative. Focus on how to utilize your '
                                    'pieces effectively in the opening.',
                         'fen': 'rnbqkbnr/pppppppp/5n2/4P3/2B5/8/PPPPPPPP/RNBQKBNR '
                                'w KQkq - 0 1'},
                     {   'order_index': 4,
                         'content': '<strong>Practice Position:</strong> Set '
                                    'up the board after <em>6.d4</em> and '
                                    'consider your next move. How can you '
                                    'maximize your piece activity and put '
                                    "pressure on Black's position?",
                         'fen': 'rnbqkb1r/pppppppp/5n2/4P3/2B5/8/PPPPPPPP/RNBQKBNR '
                                'w KQkq - 0 1'}],
        'order_index': 71},
    {   'slug': 'punishing-early-queen-moves',
        'title': 'Punishing Early Queen Moves',
        'description': 'Learn how to exploit the weaknesses created by your '
                       "opponent's premature queen development.",
        'difficulty': 'Advanced',
        'xp_reward': 50,
        'steps': [   {   'order_index': 1,
                         'content': '<strong>Introduction:</strong> In this '
                                    'lesson, we will explore how '
                                    '<em>developing your queen too early</em> '
                                    'can lead to tactical vulnerabilities. '
                                    "Let's examine a common scenario.",
                         'fen': 'rnbqkb1r/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w '
                                'KQkq - 0 1'},
                     {   'order_index': 2,
                         'content': '<strong>Step 1:</strong> If your opponent '
                                    'plays <em>Qh4</em> early, it can be '
                                    "easily targeted. Let's see how to respond "
                                    'effectively.',
                         'fen': 'rnbqkb1r/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w '
                                'KQkq - 0 1'},
                     {   'order_index': 3,
                         'content': '<strong>Step 2:</strong> After '
                                    '<em>g6</em>, the queen is now in danger. '
                                    'Learn how to capitalize on this mistake '
                                    'by developing your pieces with tempo.',
                         'fen': 'rnbqkb1r/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w '
                                'KQkq - 0 1'},
                     {   'order_index': 4,
                         'content': '<strong>Conclusion:</strong> Always '
                                    'remember that <em>early queen moves</em> '
                                    'can lead to significant disadvantages. '
                                    'Practice punishing these errors in your '
                                    'games!',
                         'fen': 'rnbqkb1r/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w '
                                'KQkq - 0 1'}],
        'order_index': 72},
    {   'slug': 'the-london-system',
        'title': 'The London System',
        'description': 'Master the London System, a flexible and solid opening '
                       'choice for players seeking a universal setup.',
        'difficulty': 'Advanced',
        'xp_reward': 50,
        'steps': [   {   'order_index': 1,
                         'content': '<strong>The London System</strong> is a '
                                    '<em>universal opening system</em> that '
                                    'allows players to develop their pieces '
                                    'harmoniously while maintaining a solid '
                                    'pawn structure. It is characterized by '
                                    'the early development of the dark-squared '
                                    'bishop and a strong pawn formation.',
                         'fen': None},
                     {   'order_index': 2,
                         'content': 'In the London System, the typical moves '
                                    'are <strong>1.d4</strong>, '
                                    '<strong>2.Nf3</strong>, '
                                    '<strong>3.Bf4</strong>, and '
                                    '<strong>4.e3</strong>. This setup '
                                    'provides excellent control of the center '
                                    'and prepares for a solid development of '
                                    'your pieces.',
                         'fen': 'rnbqkbnr/pppppppp/8/8/4P3/2N5/BPPP1PPP/R1BQK1NR '
                                'w KQkq - 0 1'},
                     {   'order_index': 3,
                         'content': 'One of the key ideas in the London System '
                                    'is to play <strong>c3</strong> and '
                                    '<strong>Nd2</strong> to support the '
                                    'center and prepare for a potential e4 '
                                    'pawn break. This gives White a strong '
                                    'central presence and flexibility in the '
                                    'middlegame.',
                         'fen': 'rnbqkb1r/pppppppp/8/8/4P3/2N5/BPPP1PPP/R1BQK1NR '
                                'w KQkq - 0 1'},
                     {   'order_index': 4,
                         'content': 'As you progress, remember that the London '
                                    'System can lead to various pawn '
                                    'structures and plans. Always be prepared '
                                    'to adapt your strategy based on your '
                                    "opponent's responses and the evolving "
                                    'position on the board.',
                         'fen': None}],
        'order_index': 73},
    {   'slug': 'pawn-storms',
        'title': 'Pawn Storms',
        'description': 'Master the art of launching a devastating pawn storm '
                       "against your opponent's king when castled on opposite "
                       'sides.',
        'difficulty': 'Advanced',
        'xp_reward': 50,
        'steps': [   {   'order_index': 1,
                         'content': '<strong>Welcome to the Pawn Storms '
                                    'lesson!</strong> In this lesson, we will '
                                    'explore how to effectively launch a pawn '
                                    "storm against an opponent's king when "
                                    'both players have castled on opposite '
                                    'sides. <em>Understanding pawn structure '
                                    'and timing is crucial for success.</em>',
                         'fen': None},
                     {   'order_index': 2,
                         'content': '<strong>Step 1: Identifying the Right '
                                    'Moment</strong> - Before initiating a '
                                    "pawn storm, ensure that your opponent's "
                                    'pieces are poorly positioned to defend. '
                                    'Look for weaknesses in their pawn '
                                    'structure and <em>calculate the '
                                    'consequences of your pawn moves.</em>',
                         'fen': 'rnbq1rk1/ppp2ppp/5n2/3p4/3P4/2P2N2/P1Q2PPP/R1B1R1K1 '
                                'w - - 0 1'},
                     {   'order_index': 3,
                         'content': '<strong>Step 2: Launching the '
                                    'Storm</strong> - Once you have identified '
                                    'the right moment, start advancing your '
                                    'pawns towards the enemy king. '
                                    '<em>Coordinate your pieces to support the '
                                    'advance and create threats.</em>',
                         'fen': 'rnbq1rk1/ppp2ppp/5n2/3p4/3P4/2P2N2/P1Q2PPP/R1B1R1K1 '
                                'w - - 0 1'},
                     {   'order_index': 4,
                         'content': '<strong>Step 3: Capitalizing on the '
                                    'Attack</strong> - As your pawns advance, '
                                    'look for tactical opportunities to '
                                    "exploit weaknesses in your opponent's "
                                    'position. <em>Be prepared to sacrifice '
                                    'material if it leads to a decisive attack '
                                    'against the king.</em>',
                         'fen': 'rnbq1rk1/ppp2ppp/5n2/3p4/3P4/2P2N2/P1Q2PPP/R1B1R1K1 '
                                'w - - 0 1'}],
        'order_index': 74},
    {   'slug': 'greek-gift-sacrifice',
        'title': 'Greek Gift Sacrifice',
        'description': 'Master the art of the Greek Gift Sacrifice to unleash '
                       "devastating attacks on your opponent's king.",
        'difficulty': 'Advanced',
        'xp_reward': 50,
        'steps': [   {   'order_index': 1,
                         'content': '<strong>Welcome to the Greek Gift '
                                    'Sacrifice lesson!</strong> In this '
                                    'lesson, we will explore the powerful '
                                    '<em>Bxh7+</em> tactic that can lead to a '
                                    'swift victory. This sacrifice often '
                                    'catches opponents off guard and opens up '
                                    'lines against their king.',
                         'fen': 'rnbqkb1r/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w '
                                'KQkq - 0 1'},
                     {   'order_index': 2,
                         'content': "<strong>Step 1:</strong> Let's set up a "
                                    'position where the Greek Gift Sacrifice '
                                    'is possible. Look for opportunities to '
                                    "play <em>Bxh7+</em> when the opponent's "
                                    'king is on e8 and the h7 pawn is '
                                    'unprotected.',
                         'fen': 'rnbqk2r/pppppppp/5n2/8/8/8/PPPPPPPP/RNBQKBNR '
                                'w KQkq - 0 1'},
                     {   'order_index': 3,
                         'content': '<strong>Step 2:</strong> After executing '
                                    '<em>Bxh7+</em>, observe how the opponent '
                                    'must respond. Typically, they will '
                                    'capture the bishop with the king. This is '
                                    'a critical moment to capitalize on their '
                                    'weakened position.',
                         'fen': 'rnbqk2r/pppppppp/5n2/8/8/8/PPPPPPPP/RNBQKBNR '
                                'b KQkq - 0 1'},
                     {   'order_index': 4,
                         'content': "<strong>Step 3:</strong> Now, let's "
                                    'practice the follow-up moves after '
                                    '<em>Bxh7+</em>. Consider how to bring '
                                    'your queen into the attack and checkmate '
                                    "the opponent's king. Look for patterns "
                                    'that lead to victory!',
                         'fen': 'rnbqk2r/pppppppp/5n2/8/8/8/PPPPPPPP/RNBQKBNR '
                                'w KQkq - 0 1'}],
        'order_index': 75},
    {   'slug': 'development-imbalances',
        'title': 'Development Imbalances',
        'description': 'Explore the strategic depth of sacrificing material '
                       'for tempo to gain a developmental advantage.',
        'difficulty': 'Advanced',
        'xp_reward': 50,
        'steps': [   {   'order_index': 1,
                         'content': '<strong>Development imbalances</strong> '
                                    'occur when one player has a lead in piece '
                                    'activity while the other has material. '
                                    '<em>Understanding when to sacrifice '
                                    'material for tempo can turn the tide of a '
                                    'game.</em>',
                         'fen': 'rnbqkb1r/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w '
                                'KQkq - 0 1'},
                     {   'order_index': 2,
                         'content': '<strong>Consider this position:</strong> '
                                    'White has sacrificed a pawn to develop '
                                    'their pieces rapidly. <em>Can you find '
                                    'the best move for White that maintains '
                                    'the initiative?</em>',
                         'fen': 'rnbqkb1r/pppppppp/8/8/8/5N2/PPPPP1PP/RNBQKB1R '
                                'w KQkq - 0 1'},
                     {   'order_index': 3,
                         'content': '<strong>After the initial moves,</strong> '
                                    'the key is to keep the pressure on your '
                                    'opponent. <em>Identify the most '
                                    'aggressive continuation for White.</em>',
                         'fen': 'rnbqkb1r/pppppppp/8/8/8/5N2/PPPPP1PP/RNBQKB1R '
                                'w KQkq - 0 1'},
                     {   'order_index': 4,
                         'content': '<strong>Finally,</strong> analyze the '
                                    'resulting position after your move. '
                                    '<em>How does your development compare to '
                                    "your opponent's?</em>",
                         'fen': 'rnbqkb1r/pppppppp/8/8/8/5N2/PPPPP1PP/RNBQKB1R '
                                'w KQkq - 0 1'}],
        'order_index': 76},
    {   'slug': 'the-center-fork-trick',
        'title': 'The Center Fork Trick',
        'description': 'Master the art of exploiting central control with a '
                       'tactical fork that can turn the tide of the game.',
        'difficulty': 'Advanced',
        'xp_reward': 50,
        'steps': [   {   'order_index': 1,
                         'content': '<strong>Welcome to the Center Fork '
                                    'Trick!</strong> In this lesson, you will '
                                    'learn how to utilize central pieces to '
                                    'create tactical opportunities, '
                                    'specifically focusing on the fork tactic.',
                         'fen': None},
                     {   'order_index': 2,
                         'content': '<strong>Step 1:</strong> <em>Control the '
                                    'center.</em> Begin with 1.e4 and 1...e5 '
                                    'to establish a strong presence in the '
                                    'center of the board.',
                         'fen': 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPPPPPP/RNBQKBNR '
                                'w KQkq - 0 1'},
                     {   'order_index': 3,
                         'content': '<strong>Step 2:</strong> <em>Develop your '
                                    'pieces.</em> Play 2.Nf3 and 2...Nc6 to '
                                    'prepare for potential forks and maintain '
                                    'central control.',
                         'fen': 'rnbqkbnr/pppppppp/8/8/4P3/5N2/PPPPPPPP/RNBQKBNR '
                                'w KQkq - 1 2'},
                     {   'order_index': 4,
                         'content': '<strong>Step 3:</strong> <em>Look for the '
                                    'fork.</em> After 3.Bb5, be ready to '
                                    'exploit the central fork with your knight '
                                    'on c6 if your opponent plays carelessly.',
                         'fen': 'rnbqkbnr/pppppppp/5n2/8/5Bb1/5N2/PPPPPPPP/RNBQKBNR '
                                'w KQkq - 1 3'}],
        'order_index': 77},
    {   'slug': 'transpositions',
        'title': 'Transpositions',
        'description': 'Master the art of confusing your opponent by learning '
                       'how to manipulate the flow of the game through '
                       'transpositions.',
        'difficulty': 'Advanced',
        'xp_reward': 50,
        'steps': [   {   'order_index': 1,
                         'content': '<strong>Transpositions</strong> occur '
                                    'when a sequence of moves leads to a '
                                    'position that can be reached by a '
                                    'different sequence. This can '
                                    '<em>confuse</em> your opponent and lead '
                                    'them into unfamiliar territory.',
                         'fen': None},
                     {   'order_index': 2,
                         'content': "One common example is the <strong>Queen's "
                                    'Gambit</strong> which can transpose into '
                                    "the <strong>King's Indian "
                                    'Defense</strong>. Understanding these '
                                    'connections can give you a strategic '
                                    'edge.',
                         'fen': 'rnbqkb1r/pppppppp/8/8/2P5/8/PPPPPPPP/RNBQKBNR '
                                'w KQkq - 0 1'},
                     {   'order_index': 3,
                         'content': 'In this position, consider how you can '
                                    'play 1. d4 and then transpose into a '
                                    '<strong>Grünfeld Defense</strong> setup '
                                    'by playing 2. c4 and 3. Nf3 later. This '
                                    'can lead to <em>unexpected traps</em> for '
                                    'your opponent.',
                         'fen': 'rnbqkb1r/pppppppp/8/8/2P5/8/PPPPPPPP/RNBQKBNR '
                                'w KQkq - 0 1'},
                     {   'order_index': 4,
                         'content': 'Practice identifying potential '
                                    'transpositions in your games. Look for '
                                    'ways to steer the game into positions '
                                    'where your opponent is less comfortable, '
                                    'utilizing their own opening choices '
                                    'against them.',
                         'fen': None}],
        'order_index': 78},
    {   'slug': 'the-rule-of-the-square',
        'title': 'The Rule of the Square',
        'description': 'Master the crucial concept of the Rule of the Square '
                       'to dominate pawn endgames.',
        'difficulty': 'Expert',
        'xp_reward': 50,
        'steps': [   {   'order_index': 1,
                         'content': '<strong>The Rule of the Square</strong> '
                                    'states that a pawn can promote if it can '
                                    'enter a square defined by its own '
                                    "position and the opposing king's "
                                    'position. <em>Understanding this rule is '
                                    'essential in pawn endgames.</em>',
                         'fen': None},
                     {   'order_index': 2,
                         'content': '<strong>Visualizing the Square:</strong> '
                                    'To visualize the square, draw a square '
                                    "from the pawn's position to the eighth "
                                    "rank and the opposing king's position. If "
                                    'the king is outside this square, the pawn '
                                    'can promote. <em>Practice this '
                                    'visualization with different '
                                    'positions.</em>',
                         'fen': '8/5p2/8/8/8/8/5K2/8 w - - 0 1'},
                     {   'order_index': 3,
                         'content': '<strong>Example Scenario:</strong> In the '
                                    'position where White has a pawn on f5 and '
                                    'the Black king on e7, can the pawn '
                                    'promote? <em>Use the Rule of the Square '
                                    'to determine the outcome.</em>',
                         'fen': '8/5p2/8/8/8/8/5K2/8 w - - 0 1'},
                     {   'order_index': 4,
                         'content': '<strong>Advanced Application:</strong> In '
                                    'more complex positions, consider the '
                                    'opposition and how it affects the square. '
                                    '<em>Analyze positions where both players '
                                    'have pawns and apply the Rule of the '
                                    'Square to find winning strategies.</em>',
                         'fen': '8/5p2/8/8/5k2/8/5P2/8 w - - 0 1'}],
        'order_index': 79},
    {   'slug': 'key-squares-opposition',
        'title': 'Key Squares & Opposition',
        'description': 'Master the art of king and pawn endgames by '
                       'understanding key squares and the concept of '
                       'opposition.',
        'difficulty': 'Expert',
        'xp_reward': 50,
        'steps': [   {   'order_index': 1,
                         'content': '<strong>Key Squares</strong> are critical '
                                    'squares that a king must control to '
                                    'promote a pawn. <em>Understanding these '
                                    'squares can make the difference between '
                                    'winning and losing.</em>',
                         'fen': '8/5p2/8/8/8/8/5K2/8 w - - 0 1'},
                     {   'order_index': 2,
                         'content': 'In a king and pawn endgame, '
                                    '<strong>opposition</strong> occurs when '
                                    'two kings stand on the same rank, file, '
                                    'or diagonal with an odd number of squares '
                                    'between them. <em>This allows one player '
                                    'to control the movement of the '
                                    'other.</em>',
                         'fen': '8/5p2/8/8/8/8/5K2/8 w - - 0 1'},
                     {   'order_index': 3,
                         'content': '<strong>Direct Opposition</strong> is '
                                    'when the kings face each other with no '
                                    'squares in between. <em>This is a '
                                    'powerful position as it allows you to '
                                    'dictate the game.</em>',
                         'fen': '8/5p2/8/8/8/8/5K2/8 w - - 0 1'},
                     {   'order_index': 4,
                         'content': '<strong>Diagonal Opposition</strong> '
                                    'occurs when the kings are separated by '
                                    'one square diagonally. <em>This can still '
                                    'be advantageous, but requires careful '
                                    'maneuvering.</em>',
                         'fen': '8/5p2/8/8/8/8/5K2/8 w - - 0 1'}],
        'order_index': 80},
    {   'slug': 'triangulation',
        'title': 'Triangulation',
        'description': 'Master the art of losing a tempo to gain a strategic '
                       'advantage in endgames.',
        'difficulty': 'Expert',
        'xp_reward': 50,
        'steps': [   {   'order_index': 1,
                         'content': '<strong>Triangulation</strong> is a '
                                    'technique used in endgames to <em>gain '
                                    'the opposition</em> by moving your king '
                                    'in a triangular path, effectively losing '
                                    'a tempo to reposition yourself favorably.',
                         'fen': '8/5k2/8/8/8/8/5K2/8 w - - 0 1'},
                     {   'order_index': 2,
                         'content': 'In this position, <strong>White</strong> '
                                    'can triangulate by moving the king to '
                                    '<em>f3</em>, then to <em>e4</em>, and '
                                    'finally back to <em>f3</em> to maintain '
                                    'the opposition against the black king.',
                         'fen': '8/5k2/8/8/8/8/5K2/8 w - - 0 1'},
                     {   'order_index': 3,
                         'content': 'Practice this concept by trying to find '
                                    'the best triangulation moves for '
                                    '<strong>White</strong> in the following '
                                    'position, ensuring you understand how '
                                    'losing a tempo can lead to a winning '
                                    'position.',
                         'fen': '8/5k2/8/8/8/8/5K2/8 w - - 0 1'}],
        'order_index': 81},
    {   'slug': 'zugzwang',
        'title': 'Zugzwang',
        'description': 'Explore the intricacies of zugzwang, where any move '
                       'you make worsens your position.',
        'difficulty': 'Expert',
        'xp_reward': 50,
        'steps': [   {   'order_index': 1,
                         'content': '<strong>Zugzwang</strong> is a situation '
                                    'in chess where a player is put at a '
                                    'disadvantage because they must make a '
                                    'move, even though they would prefer to '
                                    'pass. <em>Understanding this concept is '
                                    "crucial for exploiting your opponent's "
                                    'weaknesses.</em>',
                         'fen': '8/5p2/8/8/8/8/5P2/7K w - - 0 1'},
                     {   'order_index': 2,
                         'content': "In this position, it is White's turn to "
                                    'move. <strong>White is in '
                                    'zugzwang</strong> as any move will lead '
                                    'to a losing position. <em>Analyze the '
                                    'consequences of each possible move.</em>',
                         'fen': '8/5p2/8/8/8/8/5P2/7K w - - 0 1'},
                     {   'order_index': 3,
                         'content': 'Consider the following position where '
                                    'Black is in zugzwang. <strong>Black must '
                                    'move, and all moves lead to a '
                                    'disadvantage.</strong> <em>Identify the '
                                    'best move for White to capitalize on this '
                                    'situation.</em>',
                         'fen': '8/5p2/8/8/8/8/5P2/7K b - - 0 1'},
                     {   'order_index': 4,
                         'content': 'Now, practice creating a zugzwang '
                                    'position. <strong>Set up a position where '
                                    'your opponent is forced to move into a '
                                    'losing scenario.</strong> <em>Share your '
                                    'position with your coach for '
                                    'feedback.</em>',
                         'fen': None}],
        'order_index': 82},
    {   'slug': 'philidor-position',
        'title': 'Philidor Position',
        'description': 'Master the art of drawing in rook endgames with the '
                       'Philidor Position.',
        'difficulty': 'Expert',
        'xp_reward': 50,
        'steps': [   {   'order_index': 1,
                         'content': '<strong>Welcome to the Philidor Position '
                                    'lesson!</strong> In this lesson, you will '
                                    'learn how to defend against a rook and '
                                    'pawn endgame using the <em>Philidor '
                                    'Position</em> technique.',
                         'fen': '8/8/8/8/8/5k2/5P2/6R1 w - - 0 1'},
                     {   'order_index': 2,
                         'content': '<strong>Understanding the Setup:</strong> '
                                    'The Philidor Position occurs when the '
                                    'defending king is placed in front of the '
                                    'pawn, and the rook is positioned behind '
                                    'it. This setup is crucial for achieving a '
                                    'draw.',
                         'fen': '8/8/8/8/8/5k2/5P2/6R1 w - - 0 1'},
                     {   'order_index': 3,
                         'content': '<strong>Key Defensive Moves:</strong> To '
                                    'maintain the Philidor Position, move your '
                                    'rook to the 6th rank to cut off the '
                                    "opposing king's access to the pawn. This "
                                    'will help you keep the pawn in check '
                                    'while your king defends.',
                         'fen': '8/8/8/8/8/5k2/5P2/6R1 w - - 0 1'},
                     {   'order_index': 4,
                         'content': '<strong>Practice the Draw:</strong> Try '
                                    'to hold the position against various pawn '
                                    'placements. Remember, the key is to keep '
                                    'your king in front of the pawn and your '
                                    'rook behind it to secure a draw.',
                         'fen': '8/8/8/8/8/5k2/5P2/6R1 w - - 0 1'}],
        'order_index': 83},
    {   'slug': 'lucena-position',
        'title': 'Lucena Position',
        'description': 'Master the Lucena Position to secure victory in rook '
                       'endgames.',
        'difficulty': 'Expert',
        'xp_reward': 50,
        'steps': [   {   'order_index': 1,
                         'content': '<strong>The Lucena Position</strong> is a '
                                    'fundamental winning technique in rook '
                                    'endgames. It occurs when the player with '
                                    "the extra pawn can create a 'bridge' with "
                                    'their rook to promote the pawn, while the '
                                    'defending side struggles to stop it. '
                                    '<em>Understanding this position is '
                                    'crucial for converting endgame '
                                    'advantages.</em>',
                         'fen': '8/5p2/8/8/8/8/5R1P/6K1 w - - 0 1'},
                     {   'order_index': 2,
                         'content': '<strong>Key Moves</strong>: In the Lucena '
                                    'Position, the winning side plays <em>1. '
                                    'Rf6</em> to cut off the defending king. '
                                    'This move is essential to create the '
                                    'bridge for the pawn. Practice this move '
                                    'and understand how to follow up '
                                    'effectively.',
                         'fen': '8/5p2/8/8/8/8/5R1P/6K1 w - - 0 1'},
                     {   'order_index': 3,
                         'content': '<strong>Defensive Techniques</strong>: '
                                    'The defending player must try to block '
                                    "the pawn's advance. However, if the "
                                    'winning side executes the Lucena '
                                    'correctly, the defense becomes nearly '
                                    'impossible. <em>Learn how to recognize '
                                    'when the Lucena is achievable.</em>',
                         'fen': '8/5p2/8/8/8/8/5R1P/6K1 w - - 0 1'},
                     {   'order_index': 4,
                         'content': '<strong>Practice Scenarios</strong>: Set '
                                    'up the Lucena Position on your board and '
                                    'practice both sides. Try to find the '
                                    'winning moves for the side with the extra '
                                    'pawn and the best defensive strategies '
                                    'for the other side. <em>Repetition will '
                                    'help solidify your understanding.</em>',
                         'fen': '8/5p2/8/8/8/8/5R1P/6K1 w - - 0 1'}],
        'order_index': 84},
    {   'slug': 'vancura-position',
        'title': 'Vancura Position',
        'description': 'Master the intricacies of the Vancura Position to '
                       'enhance your Flank Defense strategy.',
        'difficulty': 'Expert',
        'xp_reward': 50,
        'steps': [   {   'order_index': 1,
                         'content': '<strong>The Vancura Position</strong> is '
                                    'a critical endgame scenario where the '
                                    'defending side must utilize their pieces '
                                    'effectively to hold a draw against a pawn '
                                    'majority. <em>Understanding this position '
                                    'can significantly improve your defensive '
                                    'skills.</em>',
                         'fen': '8/5p1p/6p1/8/8/5P1P/5K2/8 w - - 0 1'},
                     {   'order_index': 2,
                         'content': '<strong>Key Defensive '
                                    'Techniques:</strong> In the Vancura '
                                    'Position, the defending king should aim '
                                    'to block the advancing pawns while '
                                    'coordinating with the remaining pieces. '
                                    '<em>Always keep an eye on the '
                                    "opposition's pawn structure.</em>",
                         'fen': '8/5p1p/6p1/8/8/5P1P/5K2/8 w - - 0 1'},
                     {   'order_index': 3,
                         'content': '<strong>Practice Scenario:</strong> Set '
                                    'up the Vancura Position on your board and '
                                    'try to hold the draw against various pawn '
                                    'structures. <em>Focus on the placement of '
                                    'your king and how it interacts with the '
                                    'pawns.</em>',
                         'fen': '8/5p1p/6p1/8/8/5P1P/5K2/8 w - - 0 1'}],
        'order_index': 85},
    {   'slug': 'bishop-vs-knight-endgames',
        'title': 'Bishop vs. Knight Endgames',
        'description': 'Master the intricacies of endgames involving bishops '
                       'and knights to secure victory in challenging '
                       'positions.',
        'difficulty': 'Expert',
        'xp_reward': 50,
        'steps': [   {   'order_index': 1,
                         'content': '<strong>Understanding the '
                                    'Strengths:</strong> In endgames, '
                                    '<em>bishops</em> control long diagonals '
                                    'and can dominate pawns on one side, while '
                                    '<em>knights</em> excel in maneuvering '
                                    'around pawns on both sides. Recognizing '
                                    'these strengths is crucial for effective '
                                    'play.',
                         'fen': None},
                     {   'order_index': 2,
                         'content': '<strong>Key Concepts:</strong> When pawns '
                                    'are on one side of the board, the bishop '
                                    'can often control them effectively. '
                                    'However, when pawns are on both sides, '
                                    "the knight's ability to jump can become "
                                    'more advantageous. <em>Practice '
                                    'positioning your pieces to maximize their '
                                    'strengths.</em>',
                         'fen': '8/8/8/8/8/2p5/1P6/1K6 w - - 0 1'},
                     {   'order_index': 3,
                         'content': '<strong>Practical Example:</strong> In '
                                    'the position below, analyze how the '
                                    'bishop can control the pawn on the b6 '
                                    'square while the knight must maneuver to '
                                    'threaten the a7 pawn. <em>Consider how to '
                                    'promote your pawn effectively.</em>',
                         'fen': '8/8/8/8/1P6/1K6/8/8 w - - 0 1'},
                     {   'order_index': 4,
                         'content': '<strong>Final Challenge:</strong> Set up '
                                    'a position with pawns on both sides and '
                                    'play out the endgame. <em>Can you convert '
                                    'your advantage into a win?</em>',
                         'fen': '8/8/8/8/1P6/1K6/8/8 w - - 0 1'}],
        'order_index': 86},
    {   'slug': 'opposite-colored-bishops',
        'title': 'Opposite Colored Bishops',
        'description': 'Master the nuances of endgames with opposite colored '
                       'bishops and learn how to draw in seemingly losing '
                       'positions.',
        'difficulty': 'Expert',
        'xp_reward': 50,
        'steps': [   {   'order_index': 1,
                         'content': '<strong>Understanding Opposite Colored '
                                    'Bishops:</strong> In endgames where both '
                                    'players have bishops on opposite colors, '
                                    'the player with the extra pawn often '
                                    'cannot win. <em>Learn to maneuver your '
                                    'pieces to create drawing chances.</em>',
                         'fen': '8/8/8/8/8/8/5p2/5B1K w - - 0 1'},
                     {   'order_index': 2,
                         'content': '<strong>Key Defensive '
                                    'Techniques:</strong> Use your bishop to '
                                    'control critical squares and prevent the '
                                    'enemy king from advancing. <em>Stay close '
                                    'to your pawns to maintain their '
                                    'defense.</em>',
                         'fen': '8/8/8/8/8/5p2/5B1K/8 w - - 0 1'},
                     {   'order_index': 3,
                         'content': '<strong>Creating Stalemate '
                                    'Opportunities:</strong> In some '
                                    'positions, you can force a stalemate by '
                                    'carefully positioning your pieces. '
                                    '<em>Look for ways to limit your '
                                    "opponent's options.</em>",
                         'fen': '8/8/8/8/8/5p2/5B1K/8 w - - 0 1'},
                     {   'order_index': 4,
                         'content': '<strong>Practice Makes Perfect:</strong> '
                                    'Set up various positions with opposite '
                                    'colored bishops and practice finding the '
                                    'drawing method. <em>Each position '
                                    'presents unique challenges!</em>',
                         'fen': '8/8/8/8/8/5p2/5B1K/8 w - - 0 1'}],
        'order_index': 87},
    {   'slug': 'queen-vs-pawn-on-7th',
        'title': 'Queen vs. Pawn on 7th',
        'description': 'Master the endgame scenario of a queen facing a pawn '
                       'on the 7th rank to secure a theoretical win or draw.',
        'difficulty': 'Expert',
        'xp_reward': 50,
        'steps': [   {   'order_index': 1,
                         'content': '<strong>Understanding the '
                                    'Position:</strong> In this endgame '
                                    'scenario, the queen is positioned to '
                                    'control key squares while the pawn is one '
                                    "step away from promotion. <em>It's "
                                    'crucial to understand how to use the '
                                    'queen effectively to prevent the pawn '
                                    'from promoting.</em>',
                         'fen': '8/5p2/8/8/8/8/8/5Q2 w - - 0 1'},
                     {   'order_index': 2,
                         'content': '<strong>Key Moves:</strong> The queen can '
                                    "move to cut off the pawn's advance. "
                                    '<em>Identify the squares where the queen '
                                    "can control the pawn's path and limit its "
                                    'options.</em>',
                         'fen': '8/5p2/8/8/8/8/8/5Q2 w - - 0 1'},
                     {   'order_index': 3,
                         'content': '<strong>Forcing the Draw:</strong> If the '
                                    'pawn promotes, the queen must be ready to '
                                    'check the new piece. <em>Learn how to '
                                    'position the queen to create a stalemate '
                                    'or force a draw in case of '
                                    'promotion.</em>',
                         'fen': '8/5p2/8/8/8/8/8/5Q2 w - - 0 1'},
                     {   'order_index': 4,
                         'content': '<strong>Practice Scenario:</strong> Set '
                                    'up the board and practice various moves '
                                    'with the queen against the pawn. '
                                    '<em>Focus on finding the best moves to '
                                    'either win or draw the game.</em>',
                         'fen': '8/5p2/8/8/8/8/8/5Q2 w - - 0 1'}],
        'order_index': 88},
    {   'slug': 'pawn-breakthroughs',
        'title': 'Pawn Breakthroughs',
        'description': 'Master the art of sacrificing pawns in endgames to '
                       'create winning chances.',
        'difficulty': 'Expert',
        'xp_reward': 50,
        'steps': [   {   'order_index': 1,
                         'content': '<strong>Pawn breakthroughs</strong> are '
                                    'crucial in endgames, as they can open up '
                                    'lines for your pieces and create passed '
                                    'pawns. <em>Understanding when to '
                                    'sacrifice a pawn can turn the tide of the '
                                    'game.</em>',
                         'fen': '8/8/8/8/8/5p2/5P2/7K w - - 0 1'},
                     {   'order_index': 2,
                         'content': '<strong>Consider the position:</strong> '
                                    'If your opponent has a strong king, '
                                    'sometimes sacrificing a pawn to distract '
                                    'them can be beneficial. <em>Look for '
                                    'opportunities to create a passed '
                                    'pawn.</em>',
                         'fen': '8/8/8/8/8/5p2/5P2/7K b - - 0 1'},
                     {   'order_index': 3,
                         'content': '<strong>Example scenario:</strong> If you '
                                    'can promote a pawn by sacrificing '
                                    'another, it may be worth it. <em>Evaluate '
                                    'the trade-offs carefully.</em>',
                         'fen': '8/8/8/8/8/5P2/5K2/8 w - - 0 1'},
                     {   'order_index': 4,
                         'content': '<strong>Practice this:</strong> Set up a '
                                    'position where you can sacrifice a pawn '
                                    'to create a passed pawn and win the game. '
                                    '<em>Try to visualize the endgame before '
                                    'making your move.</em>',
                         'fen': '8/8/8/8/8/6p1/5K2/8 w - - 0 1'}],
        'order_index': 89},
    {   'slug': 'the-immortal-game',
        'title': 'The Immortal Game',
        'description': 'Explore one of the most famous chess games ever '
                       'played, showcasing brilliant tactics and sacrifices.',
        'difficulty': 'Expert',
        'xp_reward': 50,
        'steps': [   {   'order_index': 1,
                         'content': '<strong>Welcome to the Immortal '
                                    'Game!</strong> In this lesson, we will '
                                    'analyze the legendary match between '
                                    '<em>Anderssen</em> and '
                                    '<em>Kieseritzky</em>, where bold '
                                    'sacrifices lead to a stunning victory.',
                         'fen': None},
                     {   'order_index': 2,
                         'content': '<strong>Step 1:</strong> The game begins '
                                    'with <em>1.e4 e5 2.Nf3 d6 3.Bc4</em>. '
                                    'This opening sets the stage for '
                                    'aggressive play. Analyze the position and '
                                    'consider the potential threats against '
                                    "Black's f7 pawn.",
                         'fen': 'rnbqkb1r/ppp2ppp/3p4/4p3/2B5/5N2/PPP2PPP/RNBQK2R '
                                'w KQkq - 0 1'},
                     {   'order_index': 3,
                         'content': '<strong>Step 2:</strong> After '
                                    '<em>3...Nf6</em>, Anderssen plays '
                                    '<em>4.Ng5</em>, attacking the f7 pawn '
                                    'directly. Discuss the implications of '
                                    'this move and how Black should respond.',
                         'fen': 'rnbqkb1r/ppp2ppp/5n2/4p3/2B5/5N2/PPP2PPP/RNBQK2R '
                                'w KQkq - 0 2'},
                     {   'order_index': 4,
                         'content': '<strong>Step 3:</strong> Following '
                                    '<em>4...d5</em>, Anderssen sacrifices his '
                                    'knight with <em>5.exd5</em>. Evaluate the '
                                    'position and predict the next moves '
                                    'leading to the famous checkmate pattern.',
                         'fen': 'rnbqkb1r/ppp2ppp/5n2/4p3/4P3/5N2/PPP2PPP/RNBQK2R '
                                'w KQkq - 0 3'}],
        'order_index': 90},
    {   'slug': 'the-evergreen-game',
        'title': 'The "Evergreen Game"',
        'description': 'Dive into one of the most beautiful games in chess '
                       'history, showcasing brilliant tactics and sacrifices.',
        'difficulty': 'Expert',
        'xp_reward': 50,
        'steps': [   {   'order_index': 1,
                         'content': '<strong>Step 1:</strong> In this '
                                    'position, <em>Anderssen</em> sacrifices '
                                    'his bishop to lure the black king into '
                                    'the open. Can you find the best move for '
                                    'White?',
                         'fen': 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w '
                                'KQkq - 0 1'},
                     {   'order_index': 2,
                         'content': '<strong>Step 2:</strong> After the '
                                    'sacrifice, <em>Anderssen</em> plays a '
                                    'stunning move that puts pressure on the '
                                    'black king. What is the move?',
                         'fen': 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w '
                                'KQkq - 0 1'},
                     {   'order_index': 3,
                         'content': '<strong>Step 3:</strong> As the game '
                                    'progresses, <em>Anderssen</em> continues '
                                    'to build an attack. Identify the next '
                                    'critical move that leads to a forced '
                                    'checkmate.',
                         'fen': 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w '
                                'KQkq - 0 1'},
                     {   'order_index': 4,
                         'content': '<strong>Step 4:</strong> Finally, witness '
                                    'the stunning checkmate that concludes '
                                    'this legendary game. Can you visualize '
                                    'the final position?',
                         'fen': 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w '
                                'KQkq - 0 1'}],
        'order_index': 91},
    {   'slug': 'morphys-opera-house-game',
        'title': "Morphy's Opera House Game",
        'description': "Explore the brilliance of Paul Morphy's tactical "
                       'genius in this iconic game played in an opera house.',
        'difficulty': 'Expert',
        'xp_reward': 50,
        'steps': [   {   'order_index': 1,
                         'content': '<strong>Step 1:</strong> In this opening '
                                    'phase, Morphy develops his pieces '
                                    'rapidly, aiming for control of the '
                                    'center. <em>Focus on developing knights '
                                    'before bishops and controlling key '
                                    'squares.</em>',
                         'fen': 'rnbqkb1r/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w '
                                'KQkq - 0 1'},
                     {   'order_index': 2,
                         'content': '<strong>Step 2:</strong> Notice how '
                                    'Morphy sacrifices material for rapid '
                                    'development. <em>Evaluate the importance '
                                    'of piece activity over material in the '
                                    'opening.</em>',
                         'fen': 'rnbqkb1r/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w '
                                'KQkq - 0 1'},
                     {   'order_index': 3,
                         'content': '<strong>Step 3:</strong> As the game '
                                    'progresses, Morphy creates threats '
                                    'against the enemy king. <em>Learn to '
                                    'identify tactical opportunities that '
                                    'arise from piece coordination.</em>',
                         'fen': 'rnbqkb1r/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w '
                                'KQkq - 0 1'},
                     {   'order_index': 4,
                         'content': '<strong>Step 4:</strong> In the final '
                                    'phase, Morphy delivers a stunning '
                                    'checkmate. <em>Understand the principles '
                                    'of checkmating patterns and how to '
                                    'execute them effectively.</em>',
                         'fen': 'rnbqkb1r/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w '
                                'KQkq - 0 1'}],
        'order_index': 92},
    {   'slug': 'the-game-of-the-century',
        'title': 'The Game of the Century',
        'description': "Explore the brilliance of Bobby Fischer's legendary "
                       'sacrifice that changed the course of chess history.',
        'difficulty': 'Expert',
        'xp_reward': 50,
        'steps': [   {   'order_index': 1,
                         'content': "<strong>Introduction to Fischer's "
                                    'Sacrifice:</strong> In this lesson, we '
                                    'will analyze the pivotal moment in the '
                                    '1956 game between <em>Bobby Fischer</em> '
                                    'and <em>Donald Byrne</em>, where Fischer '
                                    'executed a stunning sacrifice that '
                                    'showcased his tactical genius.',
                         'fen': None},
                     {   'order_index': 2,
                         'content': "<strong>Position Analysis:</strong> Let's "
                                    'examine the position after 17...Nxe4. '
                                    "Fischer's knight sacrifice on e4 is not "
                                    'just a tactical shot; it opens up lines '
                                    'for his pieces and puts immense pressure '
                                    "on White's position.",
                         'fen': 'r1bq1rk1/ppp2ppp/2n5/3p1p3/3P4/2N2N2/PPP2PPP/R1BQ1RK1 '
                                'w - - 0 18'},
                     {   'order_index': 3,
                         'content': '<strong>Understanding the '
                                    'Sacrifice:</strong> After the sacrifice, '
                                    'White must respond carefully. The best '
                                    'move is to capture the knight, but this '
                                    'leads to a series of forced moves that '
                                    "highlight Fischer's tactical vision.",
                         'fen': 'r1bq1rk1/ppp2ppp/2n5/3p1p3/3P4/2N2N2/PPP2PPP/R1BQ1RK1 '
                                'b - - 0 18'},
                     {   'order_index': 4,
                         'content': '<strong>Final Position:</strong> After '
                                    'the sequence of moves, we reach a '
                                    "critical position where Fischer's pieces "
                                    'are poised for an attack. Analyze how the '
                                    'sacrifice leads to a winning advantage '
                                    'for Black.',
                         'fen': 'r1bq1rk1/ppp2ppp/2n5/3p1p3/3P4/2N2N2/PPP2PPP/R1BQ1RK1 '
                                'b - - 0 18'}],
        'order_index': 93},
    {   'slug': 'kasparovs-immortal',
        'title': "Kasparov's Immortal",
        'description': "Dive into the brilliance of Garry Kasparov's strategic "
                       'genius through an analysis of his legendary game '
                       'against Veselin Topalov.',
        'difficulty': 'Expert',
        'xp_reward': 50,
        'steps': [   {   'order_index': 1,
                         'content': '<strong>Step 1:</strong> Analyze the '
                                    'opening moves of the game. <em>Kasparov '
                                    'played the Sicilian Defense, which is '
                                    'known for its complexity and '
                                    'counter-attacking potential.</em>',
                         'fen': 'rnbqkb1r/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w '
                                'KQkq - 0 1'},
                     {   'order_index': 2,
                         'content': '<strong>Step 2:</strong> Focus on the '
                                    'critical moment when Kasparov sacrifices '
                                    'material for a strong initiative. '
                                    '<em>Understanding the value of piece '
                                    'activity over material is key in this '
                                    'position.</em>',
                         'fen': 'rnbqkb1r/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w '
                                'KQkq - 0 1'},
                     {   'order_index': 3,
                         'content': '<strong>Step 3:</strong> Examine the '
                                    'tactical motifs that arise from '
                                    "Kasparov's sacrifices. <em>Look for "
                                    'patterns like pins, forks, and discovered '
                                    'attacks that lead to a winning '
                                    'position.</em>',
                         'fen': 'rnbqkb1r/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w '
                                'KQkq - 0 1'},
                     {   'order_index': 4,
                         'content': '<strong>Step 4:</strong> Conclude with '
                                    'the final moves leading to checkmate. '
                                    "<em>Reflect on how Kasparov's foresight "
                                    'and understanding of the position allowed '
                                    'him to execute a brilliant finish.</em>',
                         'fen': 'rnbqkb1r/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w '
                                'KQkq - 0 1'}],
        'order_index': 94},
    {   'slug': 'carlsens-endgame-squeeze',
        'title': "Carlsen's Endgame Squeeze",
        'description': 'Master the art of converting minimal advantages into '
                       'victory, just like Magnus Carlsen.',
        'difficulty': 'Expert',
        'xp_reward': 50,
        'steps': [   {   'order_index': 1,
                         'content': '<strong>Understanding the concept of '
                                    "'Water from a Stone'</strong>: This "
                                    'refers to the ability to extract maximum '
                                    'value from a seemingly insignificant '
                                    'advantage in an endgame scenario. '
                                    '<em>Carlsen often demonstrates this skill '
                                    'by patiently maneuvering his pieces to '
                                    'create winning chances from minimal '
                                    'resources.</em>',
                         'fen': '8/5p2/5k2/8/8/8/8/7K w - - 0 1'},
                     {   'order_index': 2,
                         'content': '<strong>Step 1: Identify the winning '
                                    'plan</strong>: In this position, your '
                                    'goal is to promote your pawn while '
                                    'keeping the enemy king at bay. <em>Focus '
                                    'on creating a zugzwang situation where '
                                    'your opponent has no good moves.</em>',
                         'fen': '8/5p2/5k2/8/8/8/8/7K w - - 0 1'},
                     {   'order_index': 3,
                         'content': '<strong>Step 2: Execute the '
                                    'plan</strong>: Move your king closer to '
                                    'the pawn while keeping the opposing king '
                                    'restricted. <em>Remember, every move '
                                    'should aim to improve your position '
                                    'incrementally.</em>',
                         'fen': '8/5p2/5k2/8/8/8/8/7K w - - 0 1'},
                     {   'order_index': 4,
                         'content': '<strong>Step 3: Promote the '
                                    'pawn</strong>: Once the enemy king is '
                                    'sufficiently restricted, advance your '
                                    'pawn to promotion. <em>Ensure that your '
                                    'king is in a position to support the new '
                                    'queen.</em>',
                         'fen': '8/5P2/5k2/8/8/8/8/7K w - - 0 1'}],
        'order_index': 95},
    {   'slug': 'psychological-chess',
        'title': 'Psychological Chess',
        'description': 'Master the art of playing your opponent, leveraging '
                       'their psychology to gain a strategic advantage.',
        'difficulty': 'Expert',
        'xp_reward': 50,
        'steps': [   {   'order_index': 1,
                         'content': '<strong>Understanding Your '
                                    'Opponent:</strong> <em>Recognize their '
                                    'playing style and tendencies. Are they '
                                    'aggressive or defensive? Use this '
                                    'knowledge to anticipate their moves.</em>',
                         'fen': None},
                     {   'order_index': 2,
                         'content': '<strong>Creating Doubt:</strong> <em>Make '
                                    'unexpected moves that challenge your '
                                    "opponent's confidence. This can lead them "
                                    'to make mistakes under pressure.</em>',
                         'fen': None},
                     {   'order_index': 3,
                         'content': '<strong>Body Language and Time '
                                    'Management:</strong> <em>Observe your '
                                    "opponent's reactions and manage your own "
                                    'time wisely. A calm demeanor can unsettle '
                                    'a nervous opponent.</em>',
                         'fen': None},
                     {   'order_index': 4,
                         'content': '<strong>Endgame Psychology:</strong> '
                                    '<em>In the endgame, maintain focus and '
                                    'avoid overconfidence. Your opponent may '
                                    'capitalize on any sign of '
                                    'complacency.</em>',
                         'fen': None}],
        'order_index': 96},
    {   'slug': 'time-management',
        'title': 'Time Management',
        'description': 'Master the art of managing your time effectively in '
                       'both blitz and classical chess games.',
        'difficulty': 'Expert',
        'xp_reward': 50,
        'steps': [   {   'order_index': 1,
                         'content': '<strong>Understanding Time '
                                    'Management:</strong> In chess, <em>time '
                                    'is as crucial as material</em>. Learn how '
                                    'to balance your time across different '
                                    'formats.',
                         'fen': None},
                     {   'order_index': 2,
                         'content': '<strong>Blitz vs Classical:</strong> '
                                    '<em>Blitz games</em> require quick '
                                    'decision-making, while <em>classical '
                                    'games</em> allow for deeper analysis. '
                                    'Practice adapting your thought process '
                                    'accordingly.',
                         'fen': None},
                     {   'order_index': 3,
                         'content': '<strong>Time Allocation:</strong> '
                                    'Allocate your time wisely; spend more '
                                    'time on critical positions and less on '
                                    'obvious moves. <em>Identify key '
                                    'moments</em> in the game where time '
                                    'management can make a difference.',
                         'fen': None},
                     {   'order_index': 4,
                         'content': '<strong>Practice Drills:</strong> Engage '
                                    'in timed drills to simulate blitz '
                                    'conditions and practice making decisions '
                                    'under pressure. <em>Analyze your '
                                    'performance</em> to improve your time '
                                    'usage.',
                         'fen': None}],
        'order_index': 97},
    {   'slug': 'the-masters-mindset',
        'title': "The Master's Mindset",
        'description': 'Dive deep into the art of calculating variations like '
                       'a grandmaster.',
        'difficulty': 'Expert',
        'xp_reward': 50,
        'steps': [   {   'order_index': 1,
                         'content': '<strong>Calculation Trees</strong> are '
                                    'essential for evaluating positions in '
                                    'chess. <em>Understanding how to visualize '
                                    'and analyze multiple variations</em> will '
                                    'elevate your game to new heights.',
                         'fen': None},
                     {   'order_index': 2,
                         'content': '<strong>Step 1:</strong> Start by '
                                    'identifying the best move in the current '
                                    "position. <em>Consider your opponent's "
                                    'possible responses and how you will '
                                    'react.</em>',
                         'fen': 'rnbqkb1r/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w '
                                'KQkq - 0 1'},
                     {   'order_index': 3,
                         'content': '<strong>Step 2:</strong> Create a '
                                    '<em>visual tree</em> of possible moves '
                                    'and responses. Each branch represents a '
                                    'different line of play. <strong>Practice '
                                    'visualizing at least three moves '
                                    'ahead.</strong>',
                         'fen': 'rnbqkb1r/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w '
                                'KQkq - 0 1'},
                     {   'order_index': 4,
                         'content': '<strong>Step 3:</strong> Analyze the '
                                    'resulting positions from your calculation '
                                    'tree. <em>Evaluate which lines lead to '
                                    'favorable outcomes and which do not.</em> '
                                    'This will help you refine your '
                                    'decision-making process.',
                         'fen': None}],
        'order_index': 98}]

PUZZLES = [
    {"fen": "8/8/8/8/3Q4/8/6K1/2k5 w - - 0 1", "solution": "d4c5", "theme": "Checkmate", "difficulty": "Beginner", "rating": 800, "xp_reward": 10},
    {"fen": "r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/2N2N2/PPPP1PPP/R1BQK2R w KQkq - 0 1", "solution": "e1g1,e8g8", "theme": "Opening", "difficulty": "Intermediate", "rating": 1200, "xp_reward": 20},
]

ACHIEVEMENTS = [
    {"code": "first_win", "title": "First Blood", "description": "Win your first game.", "icon": "fa-trophy", "xp_reward": 50, "requirement_type": "wins", "requirement_value": 1},
    {"code": "wins_10", "title": "Rising Star", "description": "Win 10 games.", "icon": "fa-star", "xp_reward": 200, "requirement_type": "wins", "requirement_value": 10},
    {"code": "games_played_50", "title": "Veteran", "description": "Play 50 games total.", "icon": "fa-shield-alt", "xp_reward": 500, "requirement_type": "games_played", "requirement_value": 50},
    {"code": "study_streak_3", "title": "Dedicated Scholar", "description": "Maintain a 3-day study streak.", "icon": "fa-book", "xp_reward": 100, "requirement_type": "study_streak", "requirement_value": 3},
    {"code": "study_streak_7", "title": "Grandmaster Apprentice", "description": "Maintain a 7-day study streak.", "icon": "fa-fire", "xp_reward": 500, "requirement_type": "study_streak", "requirement_value": 7},
    {"code": "xp_5000", "title": "XP Hoarder", "description": "Accumulate 5,000 XP.", "icon": "fa-coins", "xp_reward": 0, "requirement_type": "xp", "requirement_value": 5000},
]

THEMES = [
    {"code": "default", "theme_type": "BOARD", "name": "Classic Wood", "description": "The default classic wood board.", "price_xp": 0, "css_class": "board-classic"},
    {"code": "neon", "theme_type": "BOARD", "name": "Cyberpunk Neon", "description": "A futuristic neon glowing board.", "price_xp": 1000, "css_class": "board-neon"},
    {"code": "obsidian", "theme_type": "BOARD", "name": "Dark Obsidian", "description": "A sleek, dark obsidian board.", "price_xp": 2000, "css_class": "board-obsidian"},
    {"code": "marble", "theme_type": "BOARD", "name": "Roman Marble", "description": "An elegant marble finish.", "price_xp": 5000, "css_class": "board-marble"},
]


def upgrade() -> None:
    conn = op.get_bind()

    for lesson in LESSONS:
        exists = conn.execute(
            sa.select(lessons_t.c.id).where(lessons_t.c.slug == lesson["slug"])
        ).first()
        if exists:
            continue
        fields = {k: v for k, v in lesson.items() if k != "steps"}
        conn.execute(sa.insert(lessons_t).values(**fields))
        lesson_id = conn.execute(
            sa.select(lessons_t.c.id).where(lessons_t.c.slug == lesson["slug"])
        ).scalar_one()
        for step in lesson["steps"]:
            conn.execute(sa.insert(lesson_steps_t).values(lesson_id=lesson_id, **step))

    for puzzle in PUZZLES:
        exists = conn.execute(
            sa.select(puzzles_t.c.id).where(puzzles_t.c.fen == puzzle["fen"])
        ).first()
        if not exists:
            conn.execute(sa.insert(puzzles_t).values(**puzzle))

    for achievement in ACHIEVEMENTS:
        exists = conn.execute(
            sa.select(achievements_t.c.id).where(achievements_t.c.code == achievement["code"])
        ).first()
        if not exists:
            conn.execute(sa.insert(achievements_t).values(**achievement))

    for theme in THEMES:
        exists = conn.execute(
            sa.select(themes_t.c.id).where(themes_t.c.code == theme["code"])
        ).first()
        if not exists:
            conn.execute(sa.insert(themes_t).values(**theme))


def downgrade() -> None:
    conn = op.get_bind()

    lesson_ids = [
        row[0]
        for row in conn.execute(
            sa.select(lessons_t.c.id).where(
                lessons_t.c.slug.in_([lesson["slug"] for lesson in LESSONS])
            )
        )
    ]
    if lesson_ids:
        conn.execute(sa.delete(lesson_steps_t).where(lesson_steps_t.c.lesson_id.in_(lesson_ids)))
        conn.execute(sa.delete(lessons_t).where(lessons_t.c.id.in_(lesson_ids)))

    conn.execute(sa.delete(puzzles_t).where(puzzles_t.c.fen.in_([p["fen"] for p in PUZZLES])))
    conn.execute(sa.delete(achievements_t).where(achievements_t.c.code.in_([a["code"] for a in ACHIEVEMENTS])))
    conn.execute(sa.delete(themes_t).where(themes_t.c.code.in_([t["code"] for t in THEMES])))
