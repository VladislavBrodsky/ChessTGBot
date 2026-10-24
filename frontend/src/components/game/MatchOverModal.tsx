'use client';

import Image from 'next/image';
import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { FaRedo, FaShareAlt } from 'react-icons/fa';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { MetaLine } from '@/components/ui/MetaLine';
import { CountUp } from '@/components/ui/CountUp';
import { telegramHaptic } from '@/lib/telegram';
import { logTelemetryEvent } from '@/lib/telemetry';

interface MatchOverModalProps {
  matchResultLabel: string; resultColor: string; eloChange?: string; netPayout: number | null; wagerAmount: number;
  outcome?: 'win' | 'loss' | 'draw' | 'aborted'; rematchStatus: 'idle' | 'offered_by_me' | 'waiting';
  onShowRematchChoice: () => void; onShareGame?: () => void; newElo?: number; copied?: boolean; xpGained?: number; isBotGame?: boolean;
  questClaimable?: boolean;
}
/** One accessible result surface; all readouts start at their confirmed value. */
export default function MatchOverModal({ matchResultLabel, eloChange, netPayout, wagerAmount, outcome = 'draw', rematchStatus, onShowRematchChoice, onShareGame, newElo, copied = false, xpGained, questClaimable, isBotGame = false }: MatchOverModalProps) {
  const locale = useLocale(), t = useTranslations('Game');
  const router = useRouter();
  const leave = () => router.push(`/${locale}/game`);
  const returned = outcome === 'draw' || outcome === 'aborted';
  // Free practice never reaches a stake on its own. After a finished bot game,
  // offer the one paid route that needs no matchmaking liquidity: a staked
  // challenge to a friend, which the lobby drawer fully discloses before creation.
  const showStakeBridge = isBotGame && outcome !== 'aborted';
  const stakeBridgeLoggedRef = useRef(false);
  useEffect(() => {
    if (!showStakeBridge || stakeBridgeLoggedRef.current) return;
    stakeBridgeLoggedRef.current = true;
    logTelemetryEvent('stake_cta_shown', { source: 'bot_game_over', outcome });
  }, [showStakeBridge, outcome]);
  const openStakeChallenge = () => {
    telegramHaptic('selection');
    logTelemetryEvent('stake_cta_tapped', { source: 'bot_game_over', outcome });
    router.push(`/${locale}/game?friend=stake`);
  };
  return <Modal isOpen onClose={leave} title={matchResultLabel} description={t('verification_complete')} maxWidth="sm"
    footer={<div className="space-y-3">
      <Button variant="primary" className="w-full" disabled={rematchStatus === 'waiting'} onClick={onShowRematchChoice}>{rematchStatus === 'waiting' ? t('pending_opponent') : t('revenge_match')}</Button>
      <div className={`grid gap-2 ${onShareGame ? 'grid-cols-2' : ''}`}><Button variant="secondary" leftIcon={<FaRedo />} onClick={leave}>{t('to_lobby')}</Button>{onShareGame && <Button variant="secondary" leftIcon={<FaShareAlt />} onClick={onShareGame}>{copied ? t('copied_success') : t('share_ledger')}</Button>}</div>
    </div>}>
    {questClaimable && (
      <div
        role="button"
        tabIndex={0}
        onClick={() => {
          telegramHaptic('success');
          router.push(`/${locale}/home?claim_box=1`);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            telegramHaptic('success');
            router.push(`/${locale}/home?claim_box=1`);
          }
        }}
        className="p-3 mb-3 rounded-2xl bg-gradient-to-r from-cyan-950/80 via-brand-surface to-cyan-950/80 border border-cyan-400/60 flex items-center justify-between gap-3 cursor-pointer hover:border-cyan-300 transition-all shadow-[0_0_16px_rgba(0,240,255,0.22)] active:scale-98"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center shrink-0">
            <Image src="/boxes/legendary.webp" alt="Platinum Mystery Box" width={28} height={28} className="object-contain" />
          </div>
          <div className="min-w-0 text-left">
            <p className="text-xs font-bold text-white truncate">🎁 Platinum Mystery Box Ready!</p>
            <p className="text-xs font-medium text-cyan-300 truncate">3/3 Matches Finished · 1 Mo Free Premium</p>
          </div>
        </div>
        <span className="text-xs font-bold text-cyan-300 bg-cyan-500/20 border border-cyan-400/40 px-2.5 py-1 rounded-lg shrink-0">
          Claim →
        </span>
      </div>
    )}
    <dl className="result-metrics">
      <div><dt>{t('global_elo')}</dt><dd>{newElo === undefined ? '—' : <><CountUp value={newElo} /> ELO</>}{eloChange && <span className="t-caption text-brand-muted"> ({eloChange})</span>}</dd></div>
      <div><dt>{returned ? t('stake_returned') : t('payout_received')}</dt><dd>{netPayout === null ? '—' : <bdi>{netPayout.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT</bdi>}</dd></div>
      {xpGained !== undefined && xpGained > 0 && <div><dt>{t('xp_reward')}</dt><dd><bdi>+{xpGained.toLocaleString(locale)} XP</bdi></dd></div>}
    </dl>
    {netPayout === null && <p className="t-caption text-brand-muted" role="status">{t('settlement_pending')}</p>}
    {wagerAmount > 0 && outcome === 'win' && <MetaLine className="t-caption text-brand-muted"><span>{t('includes_stake')}</span><span>{t('lobby_payout_note')}</span></MetaLine>}
    {showStakeBridge && <Card variant="solid" className="space-y-2 p-4" data-testid="stake-bridge">
      <p className="text-sm font-semibold text-brand-primary">{t('stake_bridge_title')}</p>
      <p className="text-sm text-brand-muted">{t('stake_bridge_desc')}</p>
      <Button variant="secondary" className="w-full" onClick={openStakeChallenge}>{t('stake_bridge_cta')}</Button>
      <p className="t-caption text-brand-muted">{t('lobby_disclosure')}</p>
    </Card>}
  </Modal>;
}
