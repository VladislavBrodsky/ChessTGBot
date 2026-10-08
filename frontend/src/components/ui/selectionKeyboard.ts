import type { KeyboardEvent } from 'react';

/** Roving focus for horizontal selectors, respecting the document direction. */
export function selectionKeyboard(event: KeyboardEvent<HTMLButtonElement>, index: number, count: number, select: (index: number) => void) {
  const rtl = event.currentTarget.closest('[dir]')?.getAttribute('dir') === 'rtl';
  let next: number;
  if (event.key === 'Home') next = 0;
  else if (event.key === 'End') next = count - 1;
  else if (event.key === 'ArrowRight') next = (index + (rtl ? -1 : 1) + count) % count;
  else if (event.key === 'ArrowLeft') next = (index + (rtl ? 1 : -1) + count) % count;
  else return;
  event.preventDefault();
  select(next);
  const buttons = event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role="tab"]');
  buttons?.[next]?.focus();
}
