import '@testing-library/jest-dom';
import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import WithdrawModal, { isValidTonAddress } from '@/components/Wallet/WithdrawModal';
import { apiFetch } from '@/lib/api';

jest.mock('@/components/ui/Drawer', () => ({
  Drawer: ({ children, title }: { children: React.ReactNode; title: string }) => (
    <div data-testid="drawer">
      <h2>{title}</h2>
      {children}
    </div>
  ),
}));

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string, values?: Record<string, string>) => {
    if (values?.amount) return `${key}: ${values.amount}`;
    return key;
  },
}));

jest.mock('@/lib/api', () => ({
  apiFetch: jest.fn(),
}));

jest.mock('@/lib/telegram', () => ({
  telegramHaptic: jest.fn(),
}));

describe('isValidTonAddress', () => {
  it('validates 48-char user-friendly TON addresses (EQ and UQ)', () => {
    expect(isValidTonAddress('EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs')).toBe(true);
    expect(isValidTonAddress('UQD_n02bdxQxFztKTXpWBaFDxo713qIuETyefIeK7wiUB0DN')).toBe(true);
  });

  it('validates raw hex TON addresses', () => {
    const raw64 = '0:' + 'a'.repeat(64);
    expect(isValidTonAddress(raw64)).toBe(true);
  });

  it('rejects invalid or foreign addresses', () => {
    expect(isValidTonAddress('')).toBe(false);
    expect(isValidTonAddress('0x71C...Ethereum')).toBe(false);
    expect(isValidTonAddress('bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq')).toBe(false);
    expect(isValidTonAddress('too_short')).toBe(false);
  });
});

describe('WithdrawModal UX enhancements', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders MAX button and fills full balance when clicked', async () => {
    render(
      <WithdrawModal
        onClose={jest.fn()}
        onSuccess={jest.fn()}
        balance={5000} // $50.00
        initialWithdrawAddress="EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs"
      />
    );

    const maxBtn = screen.getByRole('button', { name: /set maximum withdrawal amount/i });
    expect(maxBtn).toBeInTheDocument();

    fireEvent.click(maxBtn);

    const amountInput = screen.getByPlaceholderText('amount_placeholder') as HTMLInputElement;
    expect(amountInput.value).toBe('50.00');
  });

  it('surfaces specific backend error details on failure', async () => {
    (apiFetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({ detail: 'Daily withdrawal limit reached. You can withdraw up to $5.00 more within 24 hours.' }),
    });

    render(
      <WithdrawModal
        onClose={jest.fn()}
        onSuccess={jest.fn()}
        balance={10000}
        initialWithdrawAddress="EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs"
      />
    );

    // Use connected wallet
    const useConnectedBtn = screen.getByText('Use Connected Wallet');
    fireEvent.click(useConnectedBtn);

    // Check both safety checkboxes
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);
    fireEvent.click(checkboxes[1]);

    // Submit
    const submitBtn = screen.getByRole('button', { name: 'request_withdraw' });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('Daily withdrawal limit reached. You can withdraw up to $5.00 more within 24 hours.')).toBeInTheDocument();
    });
  });
});
