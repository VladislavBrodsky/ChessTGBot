import '@testing-library/jest-dom';
import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import ActiveGame from '@/components/game/ActiveGame';
import { logTelemetryEvent } from '@/lib/telemetry';

// A friend challenges the player to a stake. The player has to be able to cover
// it: when they cannot, the confirmation offers a Top up path instead of a
// rejection that vanishes, and consent to the stake stays explicit throughout.

let mockConsent: { game_id: string; wager: number; time_control: number } | null = null;
let mockError: string | null = null;
let mockBalance = 0;
let mockBalanceError = false;
const acceptWager = jest.fn();
const syncBalance = jest.fn().mockResolvedValue({});

jest.mock('next-intl', () => ({
  useLocale: () => 'en',
  useTranslations: () => (key: string, values?: Record<string, string | number>) =>
    values ? `${key}:${Object.values(values).join(':')}` : key,
}));
jest.mock('next/navigation', () => ({ useRouter: () => ({ push: jest.fn(), replace: jest.fn() }) }));
jest.mock('next/link', () => ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>);
jest.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  motion: { div: ({ children }: { children: React.ReactNode }) => <div>{children}</div> },
}));
jest.mock('@/components/LayoutWrapper', () => ({ children }: { children: React.ReactNode }) => <>{children}</>);
jest.mock('@/components/game/ChessBoard', () => () => null);
jest.mock('@/components/game/ChessClockBadge', () => () => null);
jest.mock('@/components/game/MatchOverModal', () => () => null);
jest.mock('@/components/game/RematchChoiceDrawer', () => () => null);
jest.mock('@/components/game/IncomingRematchDrawer', () => () => null);
jest.mock('@/components/game/active', () => ({
  GamePlayerCard: () => null, WaitingOpponentCard: () => null, MoveHistoryRail: () => null,
  GameActionBar: () => null, ConfirmActionDrawer: () => null,
  GameCrashOverlay: ({ show }: { show: boolean }) => show ? <div data-testid="crash-overlay" /> : null,
  getMovesSanList: () => [],
}));
jest.mock('@/components/ui/Modal', () => ({
  Modal: ({ isOpen, children, title }: { isOpen: boolean; children: React.ReactNode; title: string }) =>
    isOpen ? <div role="dialog" aria-label={title}>{children}</div> : null,
}));
jest.mock('@/components/Wallet/WalletDialogs', () => ({
  DepositDialog: (p: { chosenWager: number; walletBalance: number; onClose: () => void; onSuccess: () => void }) =>
    <div role="dialog" aria-label="Deposit" data-wager={p.chosenWager} data-balance={p.walletBalance}>
      <button onClick={p.onSuccess}>deposit-success</button>
      <button onClick={p.onClose}>deposit-close</button>
    </div>,
}));
jest.mock('@/hooks/useGameSocket', () => ({
  useGameSocket: () => ({ fen: 'start', makeMove: jest.fn(), isConnected: true, error: mockError, gameState: null, wagerConsent: mockConsent, acceptWager }),
}));
jest.mock('@/hooks/useAudioSynth', () => ({ useAudioSynth: () => ({ playTickSound: jest.fn() }) }));
jest.mock('@/hooks/useAudio', () => ({ useAudio: () => ({ play: jest.fn() }) }));
jest.mock('@/context/NavbarContext', () => ({ useNavbarHide: () => ({ hideNavbar: jest.fn(), showNavbar: jest.fn() }) }));
jest.mock('@/context/UserContext', () => ({
  useUser: () => ({ walletBalance: mockBalance, syncBalance, loadingBalance: false, balanceError: mockBalanceError }),
}));
jest.mock('@/lib/socket', () => ({ getSocket: () => ({ on: jest.fn(), off: jest.fn(), emit: jest.fn() }) }));
jest.mock('@/lib/api', () => ({ apiFetch: jest.fn().mockResolvedValue({ ok: true, json: async () => ({}) }), getFullPhotoUrl: (p: string) => p }));
jest.mock('@/lib/telegram', () => ({ telegramHaptic: jest.fn(), telegramAlert: jest.fn() }));
jest.mock('@/lib/clipboard', () => ({ copyToClipboard: jest.fn() }));
jest.mock('@/lib/botRevenge', () => ({ requestBotRevengeGame: jest.fn() }));
jest.mock('@/lib/telemetry', () => ({ logTelemetryEvent: jest.fn() }));

const STAKE = 500;
const events = (name: string) => (logTelemetryEvent as jest.Mock).mock.calls.filter(([n]) => n === name);
const view = () => render(<ActiveGame gameId="friend-game" />);

