import '@testing-library/jest-dom';
import type { ReactNode } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import DepositModal from '@/components/Wallet/DepositModal';
import { apiFetch } from '@/lib/api';
import { logTelemetryEvent } from '@/lib/telemetry';
import { useTonWallet } from '@tonconnect/ui-react';

// Card checkout runs in Telegram's browser, outside the Mini App. These tests
// pin what the modal does about it: watch the payment, notice the player coming
// back, credit it exactly once, and fail honestly with a way out.

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

const SESSION = 'cs_test_123';
const reply = (status: number, body: unknown = {}) => ({ ok: status < 400, status, json: async () => body });

let createReply = reply(200, { session_id: SESSION, checkout_url: 'https://checkout.stripe.test/c/1' });
let verifyReplies: Array<ReturnType<typeof reply> | Promise<ReturnType<typeof reply>>> = [];
const verifyCalls = () => (apiFetch as jest.Mock).mock.calls.filter(([url]) => String(url).startsWith('/api/v1/wallet/stripe/verify-session'));
const pending = () => reply(200, { status: 'pending', credited_amount: 950, new_balance: 0 });
const completed = () => reply(200, { status: 'completed', credited_amount: 950, new_balance: 950 });

// The check chain is several promise hops deep; fake timers cannot drain it.
const flush = () => act(async () => { for (let i = 0; i < 12; i++) await Promise.resolve(); });
const advance = (ms: number) => act(async () => { jest.advanceTimersByTime(ms); for (let i = 0; i < 12; i++) await Promise.resolve(); });

const openLink = jest.fn();
const onSuccess = jest.fn();
const renderModal = () => render(<DepositModal onClose={jest.fn()} onSuccess={onSuccess} />);
const startCheckout = async () => { fireEvent.click(screen.getByText('checkout')); await flush(); };

beforeEach(() => {
  jest.useFakeTimers();
  createReply = reply(200, { session_id: SESSION, checkout_url: 'https://checkout.stripe.test/c/1' });
  verifyReplies = [];
  (useTonWallet as jest.Mock).mockReturnValue(null);
  (window as any).Telegram = { WebApp: { openLink } };
  (apiFetch as jest.Mock).mockImplementation((url: string) => {
    if (url.startsWith('/api/v1/wallet/stripe/create-session')) return Promise.resolve(createReply);
    if (url.startsWith('/api/v1/wallet/stripe/verify-session')) return Promise.resolve(verifyReplies.length ? verifyReplies.shift() : pending());
    return Promise.resolve(reply(404));
  });
});
afterEach(() => {
  jest.useRealTimers();
  jest.clearAllMocks();
  window.sessionStorage.clear();
  delete (window as any).Telegram;
});

it('opens checkout, watches the payment, and credits it once when it lands', async () => {
  renderModal();
  await startCheckout();
  expect(openLink).toHaveBeenCalledWith('https://checkout.stripe.test/c/1');
  expect(screen.getByRole('status')).toHaveTextContent('waiting_card_payment');
  expect(JSON.parse(window.sessionStorage.getItem('deposit_pending_stripe')!).sessionId).toBe(SESSION);

  await advance(4000);
  expect(screen.queryByTestId('deposit-success')).not.toBeInTheDocument();

  verifyReplies = [completed()];
  await advance(4000);
  expect(screen.getByTestId('deposit-success')).toHaveTextContent('deposit_credited');
  expect(onSuccess).toHaveBeenCalledTimes(1);
  expect(logTelemetryEvent).toHaveBeenCalledWith('deposit_completed', { method: 'stripe', credited_amount_cents: 950 });
  expect(window.sessionStorage.getItem('deposit_pending_stripe')).toBeNull();

  const callsAtSuccess = verifyCalls().length;
  await advance(30000);
  expect(verifyCalls()).toHaveLength(callsAtSuccess);
  expect(onSuccess).toHaveBeenCalledTimes(1);
});

it('checks the moment the player returns to the app', async () => {
  renderModal();
  await startCheckout();
  const before = verifyCalls().length;
  verifyReplies = [completed()];
  await act(async () => { document.dispatchEvent(new Event('visibilitychange')); for (let i = 0; i < 12; i++) await Promise.resolve(); });
  expect(verifyCalls().length).toBe(before + 1);
  expect(logTelemetryEvent).toHaveBeenCalledWith('deposit_checkout_returned', { session_id: SESSION });
  expect(screen.getByTestId('deposit-success')).toBeInTheDocument();
});

it('lets the player ask for a check, and says so when it is still pending', async () => {
  renderModal();
  await startCheckout();
  const before = verifyCalls().length;
  fireEvent.click(screen.getByRole('button', { name: 'check_payment_now' }));
  await flush();
  expect(verifyCalls().length).toBe(before + 1);
  expect(screen.getByText('pending_transaction')).toBeInTheDocument();
});

