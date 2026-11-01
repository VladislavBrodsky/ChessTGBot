import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import { translatorFor as mockTranslatorFor } from './testUtils/messagesMock';
import { BalanceOpportunity } from '@/components/game/BalanceOpportunity';
let mockWallet = { walletBalance: 0, loadingBalance: false, balanceError: false, syncBalance: jest.fn() };
jest.mock('next-intl', () => ({ useLocale: () => 'en', useTranslations: (ns: string) => mockTranslatorFor(ns) }));
jest.mock('next/navigation', () => ({ useRouter: () => ({ push: jest.fn() }) }));
jest.mock('@/context/UserContext', () => ({ useUser: () => mockWallet }));
jest.mock('@/components/ui/Drawer', () => ({ Drawer: ({ isOpen, children }: any) => isOpen ? <div>{children}</div> : null }));
jest.mock('@/components/ReferralDashboard', () => ({ __esModule: true, default: () => <div>Referral dashboard</div> }));
jest.mock('@/components/game/AiDifficultyDrawer', () => ({ __esModule: true, default: () => <div>AI practice</div> }));
jest.mock('@/lib/telemetry', () => ({ logTelemetryEvent: jest.fn() }));
jest.mock('@/lib/telegram', () => ({ telegramHaptic: jest.fn() }));
beforeEach(() => { mockWallet = { walletBalance: 0, loadingBalance: false, balanceError: false, syncBalance: jest.fn() }; });
it.each([[0,100,'1.00'],[99,100,'0.01'],[100,500,'4.00']])('shows selected-stake shortfall at balance %i', (balance,stake,amount) => {
 mockWallet.walletBalance=balance;
 const topup=jest.fn(); render(<BalanceOpportunity stake={stake} source="test" onTopUp={topup} />);
 expect(screen.getByText(`Add ${amount} USDT for this match`)).toBeVisible();
 fireEvent.click(screen.getByText('Top up')); expect(topup).toHaveBeenCalledTimes(1);
 fireEvent.click(screen.getByText('Invite friends & earn rewards')); expect(screen.getByText('Referral dashboard')).toBeVisible();
});
it.each([{walletBalance:100}, {loadingBalance:true}, {balanceError:true}])('does not offer based on sufficient or unavailable balance %o', changes => {
 Object.assign(mockWallet, changes); render(<BalanceOpportunity stake={100} source="test" onTopUp={jest.fn()} />);
 expect(screen.queryByText('Top up')).not.toBeInTheDocument();
});
it('offers free AI practice without treating GRAM as wager funds', () => {
 render(<BalanceOpportunity stake={100} source="test" onTopUp={jest.fn()} />);
 expect(screen.getByText('GRAM rewards are separate from your USDT wager balance')).toBeVisible();
 fireEvent.click(screen.getByText('Practise free against AI')); expect(screen.getByText('AI practice')).toBeVisible();
});
