import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { PageHeader, SectionHeader } from '@/components/ui/PageHeader';
jest.mock('next-intl', () => ({ useTranslations: () => (key: string) => key }));
jest.mock('next/link', () => ({ __esModule: true, default: ({ children, ...props }: any) => <a {...props}>{children}</a> }));
it('keeps a single meaningful h1 with independently named utilities', () => {
  render(<PageHeader title="Play Chess" description="Choose your match" icon={<span>♞</span>} actions={<button aria-label="Settings">⚙</button>} />);
  expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  expect(screen.getByRole('heading', { name: 'Play Chess' }).closest('header')).toHaveAttribute('data-align', 'start');
  expect(screen.getByText('Choose your match')).toBeVisible();
  expect(screen.getByRole('button', { name: 'Settings' })).toBeVisible();
});
it('keeps centered entry screens explicit and return navigation labelled', () => {
  render(<PageHeader title="Sign in" align="center" backHref="/en/home" backLabel="Return home" />);
  expect(screen.getByRole('heading', { level: 1 }).closest('header')).toHaveAttribute('data-align', 'center');
  expect(screen.getByRole('link', { name: 'Return home' })).toHaveAttribute('href', '/en/home');
});
it('renders SectionHeader with start alignment and optional action', () => {
  render(<SectionHeader title="Learning Tracks" action={<button>View All</button>} />);
  const heading = screen.getByRole('heading', { level: 2, name: 'Learning Tracks' });
  expect(heading).toHaveClass('ui-section-title');
  expect(heading).not.toHaveClass('ui-section-title--center');
  expect(screen.getByText('View All')).toBeVisible();
});
it('renders SectionHeader with centered alignment without lopsided left bar class', () => {
  render(<SectionHeader title="Daily Tasks" align="center" subtitle="Complete 3 missions" />);
  const heading = screen.getByRole('heading', { level: 2, name: 'Daily Tasks' });
  expect(heading).toHaveClass('ui-section-title--center');
  expect(screen.getByText('Complete 3 missions')).toBeVisible();
});

