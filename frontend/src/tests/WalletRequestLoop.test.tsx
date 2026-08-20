import '@testing-library/jest-dom';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import WalletPage from '@/app/[locale]/wallet/page';
import { apiFetch } from '@/lib/api';
import { useUser } from '@/context/UserContext';

jest.mock('next/link', () => ({ children }: { children: React.ReactNode }) => <>{children}</>);
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => 'en',
}));
jest.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  motion: {
    button: ({ children, onClick }: { children: React.ReactNode; onClick: () => void }) => (
      <button onClick={onClick}>{children}</button>
    ),
  },
}));
jest.mock('@/context/UserContext', () => ({ useUser: jest.fn() }));
jest.mock('@/hooks/useAudio', () => ({ useAudio: () => ({ play: jest.fn() }) }));
jest.mock('@/lib/api', () => ({ apiFetch: jest.fn() }));
jest.mock('@/components/LayoutWrapper', () => ({ children }: { children: React.ReactNode }) => <>{children}</>);
jest.mock('@/components/ui/Card', () => ({ Card: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
jest.mock('@/components/Wallet/CyberCard', () => ({
  __esModule: true,
  default: ({ onRetry }: { onRetry: () => void }) => <button onClick={onRetry}>retry-wallet</button>,
}));
jest.mock('@/components/Wallet/TransactionLedger', () => ({
  __esModule: true,
  default: () => <div>transaction-ledger</div>,
}));
jest.mock('@/components/Wallet/DepositModal', () => ({
  __esModule: true,
  default: ({ onSuccess }: { onSuccess: () => void }) => <button onClick={onSuccess}>complete-deposit</button>,
}));
jest.mock('@/components/Wallet/WithdrawModal', () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock('@/components/Wallet/WalletSelectorModal', () => ({
  __esModule: true,
  default: () => null,
}));

const mockApiFetch = apiFetch as jest.MockedFunction<typeof apiFetch>;
const mockUseUser = useUser as jest.MockedFunction<typeof useUser>;

describe('wallet request lifecycle', () => {
  beforeEach(() => {
    mockApiFetch.mockResolvedValue({
      ok: true,
      json: async () => [],
    } as Response);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('does not revalidate balance on mount or after provider rerenders', async () => {
    const initialSyncBalance = jest.fn().mockResolvedValue({ balance: 1250 });
    let syncBalance = initialSyncBalance;
    let walletBalance = 1250;
    mockUseUser.mockImplementation(() => ({
      walletBalance,
      walletAddress: 'EQ-test',
      stats: null,
      syncBalance,
      syncStats: async () => null,
      loadingBalance: false,
      loadingStats: false,
      balanceError: false,
      statsError: false,
    }) as ReturnType<typeof useUser>);

    const { rerender } = render(<WalletPage />);

    await waitFor(() => {
      expect(mockApiFetch).toHaveBeenCalledTimes(1);
    });
    expect(mockApiFetch).toHaveBeenLastCalledWith('/api/v1/wallet/transactions');
    expect(initialSyncBalance).not.toHaveBeenCalled();

    const rerenderSyncBalance = jest.fn().mockResolvedValue({ balance: 1300 });
    syncBalance = rerenderSyncBalance;
    walletBalance = 1300;
    rerender(<WalletPage />);
    await act(async () => {});

    expect(mockApiFetch).toHaveBeenCalledTimes(1);
    expect(rerenderSyncBalance).not.toHaveBeenCalled();
  });

  it('revalidates balance and transactions once after a successful deposit', async () => {
    const syncBalance = jest.fn().mockResolvedValue({ balance: 1250 });
    mockUseUser.mockReturnValue({
      walletBalance: 1250,
      walletAddress: 'EQ-test',
      stats: null,
      syncBalance,
      syncStats: async () => null,
      loadingBalance: false,
      loadingStats: false,
      balanceError: false,
      statsError: false,
    } as ReturnType<typeof useUser>);

    render(<WalletPage />);
    await waitFor(() => expect(mockApiFetch).toHaveBeenCalledTimes(1));

    fireEvent.click(screen.getByText('deposit'));
    fireEvent.click(screen.getByRole('button', { name: 'complete-deposit' }));

    await waitFor(() => {
      expect(syncBalance).toHaveBeenCalledTimes(1);
      expect(mockApiFetch).toHaveBeenCalledTimes(2);
    });
  });
});
