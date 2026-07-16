import { getXPProgress, XP_PER_LEVEL } from './xpProgress';

describe('getXPProgress', () => {
    it('uses the canonical 350-XP level curve for active progress', () => {
        expect(getXPProgress(3926, 12)).toMatchObject({
            displayedLevel: 12,
            earnedLevel: 12,
            currentLevelProgress: 76,
            nextLevelXp: 4200,
            progressPercentage: (76 / XP_PER_LEVEL) * 100,
            isLevelSecured: false,
        });
    });

    it('keeps an earned high-watermark level visibly secured after XP is spent', () => {
        expect(getXPProgress(3926, 41)).toMatchObject({
            displayedLevel: 41,
            earnedLevel: 12,
            currentLevelProgress: XP_PER_LEVEL,
            progressPercentage: 100,
            isLevelSecured: true,
        });
    });

    it('normalizes invalid values without producing an invalid progress bar', () => {
        expect(getXPProgress(-10, 0)).toMatchObject({
            displayedLevel: 1,
            earnedLevel: 1,
            currentLevelProgress: 0,
            progressPercentage: 0,
            isLevelSecured: false,
        });
    });
});
