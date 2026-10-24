import '@testing-library/jest-dom';
import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import DepositModal from '@/components/Wallet/DepositModal';
import { logTelemetryEvent } from '@/lib/telemetry';
import { useTonWallet } from '@tonconnect/ui-react';

jest.mock('next-intl', () => ({ useTranslations: () => (key: string) => key }));
jest.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: { children: ReactNode }) => <>{children}</>,
  motion: { div: ({ children }: { children: ReactNode }) => <div>{children}</div> },
}));
jest.mock('@/components/TonConnectProvider', () => ({ __esModule: true, default: ({ children }: { children: ReactNode }) => <>{children}</> }));
jest.mock('@tonconnect/ui-react', () => ({ useTonConnectUI: () => [{ openModal: jest.fn() }], useTonWallet: jest.fn() }));
jest.mock('@ton/core', () => ({ beginCell: jest.fn(), Address: {}, Cell: {} }));
jest.mock('@/components/ui/Drawer', () => ({ Drawer: ({ children }: { children: ReactNode }) => <div role="dialog">{children}</div> }));
jest.mock('@/context/NavbarContext', () => ({ useNavbarHideWhileMounted: jest.fn() }));
let mockLinkedWallet = '';
jest.mock('@/context/UserContext', () => ({ useUser: () => ({ stats: { telegram_id: 123 }, loadingStats: false, syncStats: jest.fn(), walletAddress: mockLinkedWallet }) }));
jest.mock('@/lib/api', () => ({ apiFetch: jest.fn().mockResolvedValue({ ok: false, json: async () => ({}) }) }));
jest.mock('@/lib/telegram', () => ({ telegramHaptic: jest.fn() }));
jest.mock('@/lib/clipboard', () => ({ copyToClipboard: jest.fn() }));
jest.mock('@/lib/telemetry', () => ({ logTelemetryEvent: jest.fn() }));

const tabLabels = () => screen.getAllByText(/^tab_/).map(el => el.textContent);

beforeEach(() => { mockLinkedWallet = ''; (useTonWallet as jest.Mock).mockReturnValue(null); });
afterEach(() => jest.clearAllMocks());

it('opens on card checkout, listed first, for a player with no wallet', () => {
  render(<DepositModal onClose={jest.fn()} onSuccess={jest.fn()} />);
  expect(tabLabels()).toEqual(['tab_card', 'tab_crypto', 'tab_direct']);
  expect(screen.getByRole('button', { name: '$25' })).toBeInTheDocument();
  expect(screen.queryByText('connected_deposit')).not.toBeInTheDocument();
  expect(logTelemetryEvent).toHaveBeenCalledWith('deposit_modal_open', expect.objectContaining({ default_tab: 'card', has_wallet: false }));
});

it('keeps the connected-wallet tab first for a player with a linked wallet', () => {
  render(<DepositModal onClose={jest.fn()} onSuccess={jest.fn()} walletAddress="UQ-linked-wallet" />);
  expect(tabLabels()).toEqual(['tab_crypto', 'tab_direct', 'tab_card']);
  expect(screen.getByText('connected_deposit')).toBeInTheDocument();
  expect(logTelemetryEvent).toHaveBeenCalledWith('deposit_modal_open', expect.objectContaining({ default_tab: 'crypto', has_wallet: true }));
});

it('uses the account wallet when the opening screen does not pass one', () => {
  mockLinkedWallet = 'UQ-account-wallet';
  render(<DepositModal onClose={jest.fn()} onSuccess={jest.fn()} />);
  expect(tabLabels()).toEqual(['tab_crypto', 'tab_direct', 'tab_card']);
  expect(logTelemetryEvent).toHaveBeenCalledWith('deposit_modal_open', expect.objectContaining({ default_tab: 'crypto', has_wallet: true }));
});

it('keeps the connected-wallet tab first when TonConnect already holds a session', () => {
  (useTonWallet as jest.Mock).mockReturnValue({ account: { address: '0:abc' } });
  render(<DepositModal onClose={jest.fn()} onSuccess={jest.fn()} />);
  expect(tabLabels()).toEqual(['tab_crypto', 'tab_direct', 'tab_card']);
});

it('logs a tab switch with where the player came from', () => {
  render(<DepositModal onClose={jest.fn()} onSuccess={jest.fn()} />);
  screen.getByText('tab_direct').click();
  expect(logTelemetryEvent).toHaveBeenCalledWith('deposit_tab_selected', { tab: 'direct', from: 'card' });
});
