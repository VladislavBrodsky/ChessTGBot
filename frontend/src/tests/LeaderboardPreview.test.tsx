import { act, fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import LeaderboardPreview from '@/components/leaderboard/LeaderboardPreview';
import { PREVIEW_FRAME_INTERVAL_MS } from '@/lib/leaderboardPreview';
import mockEnglishMessages from '@/messages/en.json';

let mockReducedMotion = false;
let mockOSReducedMotion = false;
jest.mock('@/context/ReducedMotionContext', () => ({ useReducedMotionPreference: () => ({ reducedMotion: mockReducedMotion }) }));
jest.mock('next-intl', () => ({
  useLocale: () => 'en',
  useTranslations: (namespace: string) => {
    const catalog = (mockEnglishMessages as unknown as Record<string, Record<string, string>>)[namespace];
    return (key: string, values: Record<string, unknown> = {}) => {
      if (!catalog[key]) throw new Error(`Missing ${namespace}.${key}`);
      return catalog[key].replace(/\{(\w+)\}/g, (_match: string, name: string) => String(values[name] ?? name));
    };
  },
}));
jest.mock('framer-motion', () => ({
  useReducedMotion: () => mockOSReducedMotion,
  animate: (_from: number, to: number, options: { onUpdate: (value: number) => void; onComplete: () => void }) => {
    options.onUpdate(to); options.onComplete(); return { stop: jest.fn() };
  },
  motion: { li: ({ children, layout: _layout, initial: _initial, transition: _transition, ...props }: any) => <li {...props}>{children}</li>,
    span: ({ children, initial: _initial, animate: _animate, transition, ...props }: any) => <span data-motion-duration={transition?.duration} {...props}>{children}</span>,
    div: ({ children, layout: _layout, layoutId: _layoutId, initial: _initial, animate: _animate, transition: _transition, ...props }: any) => <div {...props}>{children}</div> },
}));

const rows = () => [...document.querySelectorAll('[data-preview-profile]')].map(row => ({ id: row.getAttribute('data-preview-profile'), text: row.textContent }));

describe('LeaderboardPreview controls', () => {
  beforeEach(() => {
    jest.useFakeTimers(); mockReducedMotion = false; mockOSReducedMotion = false;
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' });
  });
  afterEach(() => { jest.useRealTimers(); });

  it('discloses the simulation, shows ten profiles and switches from GRAM to XP', () => {
    render(<LeaderboardPreview />);
    expect(screen.getByText(/Fictional profiles and generated portraits/)).toBeVisible();
    expect(screen.getByText(/No accounts, transactions or rewards are created/)).toBeVisible();
    expect(rows()).toHaveLength(10);
    expect(new Set(rows().map(row => row.id)).size).toBe(10);
    expect(rows().every(row => row.text?.includes('GRAM'))).toBe(true);
    expect(screen.queryByText(/TON/)).not.toBeInTheDocument();
    expect(document.querySelectorAll('img[src$="gram.svg"]')).toHaveLength(10);
    expect(document.querySelectorAll('[data-preview-daily-gain]')).toHaveLength(10);
    expect(document.querySelector('[data-preview-score]')).toHaveAccessibleName(/^\+\d+ GRAM$/);
    fireEvent.click(screen.getByRole('tab', { name: 'Scholars · XP' }));
    expect(rows().every(row => row.text?.includes('XP'))).toBe(true);
    expect(document.querySelector('img[src$="gram.svg"]')).not.toBeInTheDocument();
  });

  it('pauses rankings, supports a manual day and resets without creating account data', () => {
    render(<LeaderboardPreview />);
    fireEvent.click(screen.getByRole('button', { name: 'Pause' }));
    const before = rows();
    act(() => { jest.advanceTimersByTime(PREVIEW_FRAME_INTERVAL_MS * 3); });
    expect(rows()).toEqual(before);
    fireEvent.click(screen.getByRole('button', { name: 'Advance one day' }));
    expect(screen.getByText('Simulated day 2')).toBeVisible();
    expect(rows()).not.toEqual(before);
    fireEvent.click(screen.getByRole('button', { name: 'Reset' }));
    expect(rows()).toEqual(before);
  });

  it.each(['app', 'OS'])('stops automatic updates for the %s reduced-motion preference', preference => {
    mockReducedMotion = preference === 'app'; mockOSReducedMotion = preference === 'OS';
    render(<LeaderboardPreview />);
    const before = rows();
    expect(screen.getByRole('button', { name: 'Play simulation' })).toBeDisabled();
    act(() => { jest.advanceTimersByTime(PREVIEW_FRAME_INTERVAL_MS * 3); });
    expect(rows()).toEqual(before);
    fireEvent.click(screen.getByRole('button', { name: 'Advance one day' }));
    expect(rows()).not.toEqual(before);
    document.querySelectorAll('[data-preview-daily-gain]').forEach(gain => expect(gain).toHaveAttribute('data-motion-duration', '0'));
  });

  it('does not advance while the browser tab is hidden and resumes without catching up', () => {
    render(<LeaderboardPreview />);
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' });
    act(() => { document.dispatchEvent(new Event('visibilitychange')); });
    const before = rows();
    act(() => { jest.advanceTimersByTime(PREVIEW_FRAME_INTERVAL_MS * 3); });
    expect(rows()).toEqual(before);
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' });
    act(() => { document.dispatchEvent(new Event('visibilitychange')); });
    act(() => { jest.advanceTimersByTime(PREVIEW_FRAME_INTERVAL_MS); });
    expect(rows()).not.toEqual(before);
  });

  it('suspends offscreen updates and cleans up the timer when the preview closes', () => {
    const original = window.IntersectionObserver;
    let observerCallback: IntersectionObserverCallback;
    const disconnect = jest.fn();
    window.IntersectionObserver = jest.fn((callback: IntersectionObserverCallback) => {
      observerCallback = callback;
      return { observe: jest.fn(), disconnect };
    }) as unknown as typeof IntersectionObserver;
    try {
      const { unmount } = render(<LeaderboardPreview />);
      const before = rows();
      act(() => { observerCallback([{ isIntersecting: false }] as IntersectionObserverEntry[], {} as IntersectionObserver); });
      act(() => { jest.advanceTimersByTime(PREVIEW_FRAME_INTERVAL_MS * 3); });
      expect(rows()).toEqual(before);
      act(() => { observerCallback([{ isIntersecting: true }] as IntersectionObserverEntry[], {} as IntersectionObserver); });
      act(() => { jest.advanceTimersByTime(PREVIEW_FRAME_INTERVAL_MS); });
      expect(rows()).not.toEqual(before);
      unmount();
      expect(disconnect).toHaveBeenCalled();
      expect(jest.getTimerCount()).toBe(0);
    } finally { window.IntersectionObserver = original; }
  });
});
