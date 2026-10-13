'use client';

import { FaChessKnight, FaCoins, FaStopwatch } from 'react-icons/fa';
import { FiArrowRight, FiInfo } from 'react-icons/fi';
import { SnapPicker, type PickerOption } from '@/components/ui/SnapPicker';
import { CountUp } from '@/components/ui/CountUp';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatUsd, winnerCents } from '@/lib/settlement';

export const STAKES_CENTS = [100, 500, 1000, 2500, 5000, 10000, 25000, 50000, 100000];
export const TIME_CONTROLS = [60, 180, 300, 600, 900, 1800, 3600];

type Translate = (key: string, values?: Record<string, string | number>) => string;

export interface BetSlipProps {
  selectedWager: number;
  isCustomWager: boolean;
  customWagerInput: string;
  timeControl: number;
  chosenWager: number;
  walletBalance: number;
  loadingBalance: boolean;
  balanceError: boolean;
  isCreating: boolean;
  onSelectWager: (cents: number) => void;
  onSelectCustom: () => void;
  onCustomChange: (value: string) => void;
  onSelectTime: (seconds: number) => void;
  onStart: () => void;
  onShowRake: () => void;
  t: Translate;
  tg: Translate;
  tw: Translate;
}

/** The whole betting decision in one compact card: stake, time, what you win, and a single primary action. */
export function BetSlip(p: BetSlipProps) {
  const valid = Number.isFinite(p.chosenWager) && p.chosenWager >= 100;
  const hasSufficient = !p.balanceError && !p.loadingBalance && valid && p.walletBalance >= p.chosenWager;
  const win = valid ? winnerCents(p.chosenWager) : 0;
  const state = p.balanceError ? 'error' : p.loadingBalance ? 'busy' : !valid ? 'invalid' : hasSufficient ? 'play' : 'topup';

  const stakeOptions: PickerOption<number | 'custom'>[] = [
    ...STAKES_CENTS.map(cents => ({ value: cents, label: `$${cents / 100}` })),
    { value: 'custom', label: p.tg('lobby_custom') },
  ];
  const timeOptions: PickerOption<number>[] = TIME_CONTROLS.map(seconds => ({ value: seconds, label: `${seconds / 60}m` }));

  const title = state === 'error' ? p.tw('balance_unavailable') : state === 'topup' ? p.tg('top_up_play') : state === 'invalid' ? p.tg('select_wager') : p.t('execute_matchmaking');
  const sub = state === 'error' ? p.t('retry')
    : state === 'topup' ? p.tg('amount_needed', { amount: formatUsd(p.chosenWager - p.walletBalance) })
    : state === 'invalid' ? p.tg('lobby_min_stake', { amount: '$1.00' })
    : `${p.tg('win_up_to')} ${formatUsd(win)}`;

  return (
    <div className="lobby-slip">
      <SnapPicker
        id="stake" icon={<FaCoins size={11} className="text-brand-success" aria-hidden="true" />} label={p.tg('select_wager')}
        options={stakeOptions} value={p.isCustomWager ? 'custom' : p.selectedWager}
        onChange={value => (value === 'custom' ? p.onSelectCustom() : p.onSelectWager(value))}
        itemWidth={76}
      />
      {p.isCustomWager && (
        <input
          type="number" inputMode="decimal" min="1" step="1" value={p.customWagerInput} className="lobby-input"
          aria-label={p.tg('enter_amount')} placeholder={p.tg('enter_amount')} onChange={event => p.onCustomChange(event.target.value)}
        />
      )}
      <SnapPicker
        id="time" icon={<FaStopwatch size={11} className="text-brand-muted" aria-hidden="true" />} label={p.tg('time_control')}
        options={timeOptions} value={p.timeControl} onChange={p.onSelectTime} itemWidth={68}
      />

      <div className="lobby-payout">
        <div className="lobby-payout__col">
          <span className="lobby-payout__label">{p.tg('stake')}</span>
          <span className="lobby-payout__value">{valid ? formatUsd(p.chosenWager) : '—'}</span>
        </div>
        <div className="lobby-payout__col lobby-payout__col--end">
          <span className="lobby-payout__label">{p.tg('win_up_to')}</span>
          <div className="lobby-payout__win-row">
            <span className="lobby-payout__value lobby-payout__value--win">
              <CountUp value={win} duration={0.5} format={formatUsd} />
            </span>
            <button type="button" className="lobby-payout__info" aria-label={p.tg('platform_commission')} onClick={p.onShowRake}>
              <FiInfo size={16} aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      <button type="button" className="lobby-cta" data-state={state} onClick={p.onStart} disabled={p.isCreating || state === 'busy' || state === 'invalid'}>
        <span className="lobby-cta__icon"><FaChessKnight size={20} aria-hidden="true" /></span>
        <span className="lobby-cta__text">
          {state === 'busy'
            ? <><Skeleton width="55%" textRole="label" /><Skeleton width="35%" textRole="caption" /></>
            : <><span className="lobby-cta__title">{title}</span><span className="lobby-cta__sub">{sub}</span></>}
        </span>
        <FiArrowRight size={20} className="shrink-0 rtl:rotate-180" aria-hidden="true" />
      </button>
      <p className="lobby-disclosure">{p.tg('lobby_disclosure')}</p>
    </div>
  );
}
