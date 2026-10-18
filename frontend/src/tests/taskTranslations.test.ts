import { getTaskTitle, getTaskDescription, formatFallbackTitle } from '@/lib/taskTranslations';

describe('taskTranslations helper', () => {
  it('formats fallback titles cleanly from keys', () => {
    expect(formatFallbackTitle('daily_win_2')).toBe('Win 2 Matches');
    expect(formatFallbackTitle('daily_play_5')).toBe('Play 5 Matches');
    expect(formatFallbackTitle('daily_play_human_2')).toBe('Play 2 PvP Matches');
    expect(formatFallbackTitle('daily_custom_event')).toBe('Custom Event');
  });

  it('uses translator when key exists', () => {
    const t = Object.assign((key: string) => {
      if (key === 'daily_win') return 'Win a Match Localized';
      return `Gamification.${key}`;
    }, {
      has: (key: string) => key === 'daily_win',
    });

    expect(getTaskTitle(t, 'daily_win')).toBe('Win a Match Localized');
  });

  it('intercepts Gamification.prefix missing key glitches and returns readable fallbacks', () => {
    // Simulator for next-intl production behavior when key is not in JSON bundle
    const t = Object.assign((key: string) => `Gamification.${key}`, {
      has: (_key: string) => false,
    });

    expect(getTaskTitle(t, 'daily_win_2')).toBe('Win 2 Matches');
    expect(getTaskTitle(t, 'daily_play_5')).toBe('Play 5 Matches');
    expect(getTaskTitle(t, 'daily_play_human_2')).toBe('Play 2 PvP Matches');
  });

  it('provides description fallbacks when desc key is missing', () => {
    const t = Object.assign((key: string) => `Gamification.${key}`, {
      has: (_key: string) => false,
    });

    expect(getTaskDescription(t, 'daily_win_2')).toBe('Win 2 chess matches today.');
    expect(getTaskDescription(t, 'daily_play_5')).toBe('Complete 5 full matches today.');
  });
});
