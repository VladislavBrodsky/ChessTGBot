import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import AdminPage from '@/app/[locale]/admin/page';
import { useSWRFetch } from '@/hooks/useSWRFetch';

jest.mock('@/hooks/useSWRFetch', () => ({
  useSWRFetch: jest.fn(),
}));

jest.mock('@/components/LayoutWrapper', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('framer-motion', () => {
  const StaticElement = ({
    children,
    initial: _initial,
    animate: _animate,
    exit: _exit,
    transition: _transition,
    whileHover: _whileHover,
    whileTap: _whileTap,
    ...props
  }: React.HTMLAttributes<HTMLElement> & Record<string, unknown>) => {
    void _initial;
    void _animate;
    void _exit;
    void _transition;
    void _whileHover;
    void _whileTap;
    return <div {...props}>{children}</div>;
  };

  return {
    motion: { div: StaticElement, p: StaticElement },
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  };
});

jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace: jest.fn() }),
}));

const mockUseSWRFetch = useSWRFetch as jest.MockedFunction<typeof useSWRFetch>;

function renderTransactionsTab(transactionResult: ReturnType<typeof useSWRFetch>) {
  mockUseSWRFetch.mockImplementation((key) => (
    typeof key === 'string' && key.startsWith('/api/v1/admin/transactions?')
      ? transactionResult
      : {
          data: undefined,
          error: undefined,
          isLoading: false,
          isValidating: false,
          mutate: jest.fn(),
        } as ReturnType<typeof useSWRFetch>
  ));

  render(<AdminPage />);
  fireEvent.click(screen.getByRole('button', { name: 'Transactions' }));
}

describe('admin transactions tab', () => {
  it('shows a retry action instead of the empty state when the initial request fails', () => {
    const retry = jest.fn();
    renderTransactionsTab({
      data: undefined,
      error: new Error('network failure'),
      isLoading: false,
      isValidating: false,
      mutate: retry,
    } as ReturnType<typeof useSWRFetch>);

    expect(screen.getByRole('alert')).toHaveTextContent("Couldn't load transactions");
    expect(screen.queryByText('No transactions')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(retry).toHaveBeenCalledTimes(1);
  });

  it('keeps the genuine empty state when the request succeeds with no rows', () => {
    renderTransactionsTab({
      data: { transactions: [], total: 0 },
      error: undefined,
      isLoading: false,
      isValidating: false,
      mutate: jest.fn(),
    } as ReturnType<typeof useSWRFetch>);

    expect(screen.getByText('No transactions')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('keeps stale rows visible and offers retry when a background refresh fails', () => {
    const retry = jest.fn();
    renderTransactionsTab({
      data: {
        transactions: [{
          id: 42,
          user_id: 7,
          type: 'deposit',
          amount_cents: 1000,
          fee_cents: 0,
          status: 'completed',
          reference_id: 'ref_7',
          created_at: '2026-07-14T12:00:00Z',
        }],
        total: 1,
      },
      error: new Error('refresh failure'),
      isLoading: false,
      isValidating: false,
      mutate: retry,
    } as ReturnType<typeof useSWRFetch>);

    expect(screen.getByRole('alert')).toHaveTextContent("Couldn't refresh transactions");
    expect(screen.getByText('ref_7')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(retry).toHaveBeenCalledTimes(1);
  });
});
