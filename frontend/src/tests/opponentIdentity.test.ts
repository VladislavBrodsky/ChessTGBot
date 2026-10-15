import { opponentIdentity, type OpponentLabels } from '@/lib/opponentIdentity';

const labels: OpponentLabels = { aiCoach: 'A.I. Coach', opponent: 'Opponent', level: { easy: 'Easy', medium: 'Medium', hard: 'Hard' } };

describe('opponentIdentity', () => {
  it('shows a practice game as the A.I. engine with its level, never a human persona', () => {
    const state = { black_player_id: -1, black_username: 'AI Engine (Hard)', black_elo: 1600, difficulty: 'hard' };
    expect(opponentIdentity(state, true, labels)).toEqual({ name: 'A.I. Coach', detail: 'Hard', isBot: true });
  });

  it('defaults an unknown level to medium', () => {
    expect(opponentIdentity({ black_player_id: -1 }, true, labels).detail).toBe('Medium');
    expect(opponentIdentity({ black_player_id: -1, difficulty: 'nightmare' }, true, labels).detail).toBe('Medium');
  });

  it('shows the real opponent from either side of the board', () => {
    const state = { black_player_id: 22, white_username: 'Alexandra', black_username: 'Mikhail', white_elo: 1450, black_elo: 1520 };
    expect(opponentIdentity(state, true, labels)).toEqual({ name: 'Mikhail', detail: 'ELO 1520', isBot: false });
    expect(opponentIdentity(state, false, labels)).toEqual({ name: 'Alexandra', detail: 'ELO 1450', isBot: false });
  });

  it('falls back to a neutral label, never an invented name, rating or flag', () => {
    const result = opponentIdentity({ black_player_id: 22, black_username: '  ', black_elo: undefined }, true, labels);
    expect(result).toEqual({ name: 'Opponent', detail: 'ELO —', isBot: false });
    expect(opponentIdentity(null, true, labels)).toEqual({ name: 'Opponent', detail: 'ELO —', isBot: false });
  });
});
