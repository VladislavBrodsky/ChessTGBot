import '@testing-library/jest-dom';
import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import ActiveGame from '@/components/game/ActiveGame';
import { apiFetch } from '@/lib/api';
import { shareInvitation } from '@/lib/invitations';

// The result screen shares the player's ref_ invitation. A ref_ link opens Free Coach practice for the
// friend (it is not a play request), so the share carries the referral copy whatever the result.

const USER_ID = 42;
let mockGameState: Record<string, unknown> | null = null;

jest.mock('next-intl', () => ({ useLocale: () => 'en', useTranslations: (namespace: string) => (key: string) => `${namespace}.${key}` }));
jest.mock('next/navigation', () => ({ useRouter: () => ({ push: jest.fn(), replace: jest.fn() }) }));
jest.mock('next/link', () => ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>);
jest.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  motion: {
    div: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    button: ({ children }: { children: React.ReactNode }) => <button type="button">{children}</button>,
  },
}));
jest.mock('@/components/LayoutWrapper', () => ({ children }: { children: React.ReactNode }) => <>{children}</>);
jest.mock('@/components/game/ChessBoard', () => () => null);
jest.mock('@/components/game/ChessClockBadge', () => () => null);
jest.mock('@/components/game/MatchOverModal', () => ({ onShareGame }: { onShareGame?: () => void }) =>
  onShareGame ? <button onClick={onShareGame}>share-result</button> : null);
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
jest.mock('@/lib/clipboard', () => ({ copyToClipboard: jest.fn().mockResolvedValue(true) }));
jest.mock('@/lib/botRevenge', () => ({ requestBotRevengeGame: jest.fn() }));
jest.mock('@/lib/telemetry', () => ({ logTelemetryEvent: jest.fn() }));
jest.mock('@/lib/invitations', () => ({ ...jest.requireActual('@/lib/invitations'), shareInvitation: jest.fn() }));

const finished = { status: 'completed', is_game_over: true, turn: 'w', white_player_id: USER_ID, wager_amount: 0, result_type: 'checkmate' };

function mockProfile(referralCode: string | null) {
  (apiFetch as jest.Mock).mockImplementation((url: string) => Promise.resolve({
    ok: true,
    json: async () => (url.startsWith('/api/v1/users/') ? { games_played: 3, referral_code: referralCode, bot_username: 'chess_bot' } : {}),
  }));
}

beforeEach(() => {
  (window as any).Telegram = { WebApp: { initDataUnsafe: { user: { id: USER_ID } }, initData: 'x' } };
});
afterEach(() => { jest.clearAllMocks(); mockGameState = null; delete (window as any).Telegram; });

const flush = () => act(async () => { await new Promise(resolve => setTimeout(resolve, 0)); });

async function finishGame(state: Record<string, unknown>, referralCode: string | null = 'abc123') {
  mockProfile(referralCode);
  mockGameState = state;
  render(<ActiveGame gameId="g1" />);
  await waitFor(() => expect(apiFetch).toHaveBeenCalledWith(`/api/v1/users/${USER_ID}`));
  await flush();
}

it.each([
  ['a win over a person', { ...finished, black_player_id: 77, winner_id: USER_ID }],
  ['a Free Coach win', { ...finished, black_player_id: -1, winner_id: USER_ID }],
  ['a loss', { ...finished, black_player_id: 77, winner_id: 77 }],
])('shares the ref_ invitation with the referral copy after %s', async (_label, state) => {
  await finishGame(state);
  fireEvent.click(screen.getByRole('button', { name: 'share-result' }));
  expect(shareInvitation).toHaveBeenCalledTimes(1);
  const [link, text] = (shareInvitation as jest.Mock).mock.calls[0];
  expect(link).toMatch(/\?startapp=ref_abc123$/);
  expect(text).toBe('Invitations.referral_share_text');
});

it('offers no result share without a valid referral code', async () => {
  await finishGame({ ...finished, black_player_id: 77, winner_id: USER_ID }, null);
  expect(screen.queryByRole('button', { name: 'share-result' })).not.toBeInTheDocument();
});
