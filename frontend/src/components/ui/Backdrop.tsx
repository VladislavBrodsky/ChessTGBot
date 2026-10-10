import { FaChessBishop, FaChessKnight, FaChessQueen, FaChessRook } from 'react-icons/fa';

/**
 * Decorative page backdrop for full-screen entry surfaces (login, invite, auth splash): a masked grid, a tilted
 * checkerboard, two soft glows and four chess pieces. Pure CSS, theme tokens only (works in dark, light and nebula),
 * transform-only motion on two pieces, and every loop is removed by the reduced-motion rules.
 * Put it first inside a `relative overflow-hidden` container and lift the real content with `relative z-10`.
 */
export function Backdrop({ still = false }: { still?: boolean }) {
  return (
    <div className="ui-backdrop" aria-hidden="true" data-still={still || undefined}>
      <div className="ui-backdrop__grid" />
      <div className="ui-backdrop__board" />
      <div className="ui-backdrop__glow ui-backdrop__glow--a" />
      <div className="ui-backdrop__glow ui-backdrop__glow--b" />
      <FaChessQueen className="ui-backdrop__piece ui-backdrop__piece--queen fx-float" size={30} />
      <FaChessBishop className="ui-backdrop__piece ui-backdrop__piece--bishop" size={22} />
      <FaChessKnight className="ui-backdrop__piece ui-backdrop__piece--knight fx-float fx-float--late" size={26} />
      <FaChessRook className="ui-backdrop__piece ui-backdrop__piece--rook" size={20} />
    </div>
  );
}
