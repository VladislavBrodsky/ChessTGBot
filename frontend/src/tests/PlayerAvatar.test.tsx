import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { PlayerAvatar } from '@/components/game/active/PlayerAvatar';

it('shows a bot glyph, not generated initials, for the A.I. opponent', () => {
  const { container } = render(<PlayerAvatar userId={-1} fallbackText="A." isBot />);
  expect(container.querySelector('svg')).toBeInTheDocument();
  expect(screen.queryByText('A.')).not.toBeInTheDocument();
});

it('shows the player photo for a real user and initials when there is no id', () => {
  const { container, rerender } = render(<PlayerAvatar userId={42} fallbackText="AL" />);
  expect(container.querySelector('img')).toHaveAttribute('src', expect.stringContaining('/api/v1/users/avatar/42'));
  rerender(<PlayerAvatar userId={null} fallbackText="al" />);
  expect(screen.getByText('AL')).toBeVisible();
});
