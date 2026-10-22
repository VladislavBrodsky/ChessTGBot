import '@testing-library/jest-dom';
import { act, render, screen } from '@testing-library/react';
import { ChessClockBadge } from '@/components/game/ChessClockBadge';

describe('ChessClockBadge', () => {
  afterEach(() => jest.useRealTimers());

  it('keeps the personal clock explicitly labelled and counts down on the player turn', () => {
    jest.useFakeTimers();
    render(<ChessClockBadge
      gameState={{ id: 'clock-game', turn: 'w', white_time_left: 574, black_time_left: 600 }}
      color="w"
      label="Your time"
    />);

    const clock = screen.getByRole('timer', { name: 'Your time' });
    expect(clock).toHaveTextContent('Your time');
    expect(clock).toHaveTextContent('09:34');
    act(() => jest.advanceTimersByTime(1000));
    expect(clock).toHaveTextContent('09:33');
  });

  it('shows critical time with the semantic danger state', () => {
    render(<ChessClockBadge gameState={{ id: 'low-time', turn: 'b', black_time_left: 4 }} color="b" label="Your time" />);
    expect(screen.getByRole('timer', { name: 'Your time' })).toHaveClass('chess-clock--critical');
  });
});
