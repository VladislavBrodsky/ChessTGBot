import '@testing-library/jest-dom';
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { OpenChallenges } from '@/components/game/lobby/OpenChallenges';
import type { OpenChallenge } from '@/hooks/useOpenChallenges';

jest.mock('@/lib/telegram', () => ({ telegramHaptic: jest.fn() }));

const t = (key: string, values?: Record<string, string | number>) =>
  values ? `${key}:${Object.values(values).join(',')}` : key;
const NOW = 1_800_000_000_000;

function challenge(overrides: Partial<OpenChallenge> = {}): OpenChallenge {
  return {
    game_id: 'g1', bid_amount: 100, time_control: 300, creator_name: 'Ana', creator_elo: 1210,
    created_at: NOW / 1000 - 120, expires_at: NOW / 1000 + 25 * 60, mine: false, ...overrides,
  };
}

it('renders nothing when nobody is waiting', () => {
  const { container } = render(<OpenChallenges challenges={[]} onOpen={jest.fn()} t={t} nowMs={NOW} />);
  expect(container).toBeEmptyDOMElement();
});

it('shows a real waiting player with the stake, clock and time left, and opens the game to accept', () => {
  const onOpen = jest.fn();
  render(<OpenChallenges challenges={[challenge()]} onOpen={onOpen} t={t} nowMs={NOW} />);

  expect(screen.getByRole('heading', { name: 'open_challenges_title' })).toBeInTheDocument();
  expect(screen.getByText('Ana')).toBeInTheDocument();
  expect(screen.getByText('open_challenge_meta_elo:1210')).toBeInTheDocument();
  expect(screen.getByText('open_challenge_meta_game:5')).toBeInTheDocument();
  expect(screen.getByText('open_challenge_meta_left:25')).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: 'open_challenge_accept:$1.00' }));
  expect(onOpen).toHaveBeenCalledWith('g1');
});

it("labels the player's own challenge and lets them return to it instead of accepting it", () => {
  const onOpen = jest.fn();
  render(<OpenChallenges challenges={[challenge({ game_id: 'mine', mine: true })]} onOpen={onOpen} t={t} nowMs={NOW} />);

  expect(screen.getByText('open_challenge_yours')).toBeInTheDocument();
  expect(screen.queryByText(/open_challenge_meta_elo/)).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /open_challenge_accept/ })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'open_challenge_view' }));
  expect(onOpen).toHaveBeenCalledWith('mine');
});
