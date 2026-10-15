'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, type KeyboardEvent, type ReactNode } from 'react';
import { telegramHaptic } from '@/lib/telegram';

export interface PickerOption<T extends string | number> { value: T; label: ReactNode; ariaLabel?: string }

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || document.documentElement.dataset.reduceMotion === 'true');

/**
 * Horizontal snap carousel for choosing one value (stake, time control). The option nearest the centre is the
 * selected one: swipe and it ticks (haptic) as each option crosses the centre; tap an option to centre it; arrow
 * keys, Home and End work too. Options scale with distance from the centre, the edges fade out with a mask (so it
 * sits on any surface in every theme), and nothing is ever hidden behind a wrap: every option is reachable by scrolling.
 */
export function SnapPicker<T extends string | number>({ id, label, icon, hint, options, value, onChange, itemWidth = 72 }: {
  id: string;
  label: ReactNode;
  icon?: ReactNode;
  hint?: ReactNode;
  options: PickerOption<T>[];
  value: T;
  onChange: (value: T) => void;
  itemWidth?: number;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const frame = useRef(0);
  const programmatic = useRef(true); // true until the first centring has settled
  const settle = useRef<number | undefined>(undefined);
  const fromScroll = useRef(false);
  const everCentered = useRef(false);
  const selectedIndex = Math.max(0, options.findIndex(option => option.value === value));

  const selectedIndexRef = useRef(selectedIndex);
  selectedIndexRef.current = selectedIndex;

  const centreOn = useCallback((index: number, smooth: boolean) => {
    const track = trackRef.current;
    const item = itemRefs.current[index];
    if (!track || !item) return;
    const t = track.getBoundingClientRect();
    const r = item.getBoundingClientRect();
    const delta = r.left + r.width / 2 - (t.left + t.width / 2);
    if (Math.abs(delta) < 1) { window.clearTimeout(settle.current); programmatic.current = false; return; } // already centred: user scrolls count again
    const animate = smooth && !prefersReducedMotion();
    programmatic.current = true;
    window.clearTimeout(settle.current);
    settle.current = window.setTimeout(() => { programmatic.current = false; }, animate ? 500 : 120);
    track.scrollBy({ left: delta, behavior: animate ? 'smooth' : 'auto' });
  }, []);

  // Centre the selection on mount (instantly) and whenever it changes from outside the carousel (a tap, restored state).
  useLayoutEffect(() => {
    if (fromScroll.current) { fromScroll.current = false; return; }
    centreOn(selectedIndex, everCentered.current);
    everCentered.current = true;
  }, [selectedIndex, centreOn]);

  // Keep the selection centred if the layout width changes (rotation, split view, fonts loading).
  useEffect(() => {
    const track = trackRef.current;
    if (!track || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() => centreOn(selectedIndexRef.current, false));
    observer.observe(track);
    return () => observer.disconnect();
  }, [centreOn]);

  useEffect(() => () => { window.cancelAnimationFrame(frame.current); window.clearTimeout(settle.current); }, []);

  const onScroll = useCallback(() => {
    if (frame.current) return;
    frame.current = window.requestAnimationFrame(() => {
      frame.current = 0;
      const track = trackRef.current;
      if (!track) return;
      const t = track.getBoundingClientRect();
      const centre = t.left + t.width / 2;
      let nearest = 0;
      let nearestDistance = Infinity;
      itemRefs.current.forEach((item, index) => {
        if (!item) return;
        const r = item.getBoundingClientRect();
        const distance = Math.abs(r.left + r.width / 2 - centre);
        item.style.setProperty('--dist', String(Math.min(1, distance / (itemWidth * 1.6))));
        if (distance < nearestDistance) { nearestDistance = distance; nearest = index; }
      });
      if (!programmatic.current && nearest !== selectedIndex) {
        fromScroll.current = true;
        telegramHaptic('selection');
        onChange(options[nearest].value);
      }
    });
  }, [itemWidth, onChange, options, selectedIndex]);

  // Initial distance styling (before any scroll event) so the first paint already shows the lens effect.
  useLayoutEffect(() => { onScroll(); }, [onScroll, selectedIndex]);

  const choose = (index: number) => {
    const clamped = Math.max(0, Math.min(options.length - 1, index));
    telegramHaptic('light');
    onChange(options[clamped].value);
    centreOn(clamped, true);
    itemRefs.current[clamped]?.focus({ preventScroll: true });
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const rtl = getComputedStyle(event.currentTarget).direction === 'rtl';
    const step = event.key === 'ArrowRight' ? (rtl ? -1 : 1) : event.key === 'ArrowLeft' ? (rtl ? 1 : -1) : 0;
    if (step) { event.preventDefault(); choose(selectedIndex + step); }
    else if (event.key === 'Home') { event.preventDefault(); choose(0); }
    else if (event.key === 'End') { event.preventDefault(); choose(options.length - 1); }
  };

  return (
    <section className="snap-picker" aria-labelledby={`${id}-label`}>
      <div className="lobby-group__label">
        <span id={`${id}-label`}>{icon}{label}</span>
        {hint}
      </div>
      <div className="snap-picker__viewport">
        <div
          ref={trackRef}
          className="snap-picker__track"
          role="radiogroup"
          aria-labelledby={`${id}-label`}
          onScroll={onScroll}
          onKeyDown={onKeyDown}
          style={{ ['--snap-item' as string]: `${itemWidth}px` }}
        >
          {options.map((option, index) => (
            <button
              key={String(option.value)}
              ref={element => { itemRefs.current[index] = element; }}
              type="button"
              role="radio"
              aria-checked={index === selectedIndex}
              aria-label={option.ariaLabel}
              tabIndex={index === selectedIndex ? 0 : -1}
              className="snap-picker__item"
              onClick={() => choose(index)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
