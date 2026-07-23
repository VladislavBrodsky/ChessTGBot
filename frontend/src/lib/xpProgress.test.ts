import { getXPProgress } from './xpProgress';

describe('getXPProgress', () => {
    it('uses the progressive level curve for active progress', () => {
        expect(getXPProgress(3926, 8)).toMatchObject({
            displayedLevel: 8,
            earnedLevel: 8,
            currentLevelProgress: 426,
            nextLevelXp: 4200,
            progressPercentage: (426 / 700) * 100,
            isLevelSecured: false,
        });
    });

    it('keeps an earned high-watermark level visibly secured after XP is spent and shows real XP score', () => {
        expect(getXPProgress(3926, 12)).toMatchObject({
            displayedLevel: 12,
            earnedLevel: 8,
            currentLevelProgress: 3926,
            nextLevelXp: 7500,
            progressPercentage: (3926 / 7500) * 100,
            isLevelSecured: true,
        });
    });

    it('normalizes invalid values without producing an invalid progress bar', () => {
        expect(getXPProgress(-10, 0)).toMatchObject({
            displayedLevel: 1,
            earnedLevel: 1,
            currentLevelProgress: 0,
            nextLevelXp: 350,
            progressPercentage: 0,
            isLevelSecured: false,
        });
    });
});
