/** Fictional preview data only. Never used by account, wallet or ranking APIs. */
export type PreviewLadder = 'arena' | 'academy';
export const PREVIEW_FRAMES_PER_DAY = 12;
export const PREVIEW_FRAME_INTERVAL_MS = 5_000;

export const PREVIEW_PROFILES = [
  { id: 'leila', name: 'ليلى منصور', country: 'egypt', gram: 751, xp: 5_180 },
  { id: 'haruto', name: '佐藤 晴人', country: 'japan', gram: 738, xp: 5_020 },
  { id: 'alexandra', name: 'Александра Соколова', country: 'russia', gram: 709, xp: 4_840 },
  { id: 'daniel', name: 'Daniel Brooks', country: 'usa', gram: 682, xp: 4_770 },
  { id: 'amina', name: 'أمينة يوسف', country: 'morocco', gram: 651, xp: 4_620 },
  { id: 'kenji', name: '高橋 健二', country: 'japan', gram: 626, xp: 4_510 },
  { id: 'elena', name: 'Елена Волкова', country: 'germany', gram: 593, xp: 4_290 },
  { id: 'omar', name: 'عمر حسن', country: 'uae', gram: 540, xp: 4_180 },
  { id: 'maya', name: 'Maya Patel', country: 'india', gram: 427, xp: 3_980 },
  { id: 'gabriel', name: 'Gabriel Costa', country: 'brazil', gram: 319, xp: 3_820 },
] as const;

type PreviewProfile = (typeof PREVIEW_PROFILES)[number];
export interface PreviewStanding {
  profile: PreviewProfile;
  score: number;
  rank: number;
  rankChange: number;
  dailyGain: number;
}

/** A repeatable daily simulation, separate from any real XP award. */
export function previewDailyXP(profileIndex: number, day: number): number {
  return 200 + ((profileIndex * 97 + day * 131 + profileIndex * day * 53) % 401);
}

/** Illustrative growth only; never an event from a real game or wallet. */
export function previewDailyGRAM(profileIndex: number, day: number): number {
  return 12 + ((profileIndex * 43 + day * (29 + profileIndex * 7)) % 64);
}

// Prefix sums keep progression bounded in computation, without a yearly reset.
const budgets = {
  arena: PREVIEW_PROFILES.map((_, index) => Array.from({ length: 64 }, (_, day) => previewDailyGRAM(index, day))),
  academy: PREVIEW_PROFILES.map((_, index) => Array.from({ length: 401 }, (_, day) => previewDailyXP(index, day))),
};
const totals = Object.fromEntries(Object.entries(budgets).map(([ladder, profiles]) => [ladder,
  profiles.map(days => days.reduce<number[]>((sum, gain) => [...sum, sum[sum.length - 1] + gain], [0])),
])) as Record<PreviewLadder, number[][]>;

function normalizedFrame(frame: number): number {
  return Number.isFinite(frame) ? Math.max(0, Math.min(Math.floor(frame), Math.floor(Number.MAX_SAFE_INTEGER / 1_000))) : 0;
}

export function previewDay(frame: number): number {
  return Math.floor(normalizedFrame(frame) / PREVIEW_FRAMES_PER_DAY) + 1;
}

function scoresAt(frame: number, ladder: PreviewLadder) {
  const day = Math.floor(frame / PREVIEW_FRAMES_PER_DAY);
  const fraction = (frame % PREVIEW_FRAMES_PER_DAY) / PREVIEW_FRAMES_PER_DAY;
  return PREVIEW_PROFILES.map((profile, index) => {
    const days = budgets[ladder][index];
    const prefix = totals[ladder][index];
    const cycle = Math.floor(day / days.length);
    const dayInCycle = day % days.length;
    const dailyGain = days[dayInCycle];
    const growth = cycle * prefix[days.length] + prefix[dayInCycle] + Math.floor(dailyGain * fraction);
    return {
      profile,
      score: (ladder === 'arena' ? profile.gram : profile.xp) + growth,
      dailyGain,
    };
  }).sort((a, b) => b.score - a.score || a.profile.id.localeCompare(b.profile.id));
}

export function previewStandings(frame: number, ladder: PreviewLadder): PreviewStanding[] {
  const current = normalizedFrame(frame);
  const previous = new Map(scoresAt(Math.max(0, current - 1), ladder).map((entry, index) => [entry.profile.id, index + 1]));
  return scoresAt(current, ladder).map((entry, index) => ({
    ...entry,
    rank: index + 1,
    rankChange: (previous.get(entry.profile.id) ?? index + 1) - (index + 1),
  }));
}
