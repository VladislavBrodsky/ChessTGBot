export const MIN_ONLINE = 1374;
export const MAX_ONLINE = 3278;

/** Preserve the production marketing counter algorithm with one serialized SSR snapshot. */
export function socialProofSnapshot(now = new Date()) {
  const minute = now.getUTCMinutes();
  const timeVal = (now.getUTCHours() * 60 + minute) / (24 * 60);
  const wave = (Math.sin((timeVal - 0.28) * 2 * Math.PI) + 1) / 2;
  const base = MIN_ONLINE + Math.floor(wave * (MAX_ONLINE - MIN_ONLINE - 140));
  const jitter = ((now.getDate() * 19 + minute * 13) % 71) - 35;
  return {
    count: Math.min(MAX_ONLINE, Math.max(MIN_ONLINE, base + jitter)),
    hourSlot: Math.floor(now.getTime() / (1000 * 60 * 60)),
  };
}
