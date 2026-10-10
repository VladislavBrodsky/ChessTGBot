'use client';

import { useEffect, useRef, type ReactNode } from 'react';

const PIECES: Record<string, string> = { p: 'pawn', n: 'knight', b: 'bishop', r: 'rook', q: 'queen', k: 'king' };

/**
 * react-chessboard renders every piece as an unnamed `role="button"`. This
 * wrapper gives each one an accessible name ("White knight, g1") and keeps it
 * current as pieces move, without changing the board's layout (display: contents).
 */
export default function BoardA11y({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const label = () => {
      root.querySelectorAll<HTMLElement>('[role="button"][aria-roledescription="draggable"]').forEach((node) => {
        const piece = node.querySelector<HTMLElement>('[data-piece]')?.dataset.piece;
        const square = node.closest<HTMLElement>('[data-square]')?.dataset.square;
        if (!piece || !square) return;
        const next = `${piece[0] === 'w' ? 'White' : 'Black'} ${PIECES[piece[1].toLowerCase()] ?? 'piece'}, ${square}`;
        if (node.getAttribute('aria-label') !== next) node.setAttribute('aria-label', next);
      });
    };
    label();
    const observer = new MutationObserver(label);
    observer.observe(root, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);
  return <div ref={ref} style={{ display: 'contents' }}>{children}</div>;
}
