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
            subtitle: 'Neural Matrix Protocol',
            elo: 'ELO',
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
})

