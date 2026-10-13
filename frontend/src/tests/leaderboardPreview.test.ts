import { PREVIEW_PROFILES, PREVIEW_PORTRAIT_IDS, PREVIEW_FRAMES_PER_DAY, previewDailyXP, previewDailyGRAM, previewStandings } from '@/lib/leaderboardPreview';
import fs from 'fs';
import path from 'path';

describe('fictional leaderboard simulation', () => {
  it('keeps fifty stable fictional identities with Arabic, Japanese, Cyrillic and Latin names', () => {
    expect(new Set(PREVIEW_PROFILES.map(profile => profile.id)).size).toBe(50);
    const names = PREVIEW_PROFILES.map(profile => profile.name).join(' ');
    for (const alphabet of [/[\u0600-\u06ff]/, /[\u4e00-\u9fff]/, /[\u0400-\u04ff]/, /[a-z]/i]) expect(names).toMatch(alphabet);
  });

  it('starts within the requested GRAM range, grows monotonically and changes ranks', () => {
    const starting = previewStandings(0, 'arena').map(entry => entry.profile.id);
    expect(previewStandings(0, 'arena').every(entry => entry.score >= 211 && entry.score <= 849)).toBe(true);
    let previous = new Map(previewStandings(0, 'arena').map(entry => [entry.profile.id, entry.score]));
    let changed = false;
    for (let frame = 0; frame < 120; frame++) {
      const standings = previewStandings(frame, 'arena');
      expect(standings).toHaveLength(50);
      expect(standings.map(entry => entry.rank)).toEqual(Array.from({ length: 50 }, (_, index) => index + 1));
      expect(new Set(standings.map(entry => entry.profile.id))).toEqual(new Set(starting));
      expect(standings.every(entry => entry.score >= previous.get(entry.profile.id)!)).toBe(true);
      previous = new Map(standings.map(entry => [entry.profile.id, entry.score]));
      if (standings.some((entry, index) => entry.profile.id !== starting[index])) changed = true;
    }
    expect(changed).toBe(true);
  });

  it('adds the exact GRAM daily budget and continues growing past day 365', () => {
    for (const day of [0, 1, 13, 63, 64, 364, 365, 1_000]) {
      const before = new Map(previewStandings(day * PREVIEW_FRAMES_PER_DAY, 'arena').map(entry => [entry.profile.id, entry.score]));
      previewStandings((day + 1) * PREVIEW_FRAMES_PER_DAY, 'arena').forEach(entry => {
        const index = PREVIEW_PROFILES.findIndex(profile => profile.id === entry.profile.id);
        expect(entry.score - before.get(entry.profile.id)!).toBe(previewDailyGRAM(index, day));
      });
    }
  });

  it('grants exactly the simulated 200–600 XP budget to every profile between day boundaries', () => {
    for (const day of [...Array.from({ length: 14 }, (_, day) => day), 364, 365, 400, 401, 1_000]) {
      const previous = new Map(previewStandings(day * PREVIEW_FRAMES_PER_DAY, 'academy').map(entry => [entry.profile.id, entry.score]));
      const next = previewStandings((day + 1) * PREVIEW_FRAMES_PER_DAY, 'academy');
      next.forEach(entry => {
        const index = PREVIEW_PROFILES.findIndex(profile => profile.id === entry.profile.id);
        const increase = entry.score - previous.get(entry.profile.id)!;
        expect(increase).toBe(previewDailyXP(index, day));
        expect(increase).toBeGreaterThanOrEqual(200);
        expect(increase).toBeLessThanOrEqual(600);
      });
    }
  });

  it('is repeatable, handles invalid frames and does not mutate the supplied profiles', () => {
    const before = JSON.stringify(PREVIEW_PROFILES);
    expect(previewStandings(12, 'arena')).toEqual(previewStandings(12, 'arena'));
    expect(previewStandings(NaN, 'academy')).toEqual(previewStandings(0, 'academy'));
    expect(previewStandings(-1, 'arena')).toEqual(previewStandings(0, 'arena'));
    expect(JSON.stringify(PREVIEW_PROFILES)).toBe(before);
  });

  it('has translated country labels and disclosures in every locale', () => {
    const directory = path.join(__dirname, '../messages');
    for (const file of fs.readdirSync(directory).filter(name => name.endsWith('.json'))) {
      const messages = JSON.parse(fs.readFileSync(path.join(directory, file), 'utf8')).LeaderboardPreview;
      expect(messages.disclosure.trim()).not.toBe('');
      expect(messages.footnote.trim()).not.toBe('');
      PREVIEW_PROFILES.forEach(profile => expect(typeof messages[profile.country]).toBe('string'));
    }
  });

  it('ships every original portrait as a small local WebP asset', () => {
    const directory = path.join(__dirname, '../../public/images/leaderboard-preview');
    let totalBytes = 0;
    expect(PREVIEW_PORTRAIT_IDS.size).toBe(10);
    for (const profile of PREVIEW_PROFILES.filter(profile => PREVIEW_PORTRAIT_IDS.has(profile.id))) {
      const image = fs.readFileSync(path.join(directory, `${profile.id}.webp`));
      expect(image.subarray(0, 4).toString()).toBe('RIFF');
      expect(image.subarray(8, 12).toString()).toBe('WEBP');
      totalBytes += image.length;
    }
    expect(totalBytes).toBeLessThan(100_000);
  });
});
