/**
 * Resolves task title and description with fallbacks for zero visual glitches.
 * If next-intl is missing a key (during deploy rollouts or client cache transitions),
 * returns human-readable titles instead of raw "Gamification.xyz" namespace tokens.
 */

const TASK_TITLE_FALLBACKS: Record<string, string> = {
  daily_login: 'Daily Check-in',
  daily_play: 'Play a Match',
  daily_win: 'Win a Match',
  daily_play_human: 'Play vs a Human',
  daily_win_2: 'Win 2 Matches',
  daily_play_5: 'Play 5 Matches',
  daily_play_human_2: 'Play 2 PvP Matches',
  ach_first_win: 'First Victory',
  ach_win_10: 'Novice Victor',
  ach_play_25: 'Chess Enthusiast',
  ach_refer_1: 'First Blood',
  ach_refer_3: 'Socializer',
  ach_refer_5: 'Network Builder',
  ach_refer_10: 'Network Titan',
  ach_refer_25: 'Viral Master',
  ach_win_50: 'Champion',
  ach_play_100: 'Grandmaster',
  ach_play_1: 'First Battle',
  ach_play_3: 'Warming Up',
  ach_play_5: 'Tactician',
  ach_play_50: 'Veteran',
  ach_play_200: 'Master',
  ach_play_300: 'Legend',
  join_channel: 'Subscribe to Channel',
  join_chat: 'Join Telegram Chat',
  add_to_home_screen: 'Add to Home Screen',
};

const TASK_DESC_FALLBACKS: Record<string, string> = {
  daily_login: 'Log in to the app today.',
  daily_play: 'Complete a full match.',
  daily_win: 'Win a chess match today.',
  daily_play_human: 'Play a match against a real person.',
  daily_win_2: 'Win 2 chess matches today.',
  daily_play_5: 'Complete 5 full matches today.',
  daily_play_human_2: 'Play 2 matches against real opponents.',
};

export function formatFallbackTitle(key: string): string {
  if (TASK_TITLE_FALLBACKS[key]) return TASK_TITLE_FALLBACKS[key];
  return key
    .replace(/^(daily_|ach_)/, '')
    .split('_')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export function getTaskTitle(
  t: { has?: (key: string) => boolean; (key: string): string },
  titleKey: string
): string {
  try {
    if (typeof t.has === 'function' && t.has(titleKey)) {
      const res = t(titleKey);
      if (res && !res.startsWith('Gamification.')) return res;
    }
    const res = t(titleKey);
    if (res && !res.startsWith('Gamification.')) return res;
  } catch {
    // next-intl throws if missing in strict mode
  }
  return TASK_TITLE_FALLBACKS[titleKey] || formatFallbackTitle(titleKey);
}

export function getTaskDescription(
  t: { has?: (key: string) => boolean; (key: string): string },
  titleKey: string
): string {
  const descKey = `${titleKey}_desc`;
  try {
    if (typeof t.has === 'function' && t.has(descKey)) {
      const res = t(descKey);
      if (res && !res.startsWith('Gamification.')) return res;
    }
    const res = t(descKey);
    if (res && !res.startsWith('Gamification.')) return res;
  } catch {
    // next-intl throws if missing in strict mode
  }
  return TASK_DESC_FALLBACKS[titleKey] || '';
}
