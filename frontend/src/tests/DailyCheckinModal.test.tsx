import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import React from 'react';
import DailyCheckinModal from '@/components/DailyCheckinModal';

// apiFetch: return a claimable status, then a successful claim.
const apiFetch = jest.fn((url: string, _opts?: unknown): Promise<{ ok: boolean; json: () => Promise<unknown> }> => {
  if (url.includes('/daily-checkin/status')) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        can_claim_today: true,
        current_streak: 1,
        last_checkin_date: null,
        rewards: [100, 150, 200, 250, 300, 350, 500],
      }),
    });
  }
  // claim
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ new_streak: 2 }),
  });
});
jest.mock('@/lib/api', () => ({ apiFetch: (url: string, opts?: unknown) => apiFetch(url, opts) }));

jest.mock('@/lib/telegram', () => ({
  telegramHaptic: jest.fn(),
  telegramAlert: jest.fn(),
}));

jest.mock('@/context/NavbarContext', () => ({
  useNavbar: () => ({ pushHide: jest.fn(), popHide: jest.fn() }),
}));

jest.mock('@/hooks/useDialogAccessibility', () => ({
  useDialogAccessibility: () => ({ current: null }),
}));

jest.mock('react-confetti', () => () => null);

jest.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  motion: {
    div: React.forwardRef(function MotionDiv(
      { children, className, onClick, role, ...rest }: React.HTMLAttributes<HTMLDivElement>,
      ref: React.Ref<HTMLDivElement>,
    ) {
      return <div ref={ref} className={className} onClick={onClick} role={role} {...stripMotionProps(rest)}>{children}</div>;
    }),
    button: ({ children, className, onClick, disabled }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
      <button className={className} onClick={onClick} disabled={disabled}>{children}</button>
    ),
  },
}));

// framer-motion animation-only props must not leak onto real DOM nodes.
function stripMotionProps(props: Record<string, unknown>) {
  const { initial, animate, exit, transition, whileHover, whileTap, ...rest } = props as any;
  void initial; void animate; void exit; void transition; void whileHover; void whileTap;
  return rest;
}

beforeAll(() => {
  // jsdom has no Audio
  (global as any).Audio = jest.fn().mockImplementation(() => ({ play: () => Promise.resolve() }));
});

beforeEach(() => {
  apiFetch.mockClear();
});

describe('DailyCheckinModal', () => {
  it('lets the user dismiss the modal after claiming (no dead-end trap)', async () => {
    render(<DailyCheckinModal />);

    // Opens because the day is claimable.
    const claimBtn = await screen.findByRole('button', { name: /claim reward/i });
    expect(screen.getByRole('button', { name: /skip for now/i })).toBeInTheDocument();

    // Claim the reward.
    await act(async () => {
      fireEvent.click(claimBtn);
    });

    // Button flips to "Come back tomorrow"; the "Skip for now" escape hatch is gone.
    const comeBackBtn = await screen.findByRole('button', { name: /come back tomorrow/i });
    expect(screen.queryByRole('button', { name: /skip for now/i })).toBeNull();

    // The regression: this button must now CLOSE the modal, not be a disabled no-op.
    expect(comeBackBtn).not.toBeDisabled();
    await act(async () => {
      fireEvent.click(comeBackBtn);
    });

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /come back tomorrow/i })).toBeNull();
    });
    expect(screen.queryByText(/daily reward/i)).toBeNull();
  });

  it('renders one 7-day grid with a double-width day 7 and moves "today" correctly after claiming', async () => {
    // Claim response without new_streak must not turn the streak into NaN (every day showed locked).
    apiFetch.mockImplementation((url: string) => url.includes('/daily-checkin/status')
      ? Promise.resolve({ ok: true, json: () => Promise.resolve({ can_claim_today: true, current_streak: 1, last_checkin_date: null, rewards: [100, 150, 200, 250, 300, 350, 500] }) })
      : Promise.resolve({ ok: true, json: () => Promise.resolve({ status: 'success' }) }));
    render(<DailyCheckinModal />);
    const claimBtn = await screen.findByRole('button', { name: /claim reward/i });

    const days = screen.getAllByRole('listitem');
    expect(days).toHaveLength(7);
    expect(days[0].closest('ol')).toBe(days[6].closest('ol'));
    expect(days[6]).toHaveClass('reward-day--big');
    expect(days[0]).toHaveClass('reward-day--past');
    expect(days[1]).toHaveAttribute('aria-current', 'date');
    expect(days[1]).toHaveTextContent('150 XP');

    await act(async () => { fireEvent.click(claimBtn); });
    await screen.findByRole('button', { name: /come back tomorrow/i });

    // Day 2 is now claimed; day 3 is tomorrow's locked day, not a highlighted "current" day.
    expect(days[1]).toHaveClass('reward-day--past');
    expect(days[2]).toHaveClass('reward-day--future');
    expect(screen.getAllByRole('listitem').some(day => day.hasAttribute('aria-current'))).toBe(false);
  });

  it('focuses the dialog panel, not the close button, when it opens on its own', async () => {
    render(<DailyCheckinModal />);
    await screen.findByRole('button', { name: /claim reward/i });
    expect(screen.getByRole('dialog')).toHaveFocus();
  });
});

jest.mock('next-intl', () => ({
  useTranslations: (namespace: string) => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const messages = require('../messages/en.json');
    return (key: string, values: Record<string, unknown> = {}) => messages[namespace][key].replace(/\{(\w+)\}/g, (_match: string, name: string) => String(values[name] ?? name));
  },
}));
