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
    // clamp the visual percentage to 0% so it's not misleading, but return 
    // their total XP so the UI can display exact deficit.
    const currentLevelProgress = isLevelSecured ? XP_PER_LEVEL : progressInTier;
    const progressPercentage = isLevelSecured ? 100 : Math.max(0, (progressInTier / XP_PER_LEVEL) * 100);

    return {
        displayedLevel,
        earnedLevel,
        currentLevelProgress,
        nextLevelXp,
        progressPercentage,
        isLevelSecured,
    };
}
