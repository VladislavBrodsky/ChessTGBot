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
    const earnedLevel = Math.floor(safeXp / XP_PER_LEVEL) + 1;
    const safeRecordedLevel = Number.isFinite(recordedLevel)
        ? Math.max(1, Math.floor(recordedLevel as number))
        : 1;
    const displayedLevel = Math.max(safeRecordedLevel, earnedLevel);
    const isLevelSecured = displayedLevel > earnedLevel;
    const nextLevelXp = displayedLevel * XP_PER_LEVEL;
    
    // Calculate progress within the current tier
    const tierStartXp = (displayedLevel - 1) * XP_PER_LEVEL;
    const progressInTier = safeXp - tierStartXp;
    
    // If they spent XP and dropped below their current level tier (debt),
    // return their real current total XP for currentLevelProgress and compute
    // progress toward nextLevelXp so the UI displays their actual score and real progress.
    const currentLevelProgress = isLevelSecured ? safeXp : Math.max(0, progressInTier);
    const progressPercentage = isLevelSecured
        ? Math.min(100, Math.max(0, (safeXp / nextLevelXp) * 100))
        : Math.min(100, Math.max(0, (currentLevelProgress / XP_PER_LEVEL) * 100));

    return {
        displayedLevel,
        earnedLevel,
        currentLevelProgress,
        nextLevelXp,
        progressPercentage,
        isLevelSecured,
    };
}
