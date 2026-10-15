import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import RecentDrops, { relativeTime, type RecentDrop } from '@/components/Marketplace/RecentDrops';
import messages from '@/messages/en.json';

jest.mock('next-intl', () => ({
  useLocale: () => 'en',
  useTranslations: () => (key: string) => (messages.Marketplace as Record<string, string>)[key],
}));

const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto', style: 'short' });
const NOW = Date.UTC(2026, 9, 15, 12, 0, 0);

describe('relativeTime', () => {
  it('reads naturally across the units', () => {
    expect(relativeTime(NOW, NOW, rtf)).toBe('now');
    expect(relativeTime(NOW - 5 * 60_000, NOW, rtf)).toBe('5 min. ago');
    expect(relativeTime(NOW - 3 * 3_600_000, NOW, rtf)).toBe('3 hr. ago');
    expect(relativeTime(NOW - 2 * 86_400_000, NOW, rtf)).toBe('2 days ago');
  });
});

describe('RecentDrops', () => {
  const drops: RecentDrop[] = [
    { name: '1-Week VIP Access', type: 'vip', tier: 'rare', at: Date.now() - 10 * 60_000 },
    { name: 'Gold Profile Border', type: 'cosmetic', tier: 'epic', at: Date.now() - 2 * 3_600_000 },
  ];

  it('renders nothing until the player has a real drop', () => {
    const { container } = render(<RecentDrops drops={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('lists only the player’s own drops, with localized relative times', () => {
    render(<RecentDrops drops={drops} />);
    expect(screen.getByRole('heading', { name: messages.Marketplace.recent_drops })).toBeVisible();
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    expect(screen.getByText('1-Week VIP Access')).toBeVisible();
    expect(screen.getByText('10 min. ago')).toBeVisible();
  });

  it('never shows invented winners or a live/realtime claim', () => {
    render(<RecentDrops drops={drops} />);
    for (const invented of ['Grandmaster_Alex', 'Elena_Knight', 'TON_Strategist', 'CheckmatePro']) expect(screen.queryByText(invented)).not.toBeInTheDocument();
    expect(screen.queryByText(/live drops|realtime/i)).not.toBeInTheDocument();
  });
});
