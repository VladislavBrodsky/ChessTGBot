import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { GramBalances } from '@/components/Wallet/GramBalances';
import messages from '@/messages/en.json';
let mockBalanceError = false;
let mockQuote: any = { gram_per_usdt: '0.5', fetched_at: new Date().toISOString(), provider: 'TonAPI', stale: false, display_only: true };
jest.mock('next-intl', () => ({ useLocale: () => 'en', useTranslations: () => (key: string, values: Record<string, string> = {}) => (messages.Gram as Record<string, string>)[key].replace(/\{(\w+)\}/g, (_, name: string) => values[name] ?? name) }));
jest.mock('@/context/UserContext', () => ({ useUser: () => ({ walletBalance: 1250, gramRewardsNano: '500000000', loadingBalance: false, balanceError: mockBalanceError }) }));
jest.mock('@/hooks/useGramQuote', () => ({ useGramQuote: () => ({ quote: mockQuote, loading: false }) }));
jest.mock('@/context/ReducedMotionContext', () => ({ useReducedMotionPreference: () => ({ reducedMotion: true }) }));
beforeEach(() => { mockBalanceError = false; mockQuote = { gram_per_usdt: '0.5', fetched_at: new Date().toISOString(), provider: 'TonAPI', stale: false, display_only: true }; });
test('USDT estimate and exact native reward credits render cleanly without disclaimer', () => {
  render(<GramBalances />);
  expect(screen.getByText('≈ 6.25 GRAM')).toBeVisible();
  expect(screen.getByText('0.5 GRAM')).toBeVisible();
  expect(screen.queryByText(messages.Gram.separate)).not.toBeInTheDocument();
});
test('an unavailable quote never hides or changes earned rewards', () => {
  mockQuote = null;
  render(<GramBalances />);
  expect(screen.getByText(messages.Gram.rate_unavailable)).toBeVisible();
  expect(screen.getByText('0.5 GRAM')).toBeVisible();
  expect(screen.queryByText(/≈/)).not.toBeInTheDocument();
});
test('a failed balance request shows unavailable rather than a false zero', () => {
  mockBalanceError = true;
  render(<GramBalances />);
  expect(screen.getByText('— GRAM')).toBeVisible();
  expect(screen.queryByText('0 GRAM')).not.toBeInTheDocument();
  expect(screen.queryByText('0.5 GRAM')).not.toBeInTheDocument();
});
