import '@testing-library/jest-dom';
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import PlayLobby from '@/components/game/PlayLobby';
import { useUser } from '@/context/UserContext';
import { getSocket } from '@/lib/socket';
import { logTelemetryEvent } from '@/lib/telemetry';

jest.mock('next-intl', () => ({ useLocale: () => 'en', useTranslations: () => (key: string) => key }));
jest.mock('next/navigation', () => ({ useRouter: () => ({ push: jest.fn() }), usePathname: () => '/en/game' }));
jest.mock('next/link', () => ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>);
jest.mock('framer-motion', () => ({ AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>, motion: { div: ({ children }: { children: React.ReactNode }) => <div>{children}</div> } }));
jest.mock('@/components/LayoutWrapper', () => ({ children }: { children: React.ReactNode }) => <>{children}</>);
jest.mock('@/context/UserContext', () => ({ useUser: jest.fn() }));
jest.mock('@/hooks/useAudio', () => ({ useAudio: () => ({ play: jest.fn() }) }));
jest.mock('@/lib/socket', () => ({ getSocket: jest.fn() }));
jest.mock('@/lib/api', () => ({ apiFetch: jest.fn(), getFullPhotoUrl: (path: string) => path }));
jest.mock('@/lib/telegram', () => ({ telegramHaptic: jest.fn(), telegramAlert: jest.fn() }));
jest.mock('@/lib/telemetry', () => ({ logTelemetryEvent: jest.fn() }));
jest.mock('@/hooks/useLobbyStats', () => ({ useLobbyStats: () => ({ loaded: true, searching: 0, games24h: 0, recent: [] }) }));
jest.mock('@/components/game/lobby/BetSlip', () => ({ BetSlip: () => null }));
jest.mock('@/components/game/lobby/DailyGoal', () => ({ DailyGoal: () => null }));
jest.mock('@/components/game/ArenaBanner', () => () => null);
jest.mock('@/components/EngagementQuest', () => () => null);
jest.mock('@/components/game/AiDifficultyDrawer', () => () => null);
jest.mock('@/components/game/RakeInfoDrawer', () => () => null);
jest.mock('@/components/game/FriendChallengeDrawer', () => ({
  __esModule: true,
  default: (p: { initialMode?: string; initialWager: number; onTopUp: (stake: number) => void; onClose: () => void }) =>
    <div data-testid="friend-drawer" data-mode={p.initialMode} data-wager={p.initialWager}>
      <button onClick={() => p.onTopUp(1000)}>top-up-stake</button>
      <button onClick={p.onClose}>close-drawer</button>
    </div>,
}));
jest.mock('@/components/Wallet/WalletDialogs', () => ({ DepositDialog: ({ onClose }: { onClose: () => void }) => <div role="dialog"><button onClick={onClose}>close-deposit</button></div> }));

beforeEach(() => {
  (getSocket as jest.Mock).mockReturnValue({ emit: jest.fn(), on: jest.fn(), off: jest.fn(), connected: false });
  (useUser as jest.Mock).mockImplementation(() => ({ stats: null, walletBalance: 200, syncBalance: jest.fn().mockResolvedValue({}), loadingBalance: false, balanceError: false }));
});
afterEach(() => { jest.clearAllMocks(); window.history.replaceState({}, '', '/'); });

it('opens the staked friend drawer from the bridge link and drops the one-shot parameter', () => {
  window.history.replaceState({}, '', '/en/game?friend=stake&v=1');
  render(<PlayLobby />);
  expect(screen.getByTestId('friend-drawer')).toHaveAttribute('data-mode', 'paid');
  expect(window.location.search).toBe('?v=1');
});

it('leaves the lobby alone without the bridge parameter', () => {
  render(<PlayLobby />);
  expect(screen.queryByTestId('friend-drawer')).not.toBeInTheDocument();
});

it('returns to the staked drawer, at the same stake, after a top-up from it', () => {
  window.history.replaceState({}, '', '/en/game?friend=stake');
  render(<PlayLobby />);
  fireEvent.click(screen.getByText('top-up-stake'));
  expect(screen.queryByTestId('friend-drawer')).not.toBeInTheDocument();
  expect(screen.getByRole('dialog')).toBeInTheDocument();
  expect(logTelemetryEvent).toHaveBeenCalledWith('wager_insufficient_balance', {
    source: 'friend_challenge', selected_wager_cents: 1000, wallet_balance_cents: 200, shortfall_cents: 800,
  });

  fireEvent.click(screen.getByText('close-deposit'));
  const drawer = screen.getByTestId('friend-drawer');
  expect(drawer).toHaveAttribute('data-mode', 'paid');
  expect(drawer).toHaveAttribute('data-wager', '1000');
});

it('closes the drawer when the player dismisses it', () => {
  window.history.replaceState({}, '', '/en/game?friend=stake');
  render(<PlayLobby />);
  fireEvent.click(screen.getByText('close-drawer'));
  expect(screen.queryByTestId('friend-drawer')).not.toBeInTheDocument();
});
