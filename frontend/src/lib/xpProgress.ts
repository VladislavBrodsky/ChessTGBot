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
    const currentLevelProgress = isLevelSecured ? XP_PER_LEVEL : safeXp % XP_PER_LEVEL;

    return {
        displayedLevel,
        earnedLevel,
        currentLevelProgress,
        nextLevelXp: displayedLevel * XP_PER_LEVEL,
        progressPercentage: (currentLevelProgress / XP_PER_LEVEL) * 100,
        isLevelSecured,
    };
}
