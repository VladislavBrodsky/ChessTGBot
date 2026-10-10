# Chess Screenshot to FEN: What the Image Cannot Tell You

A screenshot shows the pieces. A usable FEN also needs the turn, castling rights and move context.

Draft for review · Intended publication 8 October 2026 · Web3Chess Editorial

A chess screenshot shows the pieces, not the whole position. To turn one into a usable FEN, import the image into a board editor, check every piece, then confirm whose turn it is and which special moves remain legal. Those details can change the answer even when the board looks identical.

On 7 October, Lichess announced image import for its Board Editor. That useful shortcut raises a separate chess question: once the pieces are placed, what information must a player confirm? This is a Lichess feature, not a Web3Chess feature.

## Turn a screenshot into a usable FEN

Lichess Board Editor now offers a “From image” import. It can place pieces from a picture, but the original game record remains the authority for move context. Use this short check before copying the FEN:

- Import the picture into the Board Editor. Check its orientation and every recognised piece against the source image.
- Confirm the side to move and castling rights from the original game or puzzle; do not infer them from piece placement.
- Check whether the immediately preceding pawn move created an en passant target. Set the move counters from the record when available.
- Copy the completed FEN and compare the legal moves with the source game. Keep the PGN or game link for the history FEN cannot store.

## Start with the player who moves next

Imagine a board with White's king on e1 and pawn on e4, and Black's king on e8 and pawn on e5. Neither pawn can advance into the occupied square ahead. White and Black have different king moves available, and the player to move determines whose decision you are analysing. A cropped image without a turn label leaves that question unanswered.

```text
4k3/8/8/4p3/4P3/8/8/4K3 w - - 0 1
```

A constructed practice position: White to move. Keep the same pieces and change the active colour to compare Black's options.

## Do not infer castling rights from the picture

A king or rook can leave its starting square and return. The board then looks familiar, but the lost castling right does not return with the piece. Position history matters.

In the example below, the stored rights allow White to castle either way: the paths are clear and the relevant squares are not attacked. Change the rights field to a dash, leaving every piece untouched, and those castling moves disappear. An image of the pieces cannot distinguish those two records.

```text
r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1
```

Constructed castling exercise. Compare this record with the identical placement using no castling rights.

## Check the last pawn move

En passant is another place where the previous move changes the options. In this exercise, Black has just advanced a pawn from d7 to d5, beside White's pawn on e5. White may capture en passant on d6 now. If the pawn reached d5 earlier and that immediate chance has passed, the same piece placement does not permit the capture.

```text
4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 2
```

White can play exd6 en passant in this constructed record. Compare the legal moves after replacing d6 with a dash.

## Read the record beyond the pieces

Forsyth–Edwards Notation, or FEN, stores six fields: piece placement, active colour, castling availability, en passant target, halfmove clock and fullmove number. The final counters record move context; a FEN alone does not provide the full game history. If you are reviewing a real game, retain its move record too.

## Try a two minute verification drill

Choose one of the exercises above. Copy the position into a trusted analysis tool, change only the relevant field, and compare the legal moves. Write one sentence explaining why a move appeared or vanished. This teaches a useful habit: validate the question before calculating the answer.

Before sharing a chess screenshot, add whose turn it is and preserve the game link or complete position record. Better context makes the next player's analysis more useful.

## Sources

- [Lichess dated update about Board Editor image import](https://lichess.org/feed#2026-10-07-20:30)
- [Lichess Board Editor with From image import](https://lichess.org/editor)
- [Portable Game Notation specification, FEN fields](https://www.saremba.de/chessgml/standards/pgn/pgn-complete.htm#c16.1)
- [chess.js position and legal-move documentation](https://jhlywa.github.io/chess.js/)

[Explore the Academy](https://web3chess.online/academy)
