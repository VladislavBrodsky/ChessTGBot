import { act, renderHook } from '@testing-library/react';
import { useGameSocket } from '../hooks/useGameSocket';
import { getSocket } from '../lib/socket';

jest.mock('../lib/socket', () => ({ getSocket: jest.fn() }));
jest.mock('../lib/logger', () => ({ logClientMessage: jest.fn() }));

// The server plays the Free Coach (socket_events._schedule_coach_turn). A
// client that also sent the coach's move arrived after the server had already
// moved, got "Illegal move" back and flashed a red warning at the player after
// every coach reply (263 times across 12 of 13 practice games, Nov 14-19 2026).
describe('Free Coach moves are server-only', () => {
  const realFetch = global.fetch;
  // No network in unit tests: a client-side engine that tried to download
  // Stockfish fails fast and drops to its offline fallback, so a reintroduced
  // client coach shows up as an emitted move instead of a hung test.
  beforeEach(() => { global.fetch = jest.fn(() => Promise.reject(new Error('offline'))) as unknown as typeof fetch; });
  afterEach(() => { global.fetch = realFetch; jest.useRealTimers(); jest.clearAllMocks(); });

  function mountGame() {
    jest.useFakeTimers();
    const listeners = new Map<string, (value?: any) => void>();
    const socket = {
      connected: true,
      emit: jest.fn(),
      on: jest.fn((event: string, callback: (value?: any) => void) => { listeners.set(event, callback); }),
      off: jest.fn((event: string) => { listeners.delete(event); }),
    };
    (getSocket as jest.Mock).mockReturnValue(socket);
    const hook = renderHook(() => useGameSocket('coach-game'));
    const moves = () => socket.emit.mock.calls.filter(([event]) => event === 'make_move');
    return { hook, listeners, moves };
  }

  it('never emits a move on the coach turn', async () => {
    const { hook, listeners, moves } = mountGame();
    act(() => listeners.get('game_state')?.({
      fen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1',
      turn: 'b', is_game_over: false, white_player_id: 42, black_player_id: -1, difficulty: 'easy',
    }));
    // Async advance also settles promises, so a client engine that answers
    // after a "thinking" delay would be caught here.
    await act(async () => { await jest.advanceTimersByTimeAsync(10_000); });
    expect(moves()).toHaveLength(0);
    hook.unmount();
  });

  it('still sends the player own move', () => {
    const { hook, listeners, moves } = mountGame();
    act(() => listeners.get('game_state')?.({
      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      turn: 'w', is_game_over: false, white_player_id: 42, black_player_id: -1,
    }));
    act(() => { hook.result.current.makeMove({ from: 'e2', to: 'e4' }); });
    expect(moves()).toEqual([['make_move', { game_id: 'coach-game', uci: 'e2e4' }]]);
    hook.unmount();
  });
});
