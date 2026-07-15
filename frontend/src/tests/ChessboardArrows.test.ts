import { toChessboardArrows } from '@/lib/chessboardArrows';

describe('toChessboardArrows', () => {
  it('converts legacy academy arrow tuples to react-chessboard v5 objects', () => {
    expect(toChessboardArrows([
      ['c7', 'e8'],
      ['c7', 'a8', '#ff0000'],
    ])).toEqual([
      { startSquare: 'c7', endSquare: 'e8', color: '#ffaa00' },
      { startSquare: 'c7', endSquare: 'a8', color: '#ff0000' },
    ]);
  });

  it('drops malformed arrows before they reach the chessboard renderer', () => {
    expect(toChessboardArrows([
      ['e2'],
      ['', 'e4'],
      ['z9', 'e4'],
      ['e2', 'e4'],
    ])).toEqual([
      { startSquare: 'e2', endSquare: 'e4', color: '#ffaa00' },
    ]);
  });
});
