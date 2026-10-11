import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import DailyHintCard from '../components/Academy/DailyHintCard';

describe('DailyHintCard', () => {
  it('shows a reusable cue without promising an XP reward that is never granted', () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-10-11T12:00:00'));
    try {
      const { rerender } = render(<DailyHintCard />);
      expect(screen.getByRole('heading', { name: "Today's chess cue" })).toBeInTheDocument();
      expect(screen.getByText(/Before taking a pawn/)).toBeInTheDocument();
      expect(screen.queryByText(/XP|rewarded/i)).not.toBeInTheDocument();
      rerender(<DailyHintCard />);
      expect(screen.getByText(/Before taking a pawn/)).toBeInTheDocument();
    } finally {
      jest.useRealTimers();
    }
  });
});
