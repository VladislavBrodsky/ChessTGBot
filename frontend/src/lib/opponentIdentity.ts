export type AiLevel = 'easy' | 'medium' | 'hard';

export interface OpponentLabels {
  /** "A.I. Coach" */
  aiCoach: string;
  /** Neutral label for a player whose profile has no name. */
  opponent: string;
  /** Localized level names. */
  level: Record<AiLevel, string>;
}

interface OpponentState {
  black_player_id?: number | null;
  white_username?: string | null;
  black_username?: string | null;
  white_elo?: number | null;
  black_elo?: number | null;
  difficulty?: string | null;
}

export interface OpponentIdentity {
  name: string;
  /** Second line of the player card: the A.I. level, or the opponent's rating. */
  detail: string;
  isBot: boolean;
}

/**
 * Who the player is up against, shown as what it is: the practice engine with its level, or the real opponent.
 * Nothing here invents a human name, flag or rating; a missing profile name falls back to a neutral label.
 */
export function opponentIdentity(state: OpponentState | null | undefined, playerIsWhite: boolean, labels: OpponentLabels): OpponentIdentity {
  const isBot = state?.black_player_id === -1;
  if (isBot) {
    const level: AiLevel = state?.difficulty === 'easy' || state?.difficulty === 'hard' ? state.difficulty : 'medium';
    return { name: labels.aiCoach, detail: labels.level[level], isBot: true };
  }
  const name = (playerIsWhite ? state?.black_username : state?.white_username)?.trim();
  const elo = playerIsWhite ? state?.black_elo : state?.white_elo;
  return { name: name || labels.opponent, detail: `ELO ${Number.isFinite(elo) ? elo : '—'}`, isBot: false };
}
