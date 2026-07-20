/**
 * Frontend representation of the progression contract in
 * backend/app/services/gamification_service.py.
 *
 * XP can be spent in the marketplace after a level is earned, so `level` is
 * intentionally a high-watermark. A secured level is not shown as an empty
 * or partially-filled bar: its milestone remains complete.
 */
export const XP_PER_LEVEL = 350;

export interface XPProgress {
    displayedLevel: number;
    earnedLevel: number;
    currentLevelProgress: number;
    nextLevelXp: number;
    progressPercentage: number;
    isLevelSecured: boolean;
}

export function getXPProgress(xp: number, recordedLevel?: number): XPProgress {
    const safeXp = Number.isFinite(xp) ? Math.max(0, Math.floor(xp)) : 0;
    
    // Calculate earnedLevel and cumulative start XP of that level
    let earnedLevel = 1;
    let cumulativeXp = 0;
    while (true) {
        const nextLevelCost = 350 + (earnedLevel - 1) * 50;
        if (cumulativeXp + nextLevelCost > safeXp) {
            break;
        }
        cumulativeXp += nextLevelCost;
        earnedLevel += 1;
    }
    
    const safeRecordedLevel = Number.isFinite(recordedLevel)
        ? Math.max(1, Math.floor(recordedLevel as number))
        : 1;
    const displayedLevel = Math.max(safeRecordedLevel, earnedLevel);
    const isLevelSecured = displayedLevel > earnedLevel;

    // Calculate next level cost and start XP for the displayed level
    let displayedLevelStartXp = 0;
    for (let i = 1; i < displayedLevel; i++) {
        displayedLevelStartXp += 350 + (i - 1) * 50;
    }
    const displayedLevelCost = 350 + (displayedLevel - 1) * 50;
    const nextLevelXp = displayedLevelStartXp + displayedLevelCost;

    if (isLevelSecured) {
        // High watermark level secured after spending XP
        const currentLevelProgress = safeXp;
        const progressPercentage = Math.min(100, Math.max(0, (safeXp / nextLevelXp) * 100));

        return {
            displayedLevel,
            earnedLevel,
            currentLevelProgress,
            nextLevelXp,
            progressPercentage,
            isLevelSecured: true,
        };
    }

    // Normal progression within current tier
    const progressInTier = safeXp - displayedLevelStartXp;
    const currentLevelProgress = Math.max(0, progressInTier);
    const progressPercentage = Math.min(100, Math.max(0, (currentLevelProgress / displayedLevelCost) * 100));

    return {
        displayedLevel,
        earnedLevel,
        currentLevelProgress,
        nextLevelXp,
        progressPercentage,
        isLevelSecured: false,
    };
}
