import '@testing-library/jest-dom';
import { act, render, screen, waitFor } from '@testing-library/react';
import { UserProvider, useUser } from '@/context/UserContext';
import { useSWRFetch } from '@/hooks/useSWRFetch';
import { getInitDataNow, waitForInitData } from '@/lib/telegramAuth';

jest.mock('next/navigation', () => ({ usePathname: () => '/en/home' }));
jest.mock('@/hooks/useSWRFetch', () => ({ useSWRFetch: jest.fn() }));
jest.mock('@/lib/telegramAuth', () => ({ getInitDataNow: jest.fn(), waitForInitData: jest.fn() }));

const mockFetch = useSWRFetch as jest.Mock;
const mockCredential = getInitDataNow as jest.Mock;
const mockWait = waitForInitData as jest.Mock;

function AccountName() {
  const { stats } = useUser();
  return <span>{stats?.first_name || 'Waiting for account'}</span>;
}

it('starts profile and balance requests when the Telegram SDK arrives after first render', async () => {
  let releaseCredential: (credential: string) => void = () => {};
  const credentialReady = new Promise<string>(resolve => { releaseCredential = resolve; });
  mockCredential.mockReturnValue('');
  mockWait.mockReturnValue(credentialReady);
  mockFetch.mockImplementation((key: unknown) => ({
    data: key === '/api/v1/wallet/balance' ? { balance: 1250, wallet_address: 'EQ-test' }
      : Array.isArray(key) ? { first_name: 'Ada' } : undefined,
    error: null,
    isLoading: false,
    mutate: async () => null,
  }));

  render(<UserProvider><AccountName /></UserProvider>);
  expect(screen.getByText('Waiting for account')).toBeInTheDocument();
  expect(mockFetch).not.toHaveBeenCalledWith('/api/v1/wallet/balance', expect.anything());

  await act(async () => { releaseCredential('signed-init-data'); await credentialReady; });
  await waitFor(() => expect(screen.getByText('Ada')).toBeInTheDocument());
  expect(mockFetch).toHaveBeenCalledWith('/api/v1/wallet/balance', expect.anything());
  expect(mockWait).toHaveBeenCalledTimes(1);
});
