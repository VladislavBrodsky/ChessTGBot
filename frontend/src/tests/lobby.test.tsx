import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BetSlip, type BetSlipProps } from '../components/game/lobby/BetSlip';
import { LiveStrip } from '../components/game/lobby/LiveStrip';
import { RecentResults } from '../components/game/lobby/RecentResults';
import { winnerCents, formatUsd } from '../lib/settlement';

jest.mock('next-intl', () => ({ useLocale: () => 'en' }));
jest.mock('../lib/telegram', () => ({ telegramHaptic: jest.fn() }));

beforeAll(() => {
  // jsdom has no layout engine: give the carousel the browser APIs it uses.
  (global as unknown as { ResizeObserver: unknown }).ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
  Element.prototype.scrollBy = jest.fn() as unknown as typeof Element.prototype.scrollBy;
});

const t = (key: string, values?: Record<string, string | number>) => (values ? `${key}:${Object.values(values).join(',')}` : key);

function slip(overrides: Partial<BetSlipProps> = {}) {
  const props: BetSlipProps = {
    selectedWager: 500, isCustomWager: false, customWagerInput: '5.00', timeControl: 600, chosenWager: 500,
    walletBalance: 1250, loadingBalance: false, balanceError: false, isCreating: false,
    onSelectWager: jest.fn(), onSelectCustom: jest.fn(), onCustomChange: jest.fn(), onSelectTime: jest.fn(), onStart: jest.fn(), onShowRake: jest.fn(),
    t, tg: t, tw: t, ...overrides,
  };
  render(<BetSlip {...props} />);
  return props;
}

describe('settlement helpers', () => {
  it('pays the winner 95% of the pot', () => {
    expect(winnerCents(500)).toBe(950);
    expect(winnerCents(100)).toBe(190);
    expect(formatUsd(950)).toBe('$9.50');
  });
  it('never invents a payout for an invalid stake', () => {
    expect(winnerCents(0)).toBe(0);
    expect(winnerCents(NaN)).toBe(0);
    expect(winnerCents(-5)).toBe(0);
  });
});

describe('BetSlip', () => {
  it('shows every stake and time option, with the selected ones pressed', () => {
    slip();
    expect(screen.getByRole('radio', { name: '$5' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('radio', { name: '$1000' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: '10m' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('radio', { name: '60m' })).toBeInTheDocument();
  });

  it('always carries the adult and risk disclosure next to the primary action', () => {
    slip();
    expect(screen.getByText('lobby_disclosure')).toBeInTheDocument();
  });

  it('labels the winner amount as a payout that includes the stake', () => {
    slip();
    expect(screen.getByText('win_up_to')).toBeInTheDocument();
    expect(screen.getByText('includes_stake')).toBeInTheDocument();
  });

  it('starts matchmaking from the primary action when the balance covers the stake', () => {
    const props = slip();
    fireEvent.click(screen.getByRole('button', { name: /execute_matchmaking/ }));
    expect(props.onStart).toHaveBeenCalledTimes(1);
  });

  it('switches to a top-up action and states the shortfall when the balance is too low', () => {
    slip({ walletBalance: 200 });
    expect(screen.getByText('top_up_play')).toBeInTheDocument();
    expect(screen.getByText(/amount_needed:\$3\.00/)).toBeInTheDocument();
  });

  it('disables the action for an invalid custom stake instead of showing a broken number', () => {
    slip({ isCustomWager: true, customWagerInput: '', chosenWager: NaN });
    expect(screen.getByRole('button', { name: /lobby_min_stake/ })).toBeDisabled();
  });

  it('never presents a failed balance fetch as zero', () => {
    slip({ balanceError: true });
    expect(screen.getByText('balance_unavailable')).toBeInTheDocument();
  });

  it('routes chip taps to the right handlers', () => {
    const props = slip();
    fireEvent.click(screen.getByRole('radio', { name: '$25' }));
    expect(props.onSelectWager).toHaveBeenCalledWith(2500);
    fireEvent.click(screen.getByRole('radio', { name: 'lobby_custom' }));
    expect(props.onSelectCustom).toHaveBeenCalled();
    fireEvent.click(screen.getByRole('radio', { name: '3m' }));
    expect(props.onSelectTime).toHaveBeenCalledWith(180);
  });
});

describe('real activity surfaces stay honest', () => {
  it('preserves measured zero activity rather than hiding the account metrics', () => {
    render(<LiveStrip searching={0} games24h={0} t={t} />);
    expect(screen.getAllByText('0')).toHaveLength(2);
  });
  it('keeps unavailable activity unknown and reserves its layout while loading', () => {
    const view = render(<LiveStrip searching={3} games24h={128} t={t} loading />);
    expect(screen.queryByText('3')).not.toBeInTheDocument();
    expect(screen.queryByText('0')).not.toBeInTheDocument();
    view.rerender(<LiveStrip searching={0} games24h={0} t={t} unavailable />);
    expect(screen.getAllByText('—')).toHaveLength(2);
  });
  it('shows only the measured numbers', () => {
    render(<LiveStrip searching={3} games24h={0} t={t} />);
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('lobby_games_24h')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument();
  });
  it('renders no recent-results card when there are none', () => {
    const { container } = render(<RecentResults recent={[]} t={t} />);
    expect(container).toBeEmptyDOMElement();
  });
});
