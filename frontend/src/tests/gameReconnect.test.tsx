import { act, renderHook } from '@testing-library/react';
import { useGameSocket } from '../hooks/useGameSocket';
import { getSocket } from '../lib/socket';

jest.mock('../lib/socket', () => ({ getSocket: jest.fn() }));
jest.mock('../lib/logger', () => ({ logClientMessage: jest.fn() }));

describe('game reconnect', () => {
  afterEach(() => { jest.useRealTimers(); jest.clearAllMocks(); });

  it('retries a missing room state, stops when state arrives, and rejoins on remount', () => {
    jest.useFakeTimers();
    const listeners = new Map<string, (value?: unknown) => void>();
    const socket = {
      connected: true,
      emit: jest.fn(),
      on: jest.fn((event: string, callback: (value?: unknown) => void) => { listeners.set(event, callback); }),
      off: jest.fn((event: string) => { listeners.delete(event); }),
    };
    (getSocket as jest.Mock).mockReturnValue(socket);
    const first = renderHook(() => useGameSocket('free-game'));
    expect(socket.emit).toHaveBeenCalledWith('join_room', { room: 'free-game' });
    act(() => { jest.advanceTimersByTime(5000); });
    expect(socket.emit.mock.calls.filter(([event]) => event === 'join_room')).toHaveLength(3);
    act(() => { listeners.get('game_state')?.({ fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', is_game_over: false, turn: 'w' }); });
    act(() => { jest.advanceTimersByTime(5000); });
    expect(socket.emit.mock.calls.filter(([event]) => event === 'join_room')).toHaveLength(3);
    act(() => { listeners.get('connect')?.(); });
    expect(socket.emit.mock.calls.filter(([event]) => event === 'join_room')).toHaveLength(4);
    first.unmount();
    renderHook(() => useGameSocket('free-game'));
    expect(socket.emit.mock.calls.filter(([event]) => event === 'join_room')).toHaveLength(5);
  });
});
