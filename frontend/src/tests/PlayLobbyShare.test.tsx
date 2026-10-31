import { translatorFor as mockTranslatorFor } from './testUtils/messagesMock';
import '@testing-library/jest-dom';
import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import PlayLobby from '@/components/game/PlayLobby';
import { useUser } from '@/context/UserContext';
import { getSocket } from '@/lib/socket';
import { shareInvitation } from '@/lib/invitations';
import { copyToClipboard } from '@/lib/clipboard';
import { telegramAlert } from '@/lib/telegram';

jest.mock('next-intl', () => ({ useLocale: () => 'en', useTranslations: (namespace: string) => mockTranslatorFor(namespace) }));
jest.mock('next/navigation', () => ({ useRouter: () => ({ push: jest.fn() }), usePathname: () => '/en/game' }));
jest.mock('next/link', () => ({ children, href, ...props }: { children: React.ReactNode; href: string }) => <a href={href} {...props}>{children}</a>);
jest.mock('framer-motion', () => ({ AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>, motion: { div: ({ children }: { children: React.ReactNode }) => <div>{children}</div> } }));
jest.mock('@/components/LayoutWrapper', () => ({ children }: { children: React.ReactNode }) => <>{children}</>);
jest.mock('@/context/UserContext', () => ({ useUser: jest.fn() }));
jest.mock('@/hooks/useAudio', () => ({ useAudio: () => ({ play: jest.fn() }) }));
jest.mock('@/lib/socket', () => ({ getSocket: jest.fn() }));
jest.mock('@/lib/api', () => ({ apiFetch: jest.fn(), getFullPhotoUrl: (path: string) => path }));
jest.mock('@/lib/telegram', () => ({ telegramHaptic: jest.fn(), telegramAlert: jest.fn() }));
jest.mock('@/lib/clipboard', () => ({ copyToClipboard: jest.fn().mockResolvedValue(true) }));
jest.mock('@/lib/invitations', () => ({ ...jest.requireActual('@/lib/invitations'), shareInvitation: jest.fn() }));
jest.mock('@/lib/telemetry', () => ({ logTelemetryEvent: jest.fn() }));
jest.mock('@/hooks/useLobbyStats', () => ({ useLobbyStats: () => ({ loaded: true, searching: 0, games24h: 0, recent: [] }) }));
jest.mock('@/components/game/lobby/BetSlip', () => ({ BetSlip: () => null }));
jest.mock('@/components/game/lobby/LobbyHero', () => ({ LobbyHero: () => null }));
jest.mock('@/components/game/lobby/DailyGoal', () => ({ DailyGoal: () => null }));
jest.mock('@/components/game/lobby/RecentResults', () => ({ RecentResults: () => null }));
jest.mock('@/components/game/ArenaBanner', () => () => null);
jest.mock('@/components/EngagementQuest', () => () => null);
jest.mock('@/components/game/AiDifficultyDrawer', () => () => null);
jest.mock('@/components/game/RakeInfoDrawer', () => () => null);
jest.mock('@/components/game/FriendChallengeDrawer', () => () => null);
jest.mock('@/components/Wallet/WalletDialogs', () => ({ DepositDialog: () => null }));

const recentGames = [
  { game_id: 'g1', result: 'win', elo_change: 12, opponent: { name: 'Bob', elo: 1200 } },
  { game_id: 'g2', result: 'win', elo_change: 0, opponent: { name: 'Free Coach', elo: 1000 } },
  { game_id: 'g3', result: 'draw', elo_change: 0, opponent: { name: 'Eve', elo: 1100 } },
];
const invite = 'https://t.me/chess_bot?startapp=ref_abc123';
const wonText = 'I just won a chess match on Web3Chess ♟️ Think you can beat me? Open my invitation and send me a free play request.';
const playedText = 'I just played a chess match on Web3Chess ♟️ Play me next: open my invitation and send me a free play request.';

function renderLobby(referralCode: string | undefined, games = recentGames) {
  (useUser as jest.Mock).mockReturnValue({
    stats: { referral_code: referralCode, bot_username: 'chess_bot', recent_games: games },
    walletBalance: 1250, syncBalance: jest.fn(), loadingBalance: false, balanceError: false,
  });
  return render(<PlayLobby />);
}

beforeEach(() => {
  jest.clearAllMocks();
  (getSocket as jest.Mock).mockReturnValue({ emit: jest.fn(), on: jest.fn(), off: jest.fn(), connected: false });
});

it('shares the personal startapp=ref_ invitation from a recent game, never a bare start= code', () => {
  renderLobby('abc123');
  fireEvent.click(screen.getByRole('button', { name: 'Share Result: Bob' }));
  expect(shareInvitation).toHaveBeenCalledWith(invite, wonText);
});

it('only claims a win over a person; Free Coach wins and draws share the neutral text', () => {
  renderLobby('abc123');
  fireEvent.click(screen.getByRole('button', { name: 'Share Result: Free Coach' }));
  fireEvent.click(screen.getByRole('button', { name: 'Share Result: Eve' }));
  expect(shareInvitation).toHaveBeenNthCalledWith(1, invite, playedText);
  expect(shareInvitation).toHaveBeenNthCalledWith(2, invite, playedText);
});

it('treats a legacy computer name as Free Coach too', () => {
  renderLobby('abc123', [{ game_id: 'g4', result: 'win', elo_change: 0, opponent: { name: 'A.I. Coach', elo: 1000 } }]);
  fireEvent.click(screen.getByRole('button', { name: /^Share Result:/ }));
  expect(shareInvitation).toHaveBeenCalledWith(invite, playedText);
});

it('copies the invitation with a localized notice when the share sheet cannot open', async () => {
  (shareInvitation as jest.Mock).mockImplementationOnce(() => { throw new Error('WebAppTgUrlInvalid'); });
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  renderLobby('abc123');
  fireEvent.click(screen.getByRole('button', { name: 'Share Result: Bob' }));
  expect(copyToClipboard).toHaveBeenCalledWith(invite);
  await waitFor(() => expect(telegramAlert).toHaveBeenCalledWith('Invite link copied'));
});

it('hides the share control when there is no valid referral code', () => {
  renderLobby(undefined);
  expect(screen.getAllByRole('link', { name: /^Recent Activity: / })).toHaveLength(3);
  expect(screen.queryByRole('button', { name: /Share Result/ })).not.toBeInTheDocument();
});
