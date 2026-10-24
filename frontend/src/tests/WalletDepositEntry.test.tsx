import '@testing-library/jest-dom';
import { SWRConfig } from 'swr';
import { render, screen } from '@testing-library/react';
import WalletPage from '@/app/[locale]/wallet/page';
import { apiFetch } from '@/lib/api';
import { useUser } from '@/context/UserContext';
import { logTelemetryEvent } from '@/lib/telemetry';

// Home sends a player with an empty balance to /wallet?deposit=1, which must
// open the deposit drawer once and leave a clean URL behind.

jest.mock('next/link', () => ({ children }: { children: React.ReactNode }) => <>{children}</>);
jest.mock('next-intl', () => ({ useTranslations: () => (key: string) => key, useLocale: () => 'en' }));
jest.mock('framer-motion', () => ({
  useDragControls: () => ({ start: jest.fn() }),
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  motion: { div: ({ children }: { children: React.ReactNode }) => <div>{children}</div> },
}));
jest.mock('@/context/UserContext', () => ({ useUser: jest.fn() }));
jest.mock('@/hooks/useAudio', () => ({ useAudio: () => ({ play: jest.fn() }) }));
jest.mock('@/lib/api', () => ({ apiFetch: jest.fn() }));
jest.mock('@/lib/telemetry', () => ({ logTelemetryEvent: jest.fn() }));
jest.mock('@/components/LayoutWrapper', () => ({ children }: { children: React.ReactNode }) => <>{children}</>);
jest.mock('@/components/ui/Card', () => ({ Card: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
jest.mock('@/components/Wallet/CyberCard', () => ({ __esModule: true, default: () => null }));
jest.mock('@/components/Wallet/TransactionLedger', () => ({ __esModule: true, default: () => null }));
jest.mock('@/components/Wallet/DepositModal', () => ({ __esModule: true, default: () => <div>deposit-drawer-open</div> }));
jest.mock('@/components/Wallet/WithdrawModal', () => ({ __esModule: true, default: () => null }));
jest.mock('@/components/Wallet/WalletSelectorModal', () => ({ __esModule: true, default: () => null }));

const Wrapper = ({ children }: { children: React.ReactNode }) => <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>{children}</SWRConfig>;

beforeEach(() => {
  (apiFetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => [] });
  (useUser as jest.Mock).mockReturnValue({ walletBalance: 0, walletAddress: '', syncBalance: jest.fn(), balanceError: false, loadingBalance: false });
});
afterEach(() => { jest.clearAllMocks(); window.history.replaceState({}, '', '/'); });

it('opens the deposit drawer for ?deposit=1, records the entry, and drops the parameter', async () => {
  window.history.replaceState({}, '', '/en/wallet?deposit=1&v=2');
  render(<WalletPage />, { wrapper: Wrapper });
  expect(await screen.findByText('deposit-drawer-open')).toBeInTheDocument();
  expect(logTelemetryEvent).toHaveBeenCalledWith('topup_entry', { source: 'home_zero_balance' });
  expect(window.location.search).toBe('?v=2');
});

it('leaves the drawer closed on an ordinary visit', () => {
  window.history.replaceState({}, '', '/en/wallet');
  render(<WalletPage />, { wrapper: Wrapper });
  expect(screen.queryByText('deposit-drawer-open')).not.toBeInTheDocument();
  expect(logTelemetryEvent).not.toHaveBeenCalled();
});