beforeEach(() => {
  mockConsent = { game_id: 'friend-game', wager: STAKE, time_control: 600 };
  mockError = null;
  mockBalance = 0;
  mockBalanceError = false;
});
afterEach(() => jest.clearAllMocks());

it('lets a player who can cover the stake join, with no top-up in the way', () => {
  mockBalance = 1000;
  view();
  expect(screen.getByRole('button', { name: 'friend_join_stake_action:$5.00' })).toBeInTheDocument();
  expect(screen.queryByText(/friend_join_topup/)).not.toBeInTheDocument();
  expect(events('invite_topup_shown')).toHaveLength(0);
});

it('replaces Join with a Top up for exactly the shortfall when the balance cannot cover the stake', () => {
  mockBalance = 100;
  const { rerender } = view();
  expect(screen.getByText('friend_join_topup_hint:$4.00')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'friend_join_topup_action:$4.00' })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /friend_join_stake_action/ })).not.toBeInTheDocument();
  rerender(<ActiveGame gameId="friend-game" />);
  expect(events('invite_topup_shown')).toEqual([['invite_topup_shown', { wager_cents: STAKE, shortfall_cents: 400 }]]);
});

it('opens the deposit for the stake, returns to the confirmation, and never joins on its own', () => {
  mockBalance = 100;
  view();
  fireEvent.click(screen.getByRole('button', { name: 'friend_join_topup_action:$4.00' }));
  expect(events('invite_topup_tapped')).toEqual([['invite_topup_tapped', { wager_cents: STAKE, shortfall_cents: 400 }]]);
  const deposit = screen.getByRole('dialog', { name: 'Deposit' });
  expect(deposit).toHaveAttribute('data-wager', String(STAKE));
  expect(deposit).toHaveAttribute('data-balance', '100');
  expect(screen.queryByRole('dialog', { name: 'friend_join_stake_title' })).not.toBeInTheDocument();

  fireEvent.click(screen.getByText('deposit-success'));
  expect(syncBalance).toHaveBeenCalled();
  fireEvent.click(screen.getByText('deposit-close'));
  expect(screen.getByRole('dialog', { name: 'friend_join_stake_title' })).toBeInTheDocument();
  expect(acceptWager).not.toHaveBeenCalled();
});

it('offers Join again once the balance covers the stake, and joining stays an explicit tap', () => {
  mockBalance = 100;
  const { rerender } = view();
  mockBalance = 600;
  rerender(<ActiveGame gameId="friend-game" />);
  expect(screen.queryByText(/friend_join_topup/)).not.toBeInTheDocument();
  expect(acceptWager).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'friend_join_stake_action:$5.00' }));
  expect(acceptWager).toHaveBeenCalledTimes(1);
});

describe('when the balance cannot be read', () => {
  it('lets the server decide, then keeps offering Top up after its rejection has faded', async () => {
    mockBalanceError = true;
    const { rerender } = view();
    expect(screen.getByRole('button', { name: 'friend_join_stake_action:$5.00' })).toBeInTheDocument();

    mockError = 'Insufficient funds. Please top up your Web3 Wallet.';
    await act(async () => { rerender(<ActiveGame gameId="friend-game" />); });
    expect(screen.getByRole('button', { name: 'friend_join_topup_action:$5.00' })).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(syncBalance).toHaveBeenCalled();

    // The socket hook clears its error after three seconds; the offer must outlive it.
    mockError = null;
    await act(async () => { rerender(<ActiveGame gameId="friend-game" />); });
    expect(screen.getByRole('button', { name: 'friend_join_topup_action:$5.00' })).toBeInTheDocument();
  });

  it('still shows other join errors as errors', async () => {
    mockBalanceError = true;
    const { rerender } = view();
    mockError = 'Forbidden: You are not a player in this game.';
    await act(async () => { rerender(<ActiveGame gameId="friend-game" />); });
    expect(screen.getByRole('alert')).toHaveTextContent('Forbidden');
    expect(screen.queryByText(/friend_join_topup/)).not.toBeInTheDocument();
  });
});

describe('connection-lost overlay', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('stays away while a stake invitation waits for the player, however long they take', async () => {
    mockBalance = 100;
    view();
    await act(async () => { jest.advanceTimersByTime(60_000); });
    expect(screen.queryByTestId('crash-overlay')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'friend_join_topup_action:$4.00' })).toBeInTheDocument();
  });

  it('still appears when the game state genuinely never arrives', async () => {
    mockConsent = null;
    view();
    await act(async () => { jest.advanceTimersByTime(8_100); });
    expect(screen.getByTestId('crash-overlay')).toBeInTheDocument();
  });
});