it('never runs two checks at once, so one payment is credited and reported once', async () => {
  renderModal();
  await startCheckout();
  let release!: (r: ReturnType<typeof reply>) => void;
  verifyReplies = [new Promise(resolve => { release = resolve; })];
  const before = verifyCalls().length;
  await act(async () => { document.dispatchEvent(new Event('visibilitychange')); });
  await act(async () => { window.dispatchEvent(new Event('focus')); });
  await advance(4000);
  expect(verifyCalls().length).toBe(before + 1);
  await act(async () => { release(completed()); for (let i = 0; i < 12; i++) await Promise.resolve(); });
  expect(onSuccess).toHaveBeenCalledTimes(1);
  expect((logTelemetryEvent as jest.Mock).mock.calls.filter(([name]) => name === 'deposit_completed')).toHaveLength(1);
});

it('resumes a checkout that was still in flight when the modal was closed', async () => {
  window.sessionStorage.setItem('deposit_pending_stripe', JSON.stringify({ sessionId: 'cs_resume', startedAt: Date.now() - 60_000 }));
  verifyReplies = [completed()];
  renderModal();
  await flush();
  expect(verifyCalls()[0][0]).toContain('session_id=cs_resume');
  expect(screen.getByTestId('deposit-success')).toBeInTheDocument();
  expect(onSuccess).toHaveBeenCalledTimes(1);
});

it('ignores a checkout too old to still be live', async () => {
  window.sessionStorage.setItem('deposit_pending_stripe', JSON.stringify({ sessionId: 'cs_old', startedAt: Date.now() - 31 * 60_000 }));
  renderModal();
  await flush();
  expect(verifyCalls()).toHaveLength(0);
  expect(window.sessionStorage.getItem('deposit_pending_stripe')).toBeNull();
  expect(screen.queryByRole('status')).not.toBeInTheDocument();
});

it('stops watching a payment the server has no record of', async () => {
  verifyReplies = [reply(404)];
  renderModal();
  await startCheckout();
  expect(screen.queryByRole('status')).not.toBeInTheDocument();
  expect(window.sessionStorage.getItem('deposit_pending_stripe')).toBeNull();
});

it('gives up after ten minutes, keeps the payment on record, and says it is still pending', async () => {
  renderModal();
  await startCheckout();
  await advance(10 * 60_000 + 4000);
  expect(screen.getByText('pending_transaction')).toBeInTheDocument();
  const callsAfterWindow = verifyCalls().length;
  await advance(60_000);
  expect(verifyCalls()).toHaveLength(callsAfterWindow);
  expect(window.sessionStorage.getItem('deposit_pending_stripe')).not.toBeNull();
});

describe('when card checkout cannot start', () => {
  it('says card is unavailable and offers USDT, which opens the crypto tab', async () => {
    createReply = reply(501, { detail: 'Stripe configuration is missing on server.' });
    renderModal();
    await startCheckout();
    expect(screen.getByText('card_unavailable')).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(openLink).not.toHaveBeenCalled();
    expect(logTelemetryEvent).toHaveBeenCalledWith('deposit_card_failed', { stage: 'create_session', status: 501 });

    fireEvent.click(screen.getByRole('button', { name: 'prefer_crypto' }));
    expect(screen.getByText('connected_deposit')).toBeInTheDocument();
  });

  it('stops leading with the card tab for the rest of the session after a server failure', async () => {
    createReply = reply(500);
    const first = renderModal();
    await startCheckout();
    first.unmount();
    renderModal();
    expect(screen.getAllByText(/^tab_/).map(el => el.textContent)).toEqual(['tab_crypto', 'tab_direct', 'tab_card']);
  });

  it('keeps card first after a rate limit, which clears on its own', async () => {
    createReply = reply(429);
    const first = renderModal();
    await startCheckout();
    expect(screen.getByText('card_rate_limited')).toBeInTheDocument();
    first.unmount();
    renderModal();
    expect(screen.getAllByText(/^tab_/).map(el => el.textContent)[0]).toBe('tab_card');
  });

  it('reports a rejected amount as the minimum, not as a failed deposit', async () => {
    createReply = reply(400);
    renderModal();
    // The card form already shows the minimum as a static label; the rejection adds the error.
    expect(screen.getAllByText('minimum_card')).toHaveLength(1);
    await startCheckout();
    expect(screen.getAllByText('minimum_card')).toHaveLength(2);
    expect(screen.queryByText('card_unavailable')).not.toBeInTheDocument();
  });

  it('treats a network failure like an unavailable card', async () => {
    (apiFetch as jest.Mock).mockImplementation((url: string) =>
      url.startsWith('/api/v1/wallet/stripe/create-session') ? Promise.reject(new Error('offline')) : Promise.resolve(reply(404)));
    renderModal();
    await startCheckout();
    expect(screen.getByText('card_unavailable')).toBeInTheDocument();
    expect(logTelemetryEvent).toHaveBeenCalledWith('deposit_card_failed', { stage: 'network' });
  });
});

it('offers the crypto route from the card tab even before anything has failed', () => {
  renderModal();
  fireEvent.click(screen.getByRole('button', { name: 'prefer_crypto' }));
  expect(screen.getByText('connected_deposit')).toBeInTheDocument();
});
