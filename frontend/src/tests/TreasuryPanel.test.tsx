import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import TreasuryPanel from '@/components/TreasuryPanel';
import { apiFetch } from '@/lib/api';

const mutate = jest.fn();
let mockPosition: Record<string, unknown> | undefined;
jest.mock('@/hooks/useSWRFetch', () => ({ useSWRFetch: () => ({ data: mockPosition, mutate, error: undefined }) }));
jest.mock('@/lib/api', () => ({ apiFetch: jest.fn() }));

const base = {
  onchain_usdt_usd: 60, player_balances_usd: 20, unsent_withdrawals_usd: 5, held_stakes_usd: 1,
  open_pots_usd: 4, recent_sweeps_usd: 0, reserve_usd: 10, total_owed_usd: 30,
  available_profit_usd: 20, swept_to_date_usd: 0, company_wallet_address: 'UQcompany',
  sweep_blocked_reason: null, onchain_error: null,
};
const respond = (ok: boolean, body: object) => ({ ok, json: async () => body });

beforeEach(() => { mockPosition = { ...base }; jest.clearAllMocks(); });

it('shows the profit breakdown and what is available', () => {
  render(<TreasuryPanel />);
  expect(screen.getByText('$20.00', { selector: '.text-xl' })).toBeInTheDocument();
  expect(screen.getByText('− Open game pots')).toBeInTheDocument();
  expect(screen.getByText('To: UQcompany')).toBeInTheDocument();
});

it('previews first and sends only after an explicit confirm', async () => {
  (apiFetch as jest.Mock)
    .mockResolvedValueOnce(respond(true, { ...base, sweep_amount_usd: 20, sent: false }))
    .mockResolvedValueOnce(respond(true, { ...base, sweep_amount_usd: 20, sent: true, status: 'completed' }));
  render(<TreasuryPanel />);

  fireEvent.click(screen.getByRole('button', { name: 'Sweep profit…' }));
  await screen.findByRole('alertdialog');
  expect(JSON.parse((apiFetch as jest.Mock).mock.calls[0][1].body)).toEqual({ confirm: false });

  fireEvent.click(screen.getByRole('button', { name: 'Confirm sweep' }));
  await screen.findByText(/Sent \$20\.00 to the company wallet/);
  expect(JSON.parse((apiFetch as jest.Mock).mock.calls[1][1].body)).toEqual({ confirm: true });
  expect(mutate).toHaveBeenCalled();
});

it('cancel sends nothing', async () => {
  (apiFetch as jest.Mock).mockResolvedValueOnce(respond(true, { ...base, sweep_amount_usd: 20 }));
  render(<TreasuryPanel />);
  fireEvent.click(screen.getByRole('button', { name: 'Sweep profit…' }));
  fireEvent.click(await screen.findByRole('button', { name: 'Cancel' }));
  await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument());
  expect(apiFetch).toHaveBeenCalledTimes(1);
});

it('is disabled with the reason when no separate company wallet is set', () => {
  mockPosition = { ...base, sweep_blocked_reason: 'COMPANY_WALLET_ADDRESS must be a different wallet from MASTER_WALLET_ADDRESS' };
  render(<TreasuryPanel />);
  expect(screen.getByRole('button', { name: 'Sweep profit…' })).toBeDisabled();
  expect(screen.getByText(/must be a different wallet/)).toBeInTheDocument();
});

it('is disabled when there is nothing to sweep', () => {
  mockPosition = { ...base, available_profit_usd: 0 };
  render(<TreasuryPanel />);
  expect(screen.getByRole('button', { name: 'Sweep profit…' })).toBeDisabled();
});

it('shows the server refusal and keeps nothing pending', async () => {
  (apiFetch as jest.Mock).mockResolvedValueOnce(respond(false, { detail: 'Nothing to sweep: available profit is $0.00' }));
  render(<TreasuryPanel />);
  fireEvent.click(screen.getByRole('button', { name: 'Sweep profit…' }));
  await screen.findByText(/Nothing to sweep/);
  expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
});
