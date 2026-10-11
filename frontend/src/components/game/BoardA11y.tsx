'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useRef, type ReactNode } from 'react';


/**
 * react-chessboard renders every piece as an unnamed `role="button"`. This
 * wrapper gives each one an accessible name ("White knight, g1") and keeps it
 * current as pieces move, without changing the board's layout (display: contents).
 */
export default function BoardA11y({ children }: { children: ReactNode }) {
  const t = useTranslations('Game');
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const label = () => {
      root.querySelectorAll<HTMLElement>('[role="button"][aria-roledescription="draggable"]').forEach((node) => {
        const piece = node.querySelector<HTMLElement>('[data-piece]')?.dataset.piece;
        const square = node.closest<HTMLElement>('[data-square]')?.dataset.square;
        if (!piece || !square) return;
        const names: Record<string, string> = {
          wp: t('board_wp'), wn: t('board_wn'), wb: t('board_wb'), wr: t('board_wr'), wq: t('board_wq'), wk: t('board_wk'),
          bp: t('board_bp'), bn: t('board_bn'), bb: t('board_bb'), br: t('board_br'), bq: t('board_bq'), bk: t('board_bk'),
        };
        const name = names[piece.toLowerCase()];
        if (!name) return;
        const next = `${name}, ${square}`;
        if (node.getAttribute('aria-label') !== next) node.setAttribute('aria-label', next);
      });
    };
    label();
    const observer = new MutationObserver(label);
    observer.observe(root, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [t]);
  return <div ref={ref} style={{ display: 'contents' }}>{children}</div>;
}
