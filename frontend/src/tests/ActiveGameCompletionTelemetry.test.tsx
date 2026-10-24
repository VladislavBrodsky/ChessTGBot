import '@testing-library/jest-dom';
import React from 'react';
import { act, render, waitFor } from '@testing-library/react';
import ActiveGame from '@/components/game/ActiveGame';
import { apiFetch } from '@/lib/api';
import { logTelemetryEvent } from '@/lib/telemetry';

// Activation funnel: game_completed fires once per finished game, and
// first_game_completed only when the player had no games before this one.

const USER_ID = 42;
let mockGameState: Record<string, unknown> | null = null;

jest.mock('next-intl', () => ({ useLocale: () => 'en', useTranslations: () => (key: string) => key }));
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
  GameActionBar: () => null, ConfirmActionDrawer: () => null, GameCrashOverlay: () => null,
  getMovesSanList: () => [],
}));
jest.mock('@/components/ui/Modal', () => ({ Modal: () => null }));
jest.mock('@/hooks/useGameSocket', () => ({
  useGameSocket: () => ({ fen: 'start', makeMove: jest.fn(), isConnected: true, error: null, gameState: mockGameState, wagerConsent: null, acceptWager: jest.fn() }),
}));
jest.mock('@/hooks/useAudioSynth', () => ({ useAudioSynth: () => ({ playTickSound: jest.fn() }) }));
jest.mock('@/hooks/useAudio', () => ({ useAudio: () => ({ play: jest.fn() }) }));
jest.mock('@/context/NavbarContext', () => ({ useNavbarHide: () => ({ hideNavbar: jest.fn(), showNavbar: jest.fn() }) }));
jest.mock('@/lib/socket', () => ({ getSocket: () => ({ on: jest.fn(), off: jest.fn(), emit: jest.fn() }) }));
jest.mock('@/lib/api', () => ({ apiFetch: jest.fn(), getFullPhotoUrl: (p: string) => p }));
jest.mock('@/lib/telegram', () => ({ telegramHaptic: jest.fn(), telegramAlert: jest.fn() }));
jest.mock('@/lib/clipboard', () => ({ copyToClipboard: jest.fn() }));
jest.mock('@/lib/botRevenge', () => ({ requestBotRevengeGame: jest.fn() }));
jest.mock('@/lib/telemetry', () => ({ logTelemetryEvent: jest.fn() }));

// Mirrors the server's game_state payload (backend schemas/game_state.py): it carries no id or game_id.
const live = { status: 'active', is_game_over: false, turn: 'w', white_player_id: USER_ID, black_player_id: -1, wager_amount: 0 };
const won = { ...live, status: 'completed', is_game_over: true, winner_id: USER_ID, result_type: 'checkmate' };

function mockProfile(gamesPlayed: number) {
  (apiFetch as jest.Mock).mockImplementation((url: string) => Promise.resolve({
    ok: true,
    json: async () => (url.startsWith('/api/v1/users/') ? { games_played: gamesPlayed, referral_code: 'abc' } : {}),
  }));
}

const completions = () => (logTelemetryEvent as jest.Mock).mock.calls.filter(([name]) => name === 'game_completed' || name === 'first_game_completed');

beforeEach(() => {
  (window as any).Telegram = { WebApp: { initDataUnsafe: { user: { id: USER_ID } }, initData: 'x' } };
});
afterEach(() => { jest.clearAllMocks(); mockGameState = null; delete (window as any).Telegram; });

// Drains the profile fetch's promise chain, which is several microtasks deep.
const flush = () => act(async () => { await new Promise(resolve => setTimeout(resolve, 0)); });

async function playThrough(gamesPlayedBefore: number | 'never-loads', finalState: Record<string, unknown>) {
  if (gamesPlayedBefore === 'never-loads') (apiFetch as jest.Mock).mockImplementation(() => new Promise(() => {}));
  else mockProfile(gamesPlayedBefore);
  mockGameState = live;
  const view = render(<ActiveGame gameId="g1" />);
  await waitFor(() => expect(apiFetch).toHaveBeenCalledWith(`/api/v1/users/${USER_ID}`));
  await flush();
  mockGameState = finalState;
  view.rerender(<ActiveGame gameId="g1" />);
  await flush();
  return view;
}

it('marks the first completed game, once, even as the post-game sync bumps games_played', async () => {
  const view = await playThrough(0, won);
  // A later re-render after settlement must not log the same game again.
  mockGameState = { ...won, white_elo_after: 1016, white_elo_before: 1000 };
  view.rerender(<ActiveGame gameId="g1" />);
  await flush();
  const payload = { game_id: 'g1', is_bot: true, wager_cents: 0, outcome: 'win', is_first_game: true };
  expect(completions()).toEqual([['game_completed', payload], ['first_game_completed', payload]]);
});

it('logs a later game without the first-game flag', async () => {
  await playThrough(3, won);
  expect(completions()).toEqual([['game_completed', { game_id: 'g1', is_bot: true, wager_cents: 0, outcome: 'win', is_first_game: false }]]);
});

it('records the stake of a paid human game', async () => {
  await playThrough(5, { ...won, black_player_id: 77, wager_amount: 500, winner_id: 77 });
  expect(completions()).toEqual([['game_completed', { game_id: 'g1', is_bot: false, wager_cents: 500, outcome: 'loss', is_first_game: false }]]);
});

it('reports the first-game flag as unknown rather than false when the profile never loaded', async () => {
  await playThrough('never-loads', won);
  expect(completions()).toEqual([['game_completed', { game_id: 'g1', is_bot: true, wager_cents: 0, outcome: 'win', is_first_game: null }]]);
});

it('does not count an aborted game as completed', async () => {
  await playThrough(0, { ...live, status: 'aborted', is_game_over: true, result_type: 'aborted' });
  expect(completions()).toEqual([]);
});
