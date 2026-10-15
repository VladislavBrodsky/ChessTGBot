# Can You Castle If Your Rook Is Attacked? Three Tests

DRAFT FOR REVIEW · English · Intended publication 15 October 2026 · Not published

By Web3Chess Editorial · 3 min read · 636 words including captions

Check the king's route, then distinguish lost rights from temporary obstacles.

Yes, you can castle when your rook is attacked, provided every castling condition is satisfied. The king's route is the critical route: an attack on the rook's square alone does not forbid the move. Three small positions below separate that rule from two common lookalikes. They are constructed exercises in standard chess, not positions from a recent tournament.

## Check the right, the gap and the route

FIDE's castling rule distinguishes a lost right from a temporary obstacle. Moving the king loses both castling rights; moving a rook loses the right on that side. Returning the piece does not restore the right. Pieces between king and rook prevent castling for now. So does an attack on the king's starting square, crossing square or destination.

- Right: has this king or this rook moved before?
- Gap: is every square between king and rook empty?
- Route: are the king's starting, crossing and finishing squares free from enemy attack?

For White's kingside castle, inspect e1, f1 and g1. For White's queenside castle, inspect e1, d1 and c1. Queenside b1 must be empty, but an enemy attack on b1 alone does not ban castling. For Black, use the corresponding squares on rank 8. These examples assume standard chess; Chess960 needs its own setup rules.

## Exercise 1: the rook is attacked

Constructed exercise: White to move, kingside castling right retained. Black's rook on h8 attacks h1. Is O-O legal?

`4k2r/8/8/8/8/8/8/4K2R w K - 0 1`

Answer: yes. Trace the black rook's open h-file to h1, then inspect e1, f1 and g1 separately. None of those three king squares is attacked. White can play O-O, placing the king on g1 and rook on f1. The rook escapes the h-file attack as part of the castle. This establishes legality in this exercise; it is not an engine claim that castling is the strongest move.

## Exercise 2: the crossing square is attacked

Constructed exercise: White to move, kingside castling right retained. Black's rook has moved from h8 to f8. Test O-O again.

`4kr2/8/8/8/8/8/8/4K2R w K - 0 1`

Answer: no. White's king is not currently in check on e1, and g1 is not attacked. But the rook on f8 attacks f1, the square the king must cross. A safe-looking destination does not make that crossing legal. Try naming the blocked condition before choosing a different move: the right remains, the gap is clear, but the route fails.

## Exercise 3: an attacked square the king never uses

Constructed exercise: White to move, queenside castling right retained. Black's rook on b8 attacks b1. Is O-O-O legal?

`1r2k3/8/8/8/8/8/8/R3K3 w Q - 0 1`

Answer: yes. The rook on b8 controls b1, but White's king travels from e1 through d1 to c1. Those king squares are safe, and b1, c1 and d1 are empty. After O-O-O, White's king is on c1 and rook on d1. Do not apply the king's attack restriction to every square between the pieces.

## Now change history without changing the picture

Reload exercise 1, then remove White's kingside castling right from the position record. The same pieces still occupy the same squares, but O-O is no longer legal. That is why a screenshot cannot establish that a king or rook has never moved. For a real game, keep the move record. Do not give a position castling rights just because its pieces look ready.

## A two-minute replay drill

Set up the three exercises in a board editor that supports castling rights. Before requesting legal moves, write yes or no and name the deciding square. Then test O-O, O-O and O-O-O respectively. Finally, repeat the first position with no castling rights. Your answer sequence should be yes, no, yes, no. If an answer differs, check the side to move and rights field before recalculating.

Use a short question in your next game: do I still have the right, is the gap clear, and is the king's route safe? Legal and strategically wise are separate decisions.

Sources: [FIDE Laws of Chess, Articles 3.8.2 and 3.9](https://handbook.fide.com/chapter/E012023), [chess.js: legal moves and castling rights](https://jhlywa.github.io/chess.js/)

[Explore the Academy](https://web3chess.online/academy)
