import { translatorFor as mockTranslatorFor } from './testUtils/messagesMock';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import LessonCard from '@/components/Academy/LessonCard';
import messages from '@/messages/en.json';

jest.mock('next-intl', () => ({ useLocale: () => 'en', useTranslations: (namespace: string) => mockTranslatorFor(namespace) }));

const base = { title: 'Piece Values', description: 'Learn what each piece is worth.', difficulty: 'Beginner' };

it('shows progress on the left and one action on the right, without repeating the status', () => {
  render(<LessonCard {...base} progress={0} onClick={() => {}} />);
  expect(screen.getByText('0%')).toBeVisible();
  expect(screen.getByText(messages.Academy.lesson_start)).toBeVisible();
  // "Start learning" next to "Start" said the same thing twice.
  expect(screen.queryByText(messages.Academy.start_learning)).not.toBeInTheDocument();
});

it('offers Continue once a lesson is under way and Review once it is finished', () => {
  const { rerender } = render(<LessonCard {...base} progress={40} onClick={() => {}} />);
  expect(screen.getByText('40%')).toBeVisible();
  expect(screen.getByText(messages.Academy.continue)).toBeVisible();
  rerender(<LessonCard {...base} progress={100} onClick={() => {}} />);
  expect(screen.getByText(messages.Academy.lesson_review)).toBeVisible();
  // Completed appears once (the badge), not again as status text.
  expect(screen.getAllByText(messages.Common.completed)).toHaveLength(1);
});

it('has no action when locked', () => {
  render(<LessonCard {...base} progress={0} locked />);
  expect(screen.queryByText(messages.Academy.lesson_start)).not.toBeInTheDocument();
  expect(screen.getByText(messages.Common.locked)).toBeVisible();
});
