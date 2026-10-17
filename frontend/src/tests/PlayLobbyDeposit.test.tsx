import '@testing-library/jest-dom';
import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import PlayLobby from '@/components/game/PlayLobby';
import { useUser } from '@/context/UserContext';
import { getSocket } from '@/lib/socket';

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
jest.mock('@/components/game/lobby/BetSlip', () => ({ BetSlip: ({ onStart }: { onStart: () => void }) => <button onClick={onStart}>start-match</button> }));
jest.mock('@/components/game/lobby/DailyGoal', () => ({ DailyGoal: () => null }));
jest.mock('@/components/game/ArenaBanner', () => () => null);
jest.mock('@/components/EngagementQuest', () => () => null);
jest.mock('@/components/game/AiDifficultyDrawer', () => () => null);
jest.mock('@/components/game/RakeInfoDrawer', () => () => null);
jest.mock('@/components/Wallet/WalletDialogs', () => ({ DepositDialog: ({ onSuccess, onClose }: { onSuccess: () => void; onClose: () => void }) => <div role="dialog"><button onClick={onSuccess}>verified-deposit</button><button onClick={onClose}>close-deposit</button></div> }));

const emit = jest.fn();
const syncBalance = jest.fn().mockResolvedValue({ balance: 1250 });
let balance = 1250;
beforeEach(() => {
  jest.useFakeTimers();
  emit.mockClear(); syncBalance.mockClear(); balance = 1250;
  (getSocket as jest.Mock).mockReturnValue({ emit, on: jest.fn(), off: jest.fn(), connected: false });
  (useUser as jest.Mock).mockImplementation(() => ({ stats: null, walletBalance: balance, syncBalance, loadingBalance: false, balanceError: false }));
});
afterEach(() => { jest.useRealTimers(); });

it('keeps Top Up open and never joins a paid queue when the balance already covers the stake', () => {
  render(<PlayLobby />);
  fireEvent.click(screen.getByRole('button', { name: 'top_up' }));
  act(() => { jest.advanceTimersByTime(1000); });
  expect(screen.getByRole('dialog')).toBeInTheDocument();
  expect(emit).not.toHaveBeenCalledWith('join_matchmaking', expect.anything());
  expect(syncBalance).not.toHaveBeenCalled();
});
it('refreshes a verified deposit without starting matchmaking when the balance increases', async () => {
  balance = 100;
  const view = render(<PlayLobby />);
  fireEvent.click(screen.getByRole('button', { name: 'start-match' }));
  expect(screen.getByRole('dialog')).toBeInTheDocument();
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'verified-deposit' })); });
  balance = 1250; view.rerender(<PlayLobby />);
  act(() => { jest.advanceTimersByTime(1000); });
  expect(syncBalance).toHaveBeenCalledTimes(1);
  expect(emit).not.toHaveBeenCalledWith('join_matchmaking', expect.anything());
});
it('joins the selected queue only after the explicit match action', () => {
  render(<PlayLobby />);
  fireEvent.click(screen.getByRole('button', { name: 'start-match' }));
  expect(emit).toHaveBeenCalledWith('join_matchmaking', { bid_amount: 500, time_control: 600 });
});
