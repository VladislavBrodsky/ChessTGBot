import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import Home from '../app/[locale]/home/page'

// Mock the dependencies
jest.mock('next/link', () => {
    return ({ children }: { children: React.ReactNode }) => {
        return children;
    }
});

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
        walletBalance: 1000,
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
jest.mock('@/components/NewsSection', () => () => <div data-testid="news-section">NewsSection Mock</div>);
jest.mock('@/components/XPProgressBar', () => () => <div data-testid="xp-progress-bar">XPProgressBar Mock</div>);
jest.mock('@/components/LayoutWrapper', () => ({ children }: any) => <div>{children}</div>);

// Mock Framer Motion to avoid animation issues in tests
jest.mock('framer-motion', () => ({
    motion: {
        div: ({ children, className }: any) => <div className={className}>{children}</div>,
        button: ({ children, className, onClick }: any) => <button className={className} onClick={onClick}>{children}</button>,
    },
    AnimatePresence: ({ children }: any) => children
}));

describe('Home', () => {
    it('renders the main dashboard elements', async () => {
        render(<Home />)
        // Check for "Welcome" (from next-intl mock)
        expect(await screen.findByText(/Welcome/i)).toBeInTheDocument()

        // Check for quick links
        expect(screen.getByText(/Play Chess/i)).toBeInTheDocument()
        expect(screen.getByText(/Academy/i)).toBeInTheDocument()
        expect(screen.getByText(/Daily Tasks/i)).toBeInTheDocument()
    })

    it('frames the home summary around progress instead of negative results', () => {
        render(<Home />)

        expect(screen.getByText('XP')).toBeInTheDocument()
        expect(screen.getByText('850')).toBeInTheDocument()
        expect(screen.getByText('LVL')).toBeInTheDocument()
        expect(screen.getByText('5')).toBeInTheDocument()
        expect(screen.getByText('Games Played')).toBeInTheDocument()
        expect(screen.getByText('28')).toBeInTheDocument()
        expect(screen.queryByText('Win Rate')).not.toBeInTheDocument()
        expect(screen.queryByText('Current Streak')).not.toBeInTheDocument()
        expect(screen.queryByText('16/10/2')).not.toBeInTheDocument()
    })
})
