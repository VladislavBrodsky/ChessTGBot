import { fireEvent, render, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import '@testing-library/jest-dom';
import Leaderboard from '@/components/Leaderboard';
import mockMessages from '@/messages/en.json';
const mockTrackEvent = jest.fn(), mockAPIReads = jest.fn();
let mockEmpty = false;
jest.mock('next-intl', () => ({ useLocale: () => 'en', useTranslations: (ns: string) => (key: string, values: Record<string, unknown> = {}) => {
 const text = (mockMessages as unknown as Record<string, Record<string, string>>)[ns][key];
 return text.replace(/\{(\w+)\}/g, (_, name: string) => String(values[name] ?? name));
} }));
jest.mock('@/hooks/useSWRFetch', () => ({ useSWRFetch: (url: string) => {
 mockAPIReads(url);
 return { isLoading: false, data: url.endsWith('/gram') ? { quote: { gram_per_usdt: '0.5', fetched_at: new Date().toISOString(), provider: 'TonAPI', display_only: true, stale: false }, players: mockEmpty ? [] : [{ telegram_id: 42, first_name: 'API player', gram_value: '12.5', rank: 1 }] } : [{ telegram_id: 42, first_name: 'API player', xp: 600, rank: 1, study_streak: 2 }] };
} }));
jest.mock('@/context/ReducedMotionContext', () => ({ useReducedMotionPreference: () => ({ reducedMotion: true }) }));
jest.mock('@/hooks/useTelemetry', () => ({ useTelemetry: () => ({ trackEvent: mockTrackEvent }) }));
jest.mock('@/lib/api', () => ({ getFullPhotoUrl: (src: string) => src }));
jest.mock('@/components/leaderboard/LeaderboardPreview', () => ({ __esModule: true, default: () => <div><p>Demo — Generated profiles and GRAM/XP figures.</p><p>Portrait preview content</p></div> }));
jest.mock('@/components/ui/Card', () => ({ Card: ({ children }: any) => <div>{children}</div> }));
jest.mock('@/components/ui/Drawer', () => ({ Drawer: ({ isOpen, children, title }: any) => isOpen ? <div role="dialog">{title}{children}</div> : null }));
jest.mock('@/components/ui/SegmentedControl', () => ({ SegmentedControl: ({ options, onChange }: any) => <div>{options.map((o: any) => <button key={o.value} onClick={() => onChange(o.value)}>{o.label}</button>)}</div> }));
beforeEach(() => { mockAPIReads.mockClear(); mockEmpty = false; });
it('shows the disclosed portrait preview immediately without any API request', () => {
 render(<Leaderboard />);
 expect(screen.getByText('Portrait preview content')).toBeVisible(); expect(screen.getByText(/Demo — Generated/)).toBeVisible();
 expect(mockAPIReads).not.toHaveBeenCalled(); expect(screen.queryByText('API player')).not.toBeInTheDocument();
});
it('includes the preview on the initial server render instead of depending on a development hostname', () => {
 const html = renderToString(<Leaderboard />);
 expect(html).toContain('Portrait preview content'); expect(html).toContain('Generated profiles and GRAM/XP figures.'); expect(mockAPIReads).not.toHaveBeenCalled();
});
it('opens real opted-in standings separately and restores the preview on return', () => {
 render(<Leaderboard />); fireEvent.click(screen.getByRole('button', { name: mockMessages.LeaderboardPreview.live_view }));
 expect(screen.getByText('API player')).toBeVisible(); expect(screen.getByText('≈ 12.5 GRAM')).toBeVisible();
 expect(screen.getByText('Portrait preview content')).not.toBeVisible(); expect(screen.queryByText('ELO')).not.toBeInTheDocument();
 fireEvent.click(screen.getByRole('button', { name: mockMessages.Index.nav_learn })); expect(screen.getByText('600 XP')).toBeVisible();
 fireEvent.click(screen.getByRole('button', { name: mockMessages.LeaderboardPreview.back_to_preview }));
 expect(screen.getByText('Portrait preview content')).toBeVisible(); expect(screen.queryByText('API player')).not.toBeInTheDocument();
});
it('provides the preview even if the real leaderboard has no shared balances', () => {
 mockEmpty = true; render(<Leaderboard />); expect(screen.getByText('Portrait preview content')).toBeVisible();
 fireEvent.click(screen.getByRole('button', { name: mockMessages.LeaderboardPreview.live_view })); expect(screen.getByText(mockMessages.Gram.ranking_empty)).toBeVisible();
 fireEvent.click(screen.getByRole('button', { name: mockMessages.LeaderboardPreview.back_to_preview })); expect(screen.getByText('Portrait preview content')).toBeVisible();
});
