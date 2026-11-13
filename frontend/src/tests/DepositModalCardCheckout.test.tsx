import '@testing-library/jest-dom';
import type { ReactNode } from 'react';
import { act, render, screen } from '@testing-library/react';
import DepositModal from '@/components/Wallet/DepositModal';
import { apiFetch } from '@/lib/api';
import { useTonWallet } from '@tonconnect/ui-react';

// New card funding is closed; sessions created before that change still need recovery.
jest.mock('next-intl', () => ({ useTranslations: () => (key: string) => key }));
jest.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: { children: ReactNode }) => <>{children}</>,
  motion: { div: ({ children }: { children: ReactNode }) => <div>{children}</div> },
}));
jest.mock('@/components/TonConnectProvider', () => ({ __esModule: true, default: ({ children }: { children: ReactNode }) => <>{children}</> }));
jest.mock('@tonconnect/ui-react', () => ({ useTonConnectUI: () => [{ openModal: jest.fn() }], useTonWallet: jest.fn() }));
jest.mock('@ton/core', () => ({ beginCell: jest.fn(), Address: {}, Cell: {} }));
jest.mock('@/components/ui/Drawer', () => ({ Drawer: ({ children }: { children: ReactNode }) => <div role="dialog">{children}</div> }));
jest.mock('@/components/Wallet/deposit/DepositSuccessView', () => ({ DepositSuccessView: ({ successMessage }: { successMessage: string }) => <div data-testid="deposit-success">{successMessage}</div> }));
jest.mock('@/context/NavbarContext', () => ({ useNavbarHideWhileMounted: jest.fn() }));
jest.mock('@/context/UserContext', () => ({ useUser: () => ({ stats: { telegram_id: 123 }, loadingStats: false, syncStats: jest.fn(), walletAddress: '' }) }));
jest.mock('@/lib/api', () => ({ apiFetch: jest.fn() }));
jest.mock('@/lib/telegram', () => ({ telegramHaptic: jest.fn() }));
jest.mock('@/lib/clipboard', () => ({ copyToClipboard: jest.fn() }));
jest.mock('@/lib/telemetry', () => ({ logTelemetryEvent: jest.fn() }));

const reply = (status: number, body: unknown = {}) => ({ ok: status < 400, status, json: async () => body });
const flush = () => act(async () => { for (let i = 0; i < 12; i++) await Promise.resolve(); });
const onSuccess = jest.fn();
const verifyCalls = () => (apiFetch as jest.Mock).mock.calls.filter(([url]) => String(url).startsWith('/api/v1/wallet/stripe/verify-session'));

beforeEach(() => {
  (useTonWallet as jest.Mock).mockReturnValue(null);
  (apiFetch as jest.Mock).mockImplementation((url: string) =>
    Promise.resolve(url.startsWith('/api/v1/wallet/stripe/verify-session')
      ? reply(200, { status: 'completed', credited_amount: 950, new_balance: 950 })
      : reply(404)));
});
afterEach(() => {
  jest.clearAllMocks();
  window.sessionStorage.clear();
});

it('recovers a historical paid Checkout session once without creating a new one', async () => {
  window.sessionStorage.setItem('deposit_pending_stripe', JSON.stringify({ sessionId: 'cs_resume', startedAt: Date.now() - 60_000 }));
  render(<DepositModal onClose={jest.fn()} onSuccess={onSuccess} />);
  await flush();
  expect(verifyCalls()[0][0]).toContain('session_id=cs_resume');
  expect(screen.getByTestId('deposit-success')).toHaveTextContent('deposit_credited');
  expect(onSuccess).toHaveBeenCalledTimes(1);
  expect((apiFetch as jest.Mock).mock.calls.some(([url]) => String(url).includes('/stripe/create-session'))).toBe(false);
  expect(window.sessionStorage.getItem('deposit_pending_stripe')).toBeNull();
});

it('ignores a saved Checkout session after its recovery window', async () => {
  window.sessionStorage.setItem('deposit_pending_stripe', JSON.stringify({ sessionId: 'cs_old', startedAt: Date.now() - 31 * 60_000 }));
  render(<DepositModal onClose={jest.fn()} onSuccess={onSuccess} />);
  await flush();
  expect(verifyCalls()).toHaveLength(0);
  expect(window.sessionStorage.getItem('deposit_pending_stripe')).toBeNull();
  expect(screen.queryByTestId('deposit-success')).not.toBeInTheDocument();
});
