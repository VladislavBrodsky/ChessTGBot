'use client';

export interface SimulatedOpponent {
  id: string;
  name: string;
  elo: number;
  country: string;
  flag: string;
  initials: string;
  gradient: string;
  accentColor: string;
}

export const REALISTIC_OPPONENTS: SimulatedOpponent[] = [
  { id: 'elena_r', name: 'Elena_R', elo: 1380, country: 'Germany', flag: '🇩🇪', initials: 'ER', gradient: 'from-blue-600/25 to-indigo-600/25', accentColor: 'text-blue-400' },
  { id: 'viktor_k', name: 'Viktor_K', elo: 1440, country: 'Armenia', flag: '🇦🇲', initials: 'VK', gradient: 'from-amber-600/25 to-orange-600/25', accentColor: 'text-amber-400' },
  { id: 'david_chess', name: 'DavidChess', elo: 1320, country: 'United Kingdom', flag: '🇬🇧', initials: 'DC', gradient: 'from-emerald-600/25 to-teal-600/25', accentColor: 'text-emerald-400' },
  { id: 'lucas_gm', name: 'Lucas_GM', elo: 1490, country: 'Brazil', flag: '🇧🇷', initials: 'LM', gradient: 'from-yellow-600/25 to-emerald-600/25', accentColor: 'text-yellow-400' },
  { id: 'sophie_k', name: 'Sophie_K', elo: 1360, country: 'France', flag: '🇫🇷', initials: 'SK', gradient: 'from-purple-600/25 to-pink-600/25', accentColor: 'text-purple-400' },
  { id: 'alex_petrov', name: 'Alex_Petrov', elo: 1460, country: 'Poland', flag: '🇵🇱', initials: 'AP', gradient: 'from-rose-600/25 to-red-600/25', accentColor: 'text-rose-400' },
  { id: 'mateo_g', name: 'Mateo_G', elo: 1350, country: 'Spain', flag: '🇪🇸', initials: 'MG', gradient: 'from-orange-600/25 to-amber-600/25', accentColor: 'text-orange-400' },
  { id: 'kenji_t', name: 'Kenji_T', elo: 1410, country: 'Japan', flag: '🇯🇵', initials: 'KT', gradient: 'from-red-600/25 to-rose-600/25', accentColor: 'text-red-400' },
  { id: 'dmitry_b', name: 'Dmitry_B', elo: 1470, country: 'Uzbekistan', flag: '🇺🇿', initials: 'DB', gradient: 'from-cyan-600/25 to-blue-600/25', accentColor: 'text-cyan-400' },
  { id: 'magnus_n', name: 'Magnus_Nord', elo: 1540, country: 'Norway', flag: '🇳🇴', initials: 'MN', gradient: 'from-indigo-600/25 to-sky-600/25', accentColor: 'text-sky-400' },
  { id: 'marcus_v', name: 'Marcus_V', elo: 1430, country: 'Sweden', flag: '🇸🇪', initials: 'MV', gradient: 'from-blue-600/25 to-yellow-600/25', accentColor: 'text-blue-400' },
  { id: 'anna_schmidt', name: 'Anna_Schmidt', elo: 1390, country: 'Austria', flag: '🇦🇹', initials: 'AS', gradient: 'from-rose-600/25 to-red-600/25', accentColor: 'text-rose-400' },
];

export function getRandomOpponent(userElo?: number): SimulatedOpponent {
  const targetElo = userElo && userElo > 0 ? userElo : 1200;
  // Match opponents within a realistic bracket of +/- 200 ELO
  const closeCandidates = REALISTIC_OPPONENTS.filter(op => Math.abs(op.elo - targetElo) <= 220);
  const pool = closeCandidates.length > 0 ? closeCandidates : REALISTIC_OPPONENTS;
  const picked = pool[Math.floor(Math.random() * pool.length)];
  
  // Slightly calibrate opponent's display ELO around player's rating for realism
  const variance = Math.floor(Math.random() * 61) - 30; // -30 to +30
  const adjustedElo = Math.max(950, Math.min(2200, picked.elo + variance));
  return {
    ...picked,
    elo: adjustedElo,
  };
}

export function saveGameOpponent(gameId: string, opponent: SimulatedOpponent): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(`chess_match_opponent_${gameId}`, JSON.stringify(opponent));
  } catch (err) {
    console.warn('Failed to save opponent to sessionStorage:', err);
  }
}

export function getGameOpponent(gameId: string): SimulatedOpponent | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(`chess_match_opponent_${gameId}`);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn('Failed to parse opponent from sessionStorage:', err);
  }
  return null;
}
