import { translatorFor as mockTranslatorFor } from './testUtils/messagesMock';
import '@testing-library/jest-dom';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { shareInvitation } from '@/lib/invitations';
import ReferralDashboard from '@/components/ReferralDashboard';

jest.mock('next-intl', () => ({ useLocale: () => 'en', useTranslations: (namespace: string) => mockTranslatorFor(namespace) }));
jest.mock('next/link', () => ({ __esModule: true, default: ({ children, ...props }: any) => <a {...props}>{children}</a> }));
jest.mock('@/context/UserContext', () => ({ useUser: () => ({ stats: { referral_code: 'abc123', bot_username: 'chess_bot' }, syncStats: jest.fn() }) }));
jest.mock('@/context/ReducedMotionContext', () => ({ useReducedMotionPreference: () => ({ reducedMotion: true }) }));
jest.mock('@/lib/telegram', () => ({ telegramHaptic: jest.fn() }));
jest.mock('@/lib/clipboard', () => ({ copyToClipboard: jest.fn().mockResolvedValue(true) }));
jest.mock('@/lib/invitations', () => ({ mainMiniAppLink: (bot: string, param: string) => `https://t.me/${bot}?startapp=${param}`, shareInvitation: jest.fn() }));
let mockData: Record<string, unknown> | undefined;
jest.mock('@/hooks/useSWRFetch', () => ({ useSWRFetch: () => ({ data: mockData, error: undefined, isLoading: false, mutate: jest.fn() }) }));

const stats = { total_referrals: 3, active_referrals: 2, total_earnings_usdt: 1.25, earnings_chart: [], qualifying_min_moves: 10, gram_rewards_nano: '1000000000', gram_rewarded_referrals: 1 };
beforeEach(() => { mockData = { ...stats }; });

it('shows earnings as a short dollar value with no wrapping unit or dangling separator', () => {
  render(<ReferralDashboard />);
  expect(screen.getByText('$1.25')).toBeVisible();
  expect(screen.getByText('Earnings')).toBeVisible();
  expect(screen.queryByText(/Earnings\s*·/)).not.toBeInTheDocument();
});

it('lays the qualification rules out as numbered steps instead of a paragraph', () => {
  render(<ReferralDashboard />);
  const card = screen.getByRole('heading', { name: 'Earn 1 GRAM per qualified friend' }).closest('div[class*="space-y-3"]') as HTMLElement;
  const steps = within(card).getAllByRole('listitem');
  expect(steps.map(step => step.textContent)).toEqual([
    'Join through your link',
    'Deposit USDT',
    'Complete 3 human wager matchesEach qualifying match needs at least 10 individual moves.',
  ]);
  expect(within(card).getByText('The reward is credited once, after qualification.')).toBeVisible();
  expect(within(card).getByText('Your friend needs to')).toBeVisible();
});

it('summarises what has been earned and how many friends qualified', () => {
  const { rerender } = render(<ReferralDashboard />);
  expect(screen.getByText('Earned')).toBeVisible();
  expect(screen.getByText('1 GRAM')).toBeVisible();
  expect(screen.getByText('1 friend qualified')).toBeVisible();
  mockData = { ...stats, gram_rewarded_referrals: 3, gram_rewards_nano: '3000000000' };
  rerender(<ReferralDashboard />);
  expect(screen.getByText('3 friends qualified')).toBeVisible();
});

it('omits the move hint when the server does not say how many moves qualify', () => {
  mockData = { ...stats, qualifying_min_moves: undefined };
  render(<ReferralDashboard />);
  expect(screen.queryByText(/individual moves/)).not.toBeInTheDocument();
});

it('asks the friend to send a play request when sharing the personal ref_ link', () => {
  render(<ReferralDashboard />);
  fireEvent.click(screen.getByRole('button', { name: 'Share in Telegram' }));
  expect(shareInvitation).toHaveBeenCalledWith(
    'https://t.me/chess_bot?startapp=ref_abc123',
    'Let’s play free chess — open my invitation and send me a play request',
  );
});
