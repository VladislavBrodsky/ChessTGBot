import { fireEvent, render, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import Leaderboard from '@/components/Leaderboard';
import mockMessages from '@/messages/en.json';

const mockTrackEvent = jest.fn();
let mockArenaPlayers: any[] = [];
let mockAcademyPlayers: any[] = [];

jest.mock('next-intl', () => ({
  useLocale: () => 'en',
  useTranslations: (ns: string) => {
    const catalog = (mockMessages as unknown as Record<string, Record<string, string>>)[ns] ?? {};
    return (key: string, values: Record<string, unknown> = {}) => {
      const text = catalog[key] ?? key;
      return text.replace(/\{(\w+)\}/g, (_, name: string) => String(values[name] ?? name));
    };
  },
}));

jest.mock('@/hooks/useSWRFetch', () => ({
  useSWRFetch: (url: string) => {
    if (url.includes('/gram')) {
      return { data: { players: mockArenaPlayers }, isLoading: false };
    }
    if (url.includes('/academy')) {
      return { data: mockAcademyPlayers, isLoading: false };
    }
    return { data: undefined, isLoading: false };
  },
}));

jest.mock('@/context/ReducedMotionContext', () => ({
  useReducedMotionPreference: () => ({ reducedMotion: true }),
}));

jest.mock('@/hooks/useTelemetry', () => ({
  useTelemetry: () => ({ trackEvent: mockTrackEvent }),
}));

jest.mock('@/lib/api', () => ({
  getFullPhotoUrl: (src: string) => src,
}));

jest.mock('@/components/ui/Drawer', () => ({
  Drawer: ({ isOpen, children, title, onClose }: any) =>
    isOpen ? (
      <div role="dialog" aria-label={title}>
        <button onClick={onClose}>Close</button>
        {children}
      </div>
    ) : null,
}));

describe('Production Unified Leaderboard (Marketing & Real Player Sync)', () => {
  beforeEach(() => {
    mockTrackEvent.mockClear();
    mockArenaPlayers = [];
    mockAcademyPlayers = [];
  });

  it('renders marketing demo players as baseline activity when no real players exist', () => {
    render(<Leaderboard />);
    expect(screen.getByText('佐藤 晴人')).toBeVisible();
    expect(screen.getByText('ليلى منصور')).toBeVisible();
    expect(screen.getByText('Александра Соколова')).toBeVisible();
    expect(screen.queryByText('Demo')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Live standings/i })).not.toBeInTheDocument();
  });

  it('ranks a real player at #1 if their GRAM stat is higher than demo players', () => {
    mockArenaPlayers = [
      {
        telegram_id: 101,
        first_name: 'Grand',
        last_name: 'Master',
        gram_value: '999',
        photo_url: 'https://example.com/avatar.jpg',
      },
    ];

    render(<Leaderboard />);

    expect(screen.getByText('Grand Master')).toBeVisible();
    expect(screen.getByLabelText('+999 GRAM')).toBeInTheDocument();

    const podiumSlot = screen.getByText('Grand Master').closest('.podium__slot');
    expect(podiumSlot).toBeInTheDocument();
    expect(within(podiumSlot as HTMLElement).getByLabelText('Simulated rank 1')).toBeInTheDocument();
  });

  it('slots real players with intermediate stats in their rightful rank among demo players', () => {
    mockArenaPlayers = [
      {
        telegram_id: 202,
        first_name: 'Mid',
        last_name: 'Contender',
        gram_value: '700',
      },
    ];

    render(<Leaderboard />);

    expect(screen.getByText('Mid Contender')).toBeVisible();
    expect(screen.getByLabelText('+700 GRAM')).toBeInTheDocument();
    const row = screen.getByText('Mid Contender').closest('li');
    expect(row).toBeInTheDocument();
    expect(within(row!).getByText('4')).toBeInTheDocument();
  });

  it('switches to Scholars XP tab and syncs real academy stats with demo players', () => {
    mockAcademyPlayers = [
      {
        telegram_id: 303,
        first_name: 'Scholar',
        last_name: 'Pro',
        xp: 9999,
        study_streak: 15,
      },
    ];

    render(<Leaderboard />);

    fireEvent.click(screen.getByRole('tab', { name: 'Scholars · XP' }));

    expect(screen.getByText('Scholar Pro')).toBeVisible();
    expect(screen.getByLabelText('9,999 XP')).toBeInTheDocument();

    const podiumSlot = screen.getByText('Scholar Pro').closest('.podium__slot');
    expect(podiumSlot).toBeInTheDocument();
    expect(within(podiumSlot as HTMLElement).getByLabelText('Simulated rank 1')).toBeInTheDocument();
  });

  it('opens Top 50 drawer containing mixed real and demo contenders', () => {
    mockArenaPlayers = [
      {
        telegram_id: 404,
        first_name: 'RealChampion',
        gram_value: '1500',
      },
    ];

    render(<Leaderboard />);

    fireEvent.click(screen.getByRole('button', { name: 'Show Top 50' }));

    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText('RealChampion')).toBeVisible();
    expect(within(dialog).getByText('Daniel Brooks')).toBeVisible();
  });
});
