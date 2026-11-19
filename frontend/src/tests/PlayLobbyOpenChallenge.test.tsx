import '@testing-library/jest-dom';
import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import PlayLobby from '@/components/game/PlayLobby';
import { useUser } from '@/context/UserContext';
import { getSocket } from '@/lib/socket';
import { apiFetch } from '@/lib/api';
import { useOpenChallenges } from '@/hooks/useOpenChallenges';

const mockPush = jest.fn();
jest.mock('next-intl', () => ({ useLocale: () => 'en', useTranslations: () => (key: string) => key }));
jest.mock('next/navigation', () => ({ useRouter: () => ({ push: mockPush }), usePathname: () => '/en/game' }));
jest.mock('framer-motion', () => ({ AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>, motion: { div: ({ children }: { children: React.ReactNode }) => <div>{children}</div> } }));
jest.mock('@/components/LayoutWrapper', () => ({ children }: { children: React.ReactNode }) => <>{children}</>);
jest.mock('@/context/UserContext', () => ({ useUser: jest.fn() }));
jest.mock('@/hooks/useAudio', () => ({ useAudio: () => ({ play: jest.fn() }) }));
jest.mock('@/lib/socket', () => ({ getSocket: jest.fn() }));
jest.mock('@/lib/api', () => ({ apiFetch: jest.fn(), getFullPhotoUrl: (path: string) => path }));
jest.mock('@/lib/telegram', () => ({ telegramHaptic: jest.fn(), telegramAlert: jest.fn() }));
jest.mock('@/lib/telemetry', () => ({ logTelemetryEvent: jest.fn() }));
jest.mock('@/hooks/useLobbyStats', () => ({ useLobbyStats: () => ({ loaded: true, searching: 0, games24h: 0, recent: [] }) }));
jest.mock('@/hooks/useOpenChallenges', () => ({ useOpenChallenges: jest.fn() }));
jest.mock('@/components/game/lobby/BetSlip', () => ({ BetSlip: () => null }));
jest.mock('@/components/game/lobby/DailyGoal', () => ({ DailyGoal: () => null }));
jest.mock('@/components/game/BalanceOpportunity', () => ({ BalanceOpportunity: () => null }));
jest.mock('@/components/EngagementQuest', () => () => null);
jest.mock('@/components/game/AiDifficultyDrawer', () => () => null);
jest.mock('@/components/game/RakeInfoDrawer', () => () => null);
jest.mock('@/components/game/FriendChallengeDrawer', () => () => null);
jest.mock('@/components/Wallet/WalletDialogs', () => ({ DepositDialog: () => null }));

type Handler = (data: any) => void;
let handlers: Record<string, Handler>;
let socket: { emit: jest.Mock; on: jest.Mock; off: jest.Mock; connected: boolean };

function serverSays(event: string, data: any) {
  act(() => { handlers[event](data); });
}

beforeEach(() => {
  handlers = {};
  socket = {
    emit: jest.fn(),
    on: jest.fn((event: string, handler: Handler) => { handlers[event] = handler; }),
    off: jest.fn(),
    connected: false,
  };
  (getSocket as jest.Mock).mockReturnValue(socket);
  (useUser as jest.Mock).mockImplementation(() => ({ stats: null, walletBalance: 300, syncBalance: jest.fn().mockResolvedValue({}), loadingBalance: false, balanceError: false }));
  (useOpenChallenges as jest.Mock).mockReturnValue({ challenges: [] });
  (apiFetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => ({ game_id: 'open-1', invite_link: '' }) });
});
afterEach(() => { jest.clearAllMocks(); });

const OPEN_CREATE = '/api/v1/game/create?type=online&time_control=300&wager=100&open_challenge=true';

it('lists real open challenges above the bet slip and opens the game to accept one', () => {
  (useOpenChallenges as jest.Mock).mockReturnValue({ challenges: [{
    game_id: 'theirs', bid_amount: 200, time_control: 600, creator_name: 'Ana', creator_elo: 1300,
    created_at: Date.now() / 1000, expires_at: Date.now() / 1000 + 1740, mine: false,
  }] });
  render(<PlayLobby />);

  fireEvent.click(screen.getByRole('button', { name: 'open_challenge_accept' }));
  expect(mockPush).toHaveBeenCalledWith('/en/game?id=theirs');
});

it('turns a quiet staked search into an open challenge only after the queued stake is refunded', async () => {
  render(<PlayLobby />);
  serverSays('matchmaking_status', { status: 'searching', bid_amount: 100, time_control: 300, duration_waited: 25 });

  fireEvent.click(screen.getByRole('button', { name: 'open_challenge_keep_open' }));
  expect(socket.emit).toHaveBeenCalledWith('leave_matchmaking', {});
  // Nothing is charged until the server confirms the search ended (and refunded).
  expect(apiFetch).not.toHaveBeenCalled();

  serverSays('matchmaking_status', { status: 'idle' });
  await waitFor(() => expect(apiFetch).toHaveBeenCalledWith(OPEN_CREATE, { method: 'POST' }));
  await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/en/game?id=open-1'));
});

it('does not post a challenge if a match arrives while leaving the queue', () => {
  render(<PlayLobby />);
  serverSays('matchmaking_status', { status: 'searching', bid_amount: 100, time_control: 300, duration_waited: 25 });
  fireEvent.click(screen.getByRole('button', { name: 'open_challenge_keep_open' }));

  serverSays('match_found', { game_id: 'matched', color: 'w', opponent_id: 2, bid_amount: 100 });
  serverSays('matchmaking_status', { status: 'idle' });
  expect(apiFetch).not.toHaveBeenCalled();
});

it('offers to keep the stake open after a staked search times out', async () => {
  render(<PlayLobby />);
  serverSays('matchmaking_status', { status: 'searching', bid_amount: 100, time_control: 300, duration_waited: 0 });
  expect(screen.queryByRole('button', { name: 'open_challenge_keep_open' })).not.toBeInTheDocument();

  serverSays('matchmaking_status', { status: 'idle', message: 'No opponent found within the time limit. Your wager has been fully refunded.' });
  expect(screen.getByRole('alert')).toHaveTextContent('fully refunded');

  fireEvent.click(screen.getByRole('button', { name: 'open_challenge_keep_open' }));
  await waitFor(() => expect(apiFetch).toHaveBeenCalledWith(OPEN_CREATE, { method: 'POST' }));
  await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/en/game?id=open-1'));
});

it('shows the server refusal when the challenge cannot be posted', async () => {
  (apiFetch as jest.Mock).mockResolvedValue({ ok: false, json: async () => ({ detail: 'Insufficient funds. Please top up your Web3 Wallet.' }) });
  render(<PlayLobby />);
  serverSays('matchmaking_status', { status: 'searching', bid_amount: 100, time_control: 300, duration_waited: 0 });
  serverSays('matchmaking_status', { status: 'idle', message: 'No opponent found within the time limit. Your wager has been fully refunded.' });

  fireEvent.click(screen.getByRole('button', { name: 'open_challenge_keep_open' }));
  await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Insufficient funds'));
  expect(mockPush).not.toHaveBeenCalled();
});
