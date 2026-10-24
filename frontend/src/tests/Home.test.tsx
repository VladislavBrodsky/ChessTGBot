import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import Home from '../app/[locale]/home/page'

// Mock the dependencies
jest.mock('next/link', () => {
    return ({ children, href }: { children: React.ReactNode; href?: string }) => {
        return <a href={href}>{children}</a>;
    }
});

let mockWalletBalance = 1000;

jest.mock('next/navigation', () => ({
    useRouter: () => ({
        push: jest.fn(),
        replace: jest.fn(),
        prefetch: jest.fn()
    }),
    usePathname: () => '/en/home',
    useParams: () => ({ locale: 'en' })
}));

jest.mock('next-intl', () => ({
    useTranslations: () => (key: string, variables?: any) => {
        const translations: Record<string, string> = {
            welcome: `Welcome, ${variables?.name || ''}`,
            subtitle: 'FinChess Matrix Protocol',
            elo: 'ELO',
            xp: 'XP',
            level: 'LVL',
            games_played: 'Games Played',
            win_rate: 'Win Rate',
            current_streak: 'Current Streak',
            play: 'Play Chess',
            academy: 'Academy',
            daily_tasks: 'Daily Tasks',
            recent_activity: 'Recent Activity',
            leaderboard: 'Leaderboard',
            vs: 'vs'
        };
        return translations[key] || key;
    },
    useLocale: () => 'en'
}));

jest.mock('@/context/UserContext', () => ({
    useUser: () => ({
        stats: {
            first_name: 'Ada',
            last_name: 'Player',
            photo_url: null,
            is_premium: false,
            elo: 1450,
            xp: 850,
            level: 5,
            games_played: 28,
            win_rate: 57.1,
            current_streak: { count: 3, type: 'loss' },
            wins: 16,
            losses: 10,
            draws: 2,
        },
        walletBalance: mockWalletBalance,
        loadingStats: false,
        balanceError: false,
        statsError: false,
        syncStats: jest.fn(),
    }),
}));

jest.mock('@/lib/api', () => ({
    apiFetch: jest.fn(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ balance: 1000, telegram_id: 12345 })
    }))
}));

jest.mock('@/components/Leaderboard', () => () => <div data-testid="leaderboard">Leaderboard Mock</div>);
jest.mock('@/components/XPProgressBar', () => () => <div data-testid="xp-progress-bar">XPProgressBar Mock</div>);
jest.mock('@/components/LayoutWrapper', () => ({ children }: any) => <div>{children}</div>);
// Mocked because they fetch remote state on mount, which otherwise
// resolves outside act() after synchronous tests finish rendering.
jest.mock('@/components/DailyCheckinModal', () => () => null);
jest.mock('@/components/FirstRunCoordinator', () => () => null);
jest.mock('@/components/game/ArenaBanner', () => () => null);
jest.mock('@/components/EngagementQuest', () => () => null);
// Overlay behavior is covered by its own tests; this suite checks the dashboard.
jest.mock('@/components/ui/Drawer', () => ({ Drawer: ({ isOpen, children }: any) => isOpen ? <div role="dialog">{children}</div> : null }));

// Mock Framer Motion to avoid animation issues in tests
jest.mock('framer-motion', () => ({
    motion: {
        div: ({ children, className }: any) => <div className={className}>{children}</div>,
        button: ({ children, className, onClick }: any) => <button className={className} onClick={onClick}>{children}</button>,
    },
    AnimatePresence: ({ children }: any) => children
}));

describe('Home', () => {
    it('does not present simulated payouts and population counts as live platform activity', () => {
        render(<Home />)
        expect(screen.queryByRole('button', { name: 'Live platform activity' })).not.toBeInTheDocument()
        expect(screen.queryByText(/Grandmasters Online|TON drop|Boxes Today/)).not.toBeInTheDocument()
    })

    it('renders the main dashboard elements', async () => {
        render(<Home />)
        // Check for "Welcome" (from next-intl mock)
        expect(await screen.findByText(/Welcome/i)).toBeInTheDocument()

        // Check for quick links
        expect(screen.getByText(/Play Chess/i)).toBeInTheDocument()
        expect(screen.getByText(/Academy/i)).toBeInTheDocument()
        expect(screen.getAllByText(/Daily Tasks/i).length).toBeGreaterThan(0)
    })

    // Stats row contents were deliberately reverted to win rate + streak in
    // 358125d64; XP/level now live in the XPProgressBar above the row.
    it('renders the win rate, streak, and games played stats row', () => {
        render(<Home />)

        expect(screen.getByText('Win Rate')).toBeInTheDocument()
        expect(screen.getByText('57.1%')).toBeInTheDocument()
        expect(screen.getByText('Current Streak')).toBeInTheDocument()
        expect(screen.getAllByText('3')[0]).toBeInTheDocument()
        expect(screen.getByText('Games Played')).toBeInTheDocument()
        expect(screen.getByText('28')).toBeInTheDocument()
        expect(screen.getByTestId('xp-progress-bar')).toBeInTheDocument()
        expect(screen.queryByText('16/10/2')).not.toBeInTheDocument()
    })

    describe('balance chip', () => {
        afterEach(() => { mockWalletBalance = 1000 })

        it('opens the wallet page when there is a balance to look at or withdraw', () => {
            render(<Home />)
            expect(screen.getByText('$10.00').closest('a')).toHaveAttribute('href', '/en/wallet')
        })

        it('opens the deposit drawer directly when the balance is empty', () => {
            mockWalletBalance = 0
            render(<Home />)
            expect(screen.getByText('$0.00').closest('a')).toHaveAttribute('href', '/en/wallet?deposit=1')
        })
    })
})
