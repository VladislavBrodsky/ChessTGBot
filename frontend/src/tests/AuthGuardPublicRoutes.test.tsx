import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import AuthGuard from '@/components/AuthGuard';

// The card-checkout return page must open for a browser with no session (that
// is the whole point of it); every other app page must still be guarded.

let mockPath = '/en/pay/return';

jest.mock('next/navigation', () => ({ usePathname: () => mockPath }));
jest.mock('next-intl', () => ({ useTranslations: () => (key: string) => key }));
jest.mock('@/components/ui/Backdrop', () => ({ Backdrop: () => null }));
jest.mock('@/lib/e2eTestMode', () => ({ hasE2ETestIdentity: () => false }));
jest.mock('@/lib/sessionAuth', () => ({ getStoredWebAuth: () => '' }));

afterEach(() => { mockPath = '/en/pay/return'; });

it.each(['/en/pay/return', '/ru/pay/return', '/en/login', '/en/qr'])('renders %s for a visitor with no session', (path) => {
  mockPath = path;
  render(<AuthGuard><div>page-content</div></AuthGuard>);
  expect(screen.getByText('page-content')).toBeInTheDocument();
});

it.each(['/en/wallet', '/en/game', '/en/home', '/en/payout'])('still guards %s', (path) => {
  mockPath = path;
  render(<AuthGuard><div>page-content</div></AuthGuard>);
  expect(screen.queryByText('page-content')).not.toBeInTheDocument();
});
