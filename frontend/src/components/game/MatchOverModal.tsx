'use client';

import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { FaRedo, FaShareAlt } from 'react-icons/fa';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { MetaLine } from '@/components/ui/MetaLine';
import { CountUp } from '@/components/ui/CountUp';

interface MatchOverModalProps {
  matchResultLabel: string; resultColor: string; eloChange?: string; netPayout: number | null; wagerAmount: number;
  outcome?: 'win' | 'loss' | 'draw' | 'aborted'; rematchStatus: 'idle' | 'offered_by_me' | 'waiting';
  onShowRematchChoice: () => void; onShareGame: () => void; newElo?: number; copied?: boolean; xpGained?: number; isBotGame?: boolean;
}
/** One accessible result surface; all readouts start at their confirmed value. */
export default function MatchOverModal({ matchResultLabel, eloChange, netPayout, wagerAmount, outcome = 'draw', rematchStatus, onShowRematchChoice, onShareGame, newElo, copied = false, xpGained }: MatchOverModalProps) {
  const locale = useLocale(), t = useTranslations('Game');
  const router = useRouter();
  const leave = () => router.push(`/${locale}/game`);
  const returned = outcome === 'draw' || outcome === 'aborted';
  return <Modal isOpen onClose={leave} title={matchResultLabel} description={t('verification_complete')} maxWidth="sm"
    footer={<div className="space-y-3">
      <Button variant="primary" className="w-full" disabled={rematchStatus === 'waiting'} onClick={onShowRematchChoice}>{rematchStatus === 'waiting' ? t('pending_opponent') : t('revenge_match')}</Button>
      <div className="grid grid-cols-2 gap-2"><Button variant="secondary" leftIcon={<FaRedo />} onClick={leave}>{t('to_lobby')}</Button><Button variant="secondary" leftIcon={<FaShareAlt />} onClick={onShareGame}>{copied ? t('copied_success') : t('share_ledger')}</Button></div>
    </div>}>
    <dl className="result-metrics">
      <div><dt>{t('global_elo')}</dt><dd>{newElo === undefined ? '—' : <><CountUp value={newElo} /> ELO</>}{eloChange && <span className="t-caption text-brand-muted"> ({eloChange})</span>}</dd></div>
      <div><dt>{returned ? t('stake_returned') : t('payout_received')}</dt><dd>{netPayout === null ? '—' : <bdi>{netPayout.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT</bdi>}</dd></div>
      {xpGained !== undefined && xpGained > 0 && <div><dt>{t('xp_reward')}</dt><dd><bdi>+{xpGained.toLocaleString(locale)} XP</bdi></dd></div>}
    </dl>
    {netPayout === null && <p className="t-caption text-brand-muted" role="status">{t('settlement_pending')}</p>}
    {wagerAmount > 0 && outcome === 'win' && <MetaLine className="t-caption text-brand-muted"><span>{t('includes_stake')}</span><span>{t('lobby_payout_note')}</span></MetaLine>}
  </Modal>;
}
