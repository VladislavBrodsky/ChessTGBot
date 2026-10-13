import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Leaderboard from '@/components/Leaderboard';
import mockMessages from '@/messages/en.json';

let mockPreviewAllowed = false;
const mockTrackEvent = jest.fn();
const mockAPIReads = jest.fn();
jest.mock('@/lib/leaderboardPreviewAccess', () => ({ isLeaderboardPreviewAllowed: () => mockPreviewAllowed }));
jest.mock('next-intl', () => ({
  useLocale: () => 'en',
  useTranslations: (namespace: string) => (key: string, values: Record<string, unknown> = {}) => {
    const text = (mockMessages as unknown as Record<string, Record<string, string>>)[namespace][key];
    return text.replace(/\{(\w+)\}/g, (_match: string, name: string) => String(values[name] ?? name));
  },
}));
jest.mock('@/hooks/useSWRFetch', () => ({ useSWRFetch: (url: string) => {
  mockAPIReads(url);
  return {
  isLoading: false,
  data: [{ telegram_id: 42, first_name: 'API player', elo: 1425, xp: 600, rank: 1, games_played: 10, win_rate: 60, study_streak: 2 }],
  endpoint: url,
}; } }));
jest.mock('@/hooks/useTelemetry', () => ({ useTelemetry: () => ({ trackEvent: mockTrackEvent }) }));
jest.mock('@/lib/api', () => ({ getFullPhotoUrl: (src: string) => src }));
jest.mock('next/dynamic', () => ({ __esModule: true, default: () => function Preview() { return <p>Sample preview content</p>; } }));
jest.mock('@/components/ui/Card', () => ({ Card: ({ children }: any) => <div>{children}</div> }));
jest.mock('@/components/ui/Drawer', () => ({ Drawer: ({ isOpen, children, title }: any) => isOpen ? <div role="dialog">{title}{children}</div> : null }));
jest.mock('@/components/ui/Button', () => ({ Button: ({ children, onClick }: any) => <button onClick={onClick}>{children}</button> }));
jest.mock('@/components/ui/SegmentedControl', () => ({ SegmentedControl: ({ options, onChange }: any) => <div>{options.map((option: any) => <button key={option.value} onClick={() => onChange(option.value)}>{option.label}</button>)}</div> }));

describe('Production leaderboard presentation', () => {
  beforeEach(() => mockAPIReads.mockClear());
  it('keeps API standings and has no sample entry or Drawer when access is denied', () => {
    mockPreviewAllowed = false;
    render(<Leaderboard />);
    expect(screen.getByText('API player')).toBeVisible();
    expect(screen.getByText('1,425')).toBeVisible();
    expect(screen.getByText('ELO')).toBeVisible();
    expect(screen.queryByRole('button', { name: mockMessages.LeaderboardPreview.open })).not.toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.queryByText(/GRAM/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: mockMessages.Index.nav_learn }));
    expect(screen.getByText('600')).toBeVisible();
    expect(screen.getByText('XP')).toBeVisible();
  });

  it('shows the local preview directly without rendering or fetching API standings', () => {
    mockPreviewAllowed = true;
    render(<Leaderboard />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByText('Sample preview content')).toBeVisible();
    expect(screen.queryByText('API player')).not.toBeInTheDocument();
    expect(screen.queryByText('ELO')).not.toBeInTheDocument();
    expect(mockAPIReads).not.toHaveBeenCalled();
  });
});
