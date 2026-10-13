/** Fictional preview data only. Never used by account, wallet or ranking APIs. */
export type PreviewLadder = 'arena' | 'academy';
export const PREVIEW_FRAMES_PER_DAY = 48;
export const PREVIEW_FRAME_INTERVAL_MS = 30 * 60 * 1_000;

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
  { id: 'nour', name: 'نور إبراهيم', country: 'egypt', gram: 318, xp: 3_740 },
  { id: 'sora', name: '田中 空', country: 'japan', gram: 316, xp: 3_695 },
  { id: 'dmitri', name: 'Дмитрий Орлов', country: 'russia', gram: 314, xp: 3_650 },
  { id: 'isabella', name: 'Isabella Reed', country: 'usa', gram: 312, xp: 3_605 },
  { id: 'youssef', name: 'يوسف بن علي', country: 'morocco', gram: 310, xp: 3_560 },
  { id: 'akira', name: '鈴木 明', country: 'japan', gram: 308, xp: 3_515 },
  { id: 'sofia', name: 'Sofia Wagner', country: 'germany', gram: 306, xp: 3_470 },
  { id: 'khalid', name: 'خالد سالم', country: 'uae', gram: 304, xp: 3_425 },
  { id: 'arjun', name: 'Arjun Shah', country: 'india', gram: 302, xp: 3_380 },
  { id: 'beatriz', name: 'Beatriz Lima', country: 'brazil', gram: 300, xp: 3_335 },
  { id: 'salma', name: 'سلمى عادل', country: 'egypt', gram: 298, xp: 3_290 },
  { id: 'aoi', name: '山本 葵', country: 'japan', gram: 296, xp: 3_245 },
  { id: 'nikita', name: 'Никита Морозов', country: 'russia', gram: 294, xp: 3_200 },
  { id: 'ethan', name: 'Ethan Parker', country: 'usa', gram: 292, xp: 3_155 },
  { id: 'mariam', name: 'مريم الكتاني', country: 'morocco', gram: 290, xp: 3_110 },
  { id: 'ren', name: '中村 蓮', country: 'japan', gram: 288, xp: 3_065 },
  { id: 'jonas', name: 'Jonas Becker', country: 'germany', gram: 286, xp: 3_020 },
  { id: 'fatima', name: 'فاطمة ناصر', country: 'uae', gram: 284, xp: 2_975 },
  { id: 'priya', name: 'Priya Mehta', country: 'india', gram: 282, xp: 2_930 },
  { id: 'rafael', name: 'Rafael Oliveira', country: 'brazil', gram: 280, xp: 2_885 },
  { id: 'hassan', name: 'حسن مصطفى', country: 'egypt', gram: 278, xp: 2_840 },
  { id: 'yui', name: '小林 結衣', country: 'japan', gram: 276, xp: 2_795 },
  { id: 'irina', name: 'Ирина Белова', country: 'russia', gram: 274, xp: 2_750 },
  { id: 'olivia', name: 'Olivia Morgan', country: 'usa', gram: 272, xp: 2_705 },
  { id: 'mehdi', name: 'مهدي العلوي', country: 'morocco', gram: 270, xp: 2_660 },
  { id: 'daichi', name: '伊藤 大地', country: 'japan', gram: 268, xp: 2_615 },
  { id: 'lena', name: 'Lena Fischer', country: 'germany', gram: 266, xp: 2_570 },
  { id: 'rashid', name: 'راشد المنصوري', country: 'uae', gram: 264, xp: 2_525 },
  { id: 'rohan', name: 'Rohan Desai', country: 'india', gram: 262, xp: 2_480 },
  { id: 'camila', name: 'Camila Santos', country: 'brazil', gram: 260, xp: 2_435 },
  { id: 'dalia', name: 'داليا محمود', country: 'egypt', gram: 258, xp: 2_390 },
  { id: 'kaito', name: '渡辺 海斗', country: 'japan', gram: 256, xp: 2_345 },
  { id: 'sergei', name: 'Сергей Козлов', country: 'russia', gram: 254, xp: 2_300 },
  { id: 'noah', name: 'Noah Bennett', country: 'usa', gram: 252, xp: 2_255 },
  { id: 'hind', name: 'هند الإدريسي', country: 'morocco', gram: 250, xp: 2_210 },
  { id: 'misaki', name: '加藤 美咲', country: 'japan', gram: 248, xp: 2_165 },
  { id: 'felix', name: 'Felix Schneider', country: 'germany', gram: 246, xp: 2_120 },
  { id: 'shamsa', name: 'شمسة الكعبي', country: 'uae', gram: 244, xp: 2_075 },
  { id: 'ananya', name: 'Ananya Rao', country: 'india', gram: 242, xp: 2_030 },
  { id: 'lucas', name: 'Lucas Pereira', country: 'brazil', gram: 240, xp: 1_985 },
] as const;

export const PREVIEW_PORTRAIT_IDS = new Set(PREVIEW_PROFILES.slice(0, 10).map(profile => profile.id));

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
  profiles.map(days => {
    const sum = [0];
    for (const gain of days) sum.push(sum[sum.length - 1] + gain);
    return sum;
  }),
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
