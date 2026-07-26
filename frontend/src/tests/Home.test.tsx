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

jest.mock('next-intl', () => {
    // jest.mock factories are hoisted above imports, so the helper must be
    // pulled in lazily here — an ESM import would not be initialised yet.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { asTranslator } = require('./testUtils/nextIntlMock');
    const translations = (variables?: any): Record<string, string> => ({
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
    });
    const translate = (key: string, variables?: any) =>
        translations(variables)[key] || key;
    return {
        // `t.has` agrees with the dictionary above: 'combatant' is absent, so
        // the page falls back to its own hardcoded 'Combatant'.
        useTranslations: () =>
            asTranslator(translate, (key: string) => key in translations()),
        useLocale: () => 'en'
    };
});

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
// Mocked because it fetches its claim status on mount, which otherwise
// resolves outside act() after synchronous tests finish rendering.
jest.mock('@/components/DailyCheckinModal', () => () => null);

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

    // Stats row contents were deliberately reverted to win rate + streak in
    // 358125d64; XP/level now live in the XPProgressBar above the row.
    it('renders the win rate, streak, and games played stats row', () => {
        render(<Home />)

        expect(screen.getByText('Win Rate')).toBeInTheDocument()
        expect(screen.getByText('57.1%')).toBeInTheDocument()
        expect(screen.getByText('Current Streak')).toBeInTheDocument()
        expect(screen.getByText('3')).toBeInTheDocument()
        expect(screen.getByText('Games Played')).toBeInTheDocument()
        expect(screen.getByText('28')).toBeInTheDocument()
        expect(screen.getByTestId('xp-progress-bar')).toBeInTheDocument()
        expect(screen.queryByText('16/10/2')).not.toBeInTheDocument()
    })
})
