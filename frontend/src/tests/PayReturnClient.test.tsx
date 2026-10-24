import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import PayReturnClient from '@/app/[locale]/pay/return/PayReturnClient';
import { getStoredWebAuth } from '@/lib/sessionAuth';
import { hardRedirect } from '@/lib/hardRedirect';

// Stripe returns the player here in Telegram's browser, which has no Mini App
// session. The page must say what happened and where to go, claim nothing it
// cannot know about the balance, and hand a signed-in browser back to the wallet.

let mockQuery: Record<string, string> = {};
let mockLocale = 'en';

jest.mock('next/navigation', () => ({ useSearchParams: () => ({ get: (k: string) => mockQuery[k] ?? null }) }));
jest.mock('next-intl', () => ({ useLocale: () => mockLocale, useTranslations: () => (key: string) => key }));
jest.mock('@/lib/sessionAuth', () => ({ getStoredWebAuth: jest.fn() }));
jest.mock('@/lib/hardRedirect', () => ({ hardRedirect: jest.fn() }));

const replace = hardRedirect as jest.Mock;

beforeEach(() => {
  mockQuery = {};
  mockLocale = 'en';
  (getStoredWebAuth as jest.Mock).mockReturnValue('');
});
afterEach(() => {
  jest.clearAllMocks();
  delete (window as any).Telegram;
  delete process.env.NEXT_PUBLIC_BOT_USERNAME;
});

describe('with no session in this browser', () => {
  it('tells the player their payment was submitted, without claiming the balance changed', () => {
    mockQuery = { status: 'success', session_id: 'cs_live_abc' };
    render(<PayReturnClient />);
    expect(screen.getByRole('heading')).toHaveTextContent('title_success');
    expect(screen.getByText('body_success')).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });

  it('says nothing was charged when the player cancelled', () => {
    mockQuery = { status: 'cancel' };
    render(<PayReturnClient />);
    expect(screen.getByRole('heading')).toHaveTextContent('title_cancel');
    expect(screen.getByText('body_cancel')).toBeInTheDocument();
  });

  it('stays neutral for a missing or unrecognised status', () => {
    mockQuery = { status: 'anything-else' };
    render(<PayReturnClient />);
    expect(screen.getByRole('heading')).toHaveTextContent('title_unknown');
  });

  it('links back into the Mini App through the main app link', () => {
    render(<PayReturnClient />);
    expect(screen.getByRole('link', { name: /open_app/ })).toHaveAttribute('href', 'https://t.me/chess_matbot?startapp=home');
  });

  it('uses the configured bot username', () => {
    process.env.NEXT_PUBLIC_BOT_USERNAME = '@my_chess_bot';
    render(<PayReturnClient />);
    expect(screen.getByRole('link', { name: /open_app/ })).toHaveAttribute('href', 'https://t.me/my_chess_bot?startapp=home');
  });
});

describe('with a session in this browser', () => {
  it('sends a Telegram session back to the wallet to verify the payment', () => {
    (window as any).Telegram = { WebApp: { initData: 'query_id=1' } };
    mockQuery = { status: 'success', session_id: 'cs_live_abc' };
    const { container } = render(<PayReturnClient />);
    expect(replace).toHaveBeenCalledWith('/en/wallet?status=success&session_id=cs_live_abc');
    expect(container).toBeEmptyDOMElement();
  });

  it('does the same for a desktop web login, in the player\'s own locale', () => {
    (getStoredWebAuth as jest.Mock).mockReturnValue('web-auth');
    mockLocale = 'ru';
    mockQuery = { status: 'success', session_id: 'cs_test_123' };
    render(<PayReturnClient />);
    expect(replace).toHaveBeenCalledWith('/ru/wallet?status=success&session_id=cs_test_123');
  });

  it('opens the plain wallet after a cancel', () => {
    (getStoredWebAuth as jest.Mock).mockReturnValue('web-auth');
    mockQuery = { status: 'cancel' };
    render(<PayReturnClient />);
    expect(replace).toHaveBeenCalledWith('/en/wallet');
  });

  it('never forwards a malformed session id', () => {
    (getStoredWebAuth as jest.Mock).mockReturnValue('web-auth');
    mockQuery = { status: 'success', session_id: '../../admin?x=<script>' };
    render(<PayReturnClient />);
    expect(replace).toHaveBeenCalledWith('/en/wallet');
  });
});
