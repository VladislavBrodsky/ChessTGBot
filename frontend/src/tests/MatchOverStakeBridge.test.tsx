import '@testing-library/jest-dom';
import type { ReactNode } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import MatchOverModal from '@/components/game/MatchOverModal';
import { logTelemetryEvent } from '@/lib/telemetry';

const push = jest.fn();
jest.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));
jest.mock('next-intl', () => ({ useLocale: () => 'en', useTranslations: () => (key: string) => key }));
jest.mock('next/image', () => ({ __esModule: true, default: () => null }));
jest.mock('@/components/ui/Modal', () => ({ Modal: ({ children, footer }: { children: ReactNode; footer: ReactNode }) => <div>{children}{footer}</div> }));
jest.mock('@/components/ui/CountUp', () => ({ CountUp: ({ value }: { value: number }) => <>{value}</> }));
jest.mock('@/lib/telegram', () => ({ telegramHaptic: jest.fn() }));
jest.mock('@/lib/telemetry', () => ({ logTelemetryEvent: jest.fn() }));

const base = { matchResultLabel: 'Victory', resultColor: '', netPayout: 0, wagerAmount: 0, rematchStatus: 'idle' as const, onShowRematchChoice: jest.fn() };

afterEach(() => jest.clearAllMocks());

it('offers a staked friend challenge after a finished bot game and logs that it was shown once', () => {
  const view = render(<MatchOverModal {...base} isBotGame outcome="win" />);
  expect(screen.getByTestId('stake-bridge')).toBeInTheDocument();
  expect(screen.getByText('lobby_disclosure')).toBeInTheDocument();
  view.rerender(<MatchOverModal {...base} isBotGame outcome="loss" />);
  expect(logTelemetryEvent).toHaveBeenCalledTimes(1);
  expect(logTelemetryEvent).toHaveBeenCalledWith('stake_cta_shown', { source: 'bot_game_over', outcome: 'win' });
});

it('sends the player to the staked friend drawer and logs the tap', () => {
  render(<MatchOverModal {...base} isBotGame outcome="loss" />);
  fireEvent.click(screen.getByRole('button', { name: 'stake_bridge_cta' }));
  expect(push).toHaveBeenCalledWith('/en/game?friend=stake');
  expect(logTelemetryEvent).toHaveBeenCalledWith('stake_cta_tapped', { source: 'bot_game_over', outcome: 'loss' });
});

it('keeps the rematch as the primary action alongside the bridge', () => {
  render(<MatchOverModal {...base} isBotGame outcome="draw" />);
  fireEvent.click(screen.getByRole('button', { name: 'revenge_match' }));
  expect(base.onShowRematchChoice).toHaveBeenCalled();
});

it('does not show the bridge after a game against a person', () => {
  render(<MatchOverModal {...base} outcome="win" wagerAmount={500} />);
  expect(screen.queryByTestId('stake-bridge')).not.toBeInTheDocument();
  expect(logTelemetryEvent).not.toHaveBeenCalled();
});

it('does not show the bridge for an aborted bot game', () => {
  render(<MatchOverModal {...base} isBotGame outcome="aborted" />);
  expect(screen.queryByTestId('stake-bridge')).not.toBeInTheDocument();
  expect(logTelemetryEvent).not.toHaveBeenCalled();
});
