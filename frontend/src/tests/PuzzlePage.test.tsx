import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import PuzzlePage from '@/app/[locale]/academy/puzzle/page';
import { useSWRFetch } from '@/hooks/useSWRFetch';
const syncStats = jest.fn();
const fixture = { id: 1, title: 'Mate in 1', fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4' };
const solvedResult = { status: 'success', solved: true, new_xp: 900, new_elo: 1455 };
let response = solvedResult;
jest.mock('next/navigation', () => ({ useSearchParams: () => new URLSearchParams('id=1') }));
jest.mock('next-intl', () => ({ useLocale: () => 'en', useTranslations: () => (key: string) => key }));
jest.mock('@/hooks/useSWRFetch', () => ({ useSWRFetch: jest.fn() }));
jest.mock('@/context/UserContext', () => ({ useUser: () => ({ stats: {}, syncStats }) }));
const hideNavbar = jest.fn();
const showNavbar = jest.fn();
jest.mock('@/context/NavbarContext', () => ({ useNavbarHide: () => ({ hideNavbar, showNavbar }) }));
jest.mock('@/lib/telegram', () => ({ telegramHaptic: jest.fn() }));
jest.mock('@/components/LayoutWrapper', () => ({ __esModule: true, default: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
jest.mock('@/components/ui/PageHeader', () => ({ PageHeader: ({ title }: { title: string }) => <h1>{title}</h1>, ActionLink: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a> }));
jest.mock('@/components/Academy/PuzzleBoard', () => ({ __esModule: true, default: ({ onSolve }: { onSolve: (result: typeof solvedResult) => void }) => <button onClick={() => onSolve(response)}>Solve fixture</button> }));

beforeEach(() => { jest.clearAllMocks(); response = solvedResult; (useSWRFetch as jest.Mock).mockReturnValue({ data: fixture, isLoading: false, mutate: jest.fn() }); });
it('contains malformed positions in a retryable state instead of crashing the board', () => {
  (useSWRFetch as jest.Mock).mockReturnValue({ data: { ...fixture, fen: 'broken-position' }, isLoading: false, mutate: jest.fn() });
  render(<PuzzlePage />);
  expect(screen.getByRole('alert')).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Solve fixture' })).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'retry' })).toBeInTheDocument();
});
it('shows verified account totals without inventing a reward grant', () => {
  render(<PuzzlePage />);
  fireEvent.click(screen.getByRole('button', { name: 'Solve fixture' }));
  expect(screen.getByRole('status')).toHaveTextContent('900');
  expect(screen.getByRole('status')).toHaveTextContent('1455');
  expect(screen.queryByText('+50')).not.toBeInTheDocument();
  expect(syncStats).toHaveBeenCalledTimes(1);
});
it('does not show success when the server has not confirmed a solve', () => {
  response = { ...solvedResult, solved: false };
  render(<PuzzlePage />);
  fireEvent.click(screen.getByRole('button', { name: 'Solve fixture' }));
  expect(screen.queryByRole('status')).not.toBeInTheDocument();
  expect(syncStats).not.toHaveBeenCalled();
});
