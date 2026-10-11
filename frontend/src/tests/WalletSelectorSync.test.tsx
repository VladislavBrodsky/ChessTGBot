import '@testing-library/jest-dom';
import React from 'react';
import { act, render, waitFor } from '@testing-library/react';
import WalletSelectorModal from '@/components/Wallet/WalletSelectorModal';
import { apiFetch } from '@/lib/api';
import { useUser } from '@/context/UserContext';

jest.mock('@tonconnect/ui-react', () => ({ useTonConnectUI: () => [{ disconnect: jest.fn() }], useTonWallet: () => ({ account: { address: 'EQ-local-test' } }) }));
jest.mock('@/components/TonConnectProvider', () => ({ children }: { children: React.ReactNode }) => <>{children}</>);
jest.mock('@/components/ui/Drawer', () => ({ Drawer: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));
jest.mock('framer-motion', () => ({ motion: { div: ({ children }: { children: React.ReactNode }) => <div>{children}</div>, button: ({ children }: { children: React.ReactNode }) => <button>{children}</button> } }));
jest.mock('next-intl', () => ({ useTranslations: () => (key: string) => key }));
jest.mock('@/context/UserContext', () => ({ useUser: jest.fn() }));
jest.mock('@/lib/api', () => ({ apiFetch: jest.fn() }));
const showError = jest.fn();
jest.mock('@/context/ToastContext', () => ({ useToast: () => ({ error: showError }) }));
const t = (key: string) => key;
beforeEach(() => {
  jest.clearAllMocks();
  (useUser as jest.Mock).mockReturnValue({ stats: { telegram_id: 42 } });
  (apiFetch as jest.Mock).mockResolvedValue({ ok: true });
});

it('saves the verified account address once despite changing parent callbacks', async () => {
  const first = jest.fn();
  const view = render(<WalletSelectorModal tw={t} onClose={() => {}} onConnected={first} />);
  await waitFor(() => expect(first).toHaveBeenCalledTimes(1));
  expect(apiFetch).toHaveBeenCalledWith('/api/v1/users/wallet', expect.objectContaining({ body: JSON.stringify({ telegram_id: 42, wallet_address: 'EQ-local-test' }) }));
  view.rerender(<WalletSelectorModal tw={t} onClose={() => {}} onConnected={jest.fn()} />);
  await act(async () => {});
  expect(apiFetch).toHaveBeenCalledTimes(1);
});
it('does not substitute a development account when the verified identity is unavailable', async () => {
  (useUser as jest.Mock).mockReturnValue({ stats: null });
  render(<WalletSelectorModal tw={t} onClose={() => {}} />);
  await act(async () => {});
  expect(apiFetch).not.toHaveBeenCalled();
});
it('reports failure without confirming that the account wallet was saved', async () => {
  (apiFetch as jest.Mock).mockResolvedValue({ ok: false });
  const connected = jest.fn();
  render(<WalletSelectorModal tw={t} onClose={() => {}} onConnected={connected} />);
  await waitFor(() => expect(showError).toHaveBeenCalledWith('action_failed'));
  expect(connected).not.toHaveBeenCalled();
});
