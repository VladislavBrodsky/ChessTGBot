'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { FaChessKnight, FaClock, FaWallet } from 'react-icons/fa';
import { useUser } from '@/context/UserContext';
import { useAudio } from '@/hooks/useAudio';
import { telegramHaptic } from '@/lib/telegram';
import { getSocket } from '@/lib/socket';
import { winnerCents } from '@/lib/settlement';
import { DepositDialog } from '@/components/Wallet/WalletDialogs';
import { Drawer } from '@/components/ui/Drawer';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { MetaLine } from '@/components/ui/MetaLine';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';

interface QuickMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialWagerCents?: number;
}

const WAGERS = [100, 300, 500, 1000, 2500];
const TIMES = [180, 300, 600];
const paidWager = (value: number) => WAGERS.includes(value) ? value : 500;
type SearchState = 'config' | 'joining' | 'searching' | 'cancelling';

export default function QuickMatchModal({ isOpen, onClose, initialWagerCents = 500 }: QuickMatchModalProps) {
  const locale = useLocale();
  const router = useRouter();
  const t = useTranslations('QuickMatch');
  const tg = useTranslations('Game');
  const tw = useTranslations('Wallet');
  const { play: playAudio } = useAudio();
  const { walletBalance, syncBalance, balanceError, loadingBalance } = useUser();
  const [step, setStep] = useState<SearchState>('config');
  const [wagerCents, setWagerCents] = useState(paidWager(initialWagerCents));
  const [timeControl, setTimeControl] = useState(300);
  const [showDeposit, setShowDeposit] = useState(false);
  const [error, setError] = useState('');
  const [connected, setConnected] = useState(true);
  // Refs guard synchronous double taps and cancellation before the server acknowledges a join.
  const activeRef = useRef(false);
  const confirmedRef = useRef(false);
  const cancelRef = useRef(false);
  const closeRef = useRef(false);
  const callbacks = useRef({ onClose, syncBalance, router, locale, playAudio, t });
  useEffect(() => { callbacks.current = { onClose, syncBalance, router, locale, playAudio, t }; }, [onClose, syncBalance, router, locale, playAudio, t]);

  const money = (cents: number) => new Intl.NumberFormat(locale, { style: 'currency', currency: 'USD' }).format(cents / 100);
  const insufficient = !loadingBalance && !balanceError && wagerCents > walletBalance;

  useEffect(() => {
    if (!isOpen) return;
    setWagerCents(paidWager(initialWagerCents));
    setStep('config');
    setError('');
    setShowDeposit(false);
    activeRef.current = confirmedRef.current = cancelRef.current = closeRef.current = false;
    const socket = getSocket();
    setConnected(socket.connected);
    const reset = () => {
      activeRef.current = confirmedRef.current = cancelRef.current = false;
      setStep('config');
      void callbacks.current.syncBalance();
      if (closeRef.current) callbacks.current.onClose();
      closeRef.current = false;
    };
    const onStatus = (data: { status?: string }) => {
      if (!activeRef.current) return;
      if (data.status === 'searching') {
        confirmedRef.current = true;
        if (cancelRef.current) socket.emit('leave_matchmaking', {});
        else setStep('searching');
      } else if (data.status === 'idle') reset();
    };
    const onError = () => {
      if (!activeRef.current) return;
      setError(callbacks.current.t('queue_error'));
      telegramHaptic('error');
      reset();
    };
    const onFound = (data: { game_id?: string }) => {
      if (!activeRef.current || typeof data.game_id !== 'string' || !data.game_id) return;
      activeRef.current = false;
      confirmedRef.current = cancelRef.current = false;
      callbacks.current.playAudio('start');
      telegramHaptic('success');
      callbacks.current.onClose();
      callbacks.current.router.push(`/${callbacks.current.locale}/game?id=${encodeURIComponent(data.game_id)}`);
      void callbacks.current.syncBalance();
    };
    const onConnect = () => {
      setConnected(true);
      // Reconcile an uncertain join; never replay a charge on reconnect.
      if (activeRef.current) {
        if (cancelRef.current && confirmedRef.current) socket.emit('leave_matchmaking', {});
        else socket.emit('check_matchmaking', {});
      }
    };
    const onDisconnect = () => setConnected(false);
    socket.on('matchmaking_status', onStatus);
    socket.on('matchmaking_error', onError);
    socket.on('match_found', onFound);
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    return () => {
      // Navigation can happen before the reservation is acknowledged. Retain only
      // a cancellation listener in that case; never refund before a join finishes.
      if (activeRef.current && !confirmedRef.current) {
        const detach = () => {
          socket.off('matchmaking_status', cancelAfterJoin);
          socket.off('matchmaking_error', detach);
          socket.off('match_found', detach);
        };
        const cancelAfterJoin = (data: { status?: string }) => {
          if (data.status === 'searching') { socket.emit('leave_matchmaking', {}); detach(); }
          else if (data.status === 'idle') detach();
        };
        socket.on('matchmaking_status', cancelAfterJoin);
        socket.on('matchmaking_error', detach);
        socket.on('match_found', detach);
      } else if (activeRef.current) socket.emit('leave_matchmaking', {});
      activeRef.current = false;
      socket.off('matchmaking_status', onStatus);
      socket.off('matchmaking_error', onError);
      socket.off('match_found', onFound);
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    };
  }, [isOpen, initialWagerCents]);

  const cancelSearch = useCallback((close = false) => {
    if (!activeRef.current) { if (close) onClose(); return; }
    closeRef.current ||= close;
    if (cancelRef.current) return;
    cancelRef.current = true;
    setStep('cancelling');
    // The join handler reserves the stake. Wait for its acknowledgement before cancelling,
    // otherwise the server can process a refund before that reservation exists.
    if (confirmedRef.current) getSocket().emit('leave_matchmaking', {});
  }, [onClose]);

  const start = () => {
    if (activeRef.current || loadingBalance || balanceError) return;
    if (insufficient) { setShowDeposit(true); return; }
    const socket = getSocket();
    if (!socket.connected) { setConnected(false); setError(t('connection_error')); return; }
    activeRef.current = true;
    confirmedRef.current = cancelRef.current = closeRef.current = false;
    setError('');
    setStep('joining');
    socket.emit('join_matchmaking', { bid_amount: wagerCents, time_control: timeControl });
  };

  const footer = step === 'config' ? <div className="space-y-2">
    <Button variant="primary" size="lg" className="w-full" leftIcon={insufficient ? <FaWallet /> : <FaChessKnight />}
      disabled={loadingBalance} onClick={balanceError ? () => { void syncBalance(); } : start}>
      {balanceError ? tw('retry_btn') : loadingBalance ? t('checking_balance') : insufficient ? tw('top_up') : t('start')}
    </Button>
    <p className="text-caption text-brand-muted text-center">{tg('lobby_disclosure')}</p>
  </div> : <Button variant="outline" size="lg" className="w-full" disabled={step === 'cancelling'} onClick={() => cancelSearch()}>
    {step === 'cancelling' ? t('cancelling') : t('cancel_search')}
  </Button>;

  return <>
    <Drawer isOpen={isOpen && !showDeposit} onClose={() => cancelSearch(true)} title={<span className="flex items-center gap-2"><FaChessKnight aria-hidden="true" className="text-brand-success" />{t('title')}</span>}
      description={t('description')} footer={footer}>
      {step === 'config' ? <>
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <span className="text-brand-muted">{tg('balance')}</span>
          {loadingBalance ? <Skeleton width={72} height={20} /> : <span className="numeric-body font-semibold"><bdi>{balanceError ? '—' : new Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(walletBalance / 100)}</bdi> <span className="text-caption text-brand-muted">USDT</span></span>}
        </div>
        <fieldset className="space-y-2">
          <legend className="text-sm font-semibold mb-2">{tg('select_wager')}</legend>
          <div className="grid grid-cols-3 gap-2">
            {WAGERS.map(cents => <Button key={cents} variant="secondary" aria-pressed={cents === wagerCents} aria-label={t('wager_option', { amount: money(cents) })}
              onClick={() => setWagerCents(cents)} className={`min-w-0 flex-col gap-1 px-2 py-3 ${cents === wagerCents ? 'border-brand-success bg-brand-success/10' : ''}`}>
              <bdi className="numeric-body font-semibold">{money(cents).replace(/\.00$/, '')}</bdi>
              {cents === 1000 && <Badge variant="emerald" size="counter">{t('popular')}</Badge>}
            </Button>)}
          </div>
        </fieldset>
        <fieldset className="space-y-2">
          <legend className="text-sm font-semibold mb-2">{tg('time_control')}</legend>
          <div className="grid grid-cols-3 gap-2">
            {TIMES.map(seconds => <Button key={seconds} variant="secondary" aria-pressed={seconds === timeControl} onClick={() => setTimeControl(seconds)}
              className={`min-w-0 px-2 ${seconds === timeControl ? 'border-brand-success bg-brand-success/10' : ''}`}>
              {t('minutes', { count: seconds / 60 })}
            </Button>)}
          </div>
        </fieldset>
        <Card variant="solid" className="p-3 space-y-2">
          <div className="flex flex-wrap justify-between gap-2 text-sm"><span className="text-brand-muted">{tg('stake')}</span><bdi className="numeric-body font-semibold">{money(wagerCents)}</bdi></div>
          <div className="flex flex-wrap justify-between gap-2 text-sm"><span>{t('payout')}</span><bdi className="numeric-body font-semibold text-brand-success">{money(winnerCents(wagerCents))}</bdi></div>
          <MetaLine className="text-caption text-brand-muted"><span>{tg('includes_stake')}</span><span>{tg('lobby_payout_note')}</span></MetaLine>
        </Card>
        {insufficient && <p className="text-sm text-brand-muted">{t('shortfall', { amount: money(wagerCents - walletBalance) })}</p>}
        {balanceError && <p role="alert" className="text-sm text-brand-danger">{tw('balance_unavailable')}</p>}
        {error && <p role="alert" className="text-sm text-brand-danger">{error}</p>}
      </> : <Card variant="solid" className="p-4 space-y-3 text-center">
        <FaClock aria-hidden="true" className="mx-auto text-brand-success" />
        <p role="status" className="font-semibold">{step === 'cancelling' ? t('cancelling') : step === 'joining' ? t('joining') : tg('searching_opponent')}</p>
        <p className="text-sm text-brand-muted"><bdi>{money(wagerCents)}</bdi> · {t('minutes', { count: timeControl / 60 })}</p>
        <p className="text-caption text-brand-muted">{t('search_hint')}</p>
      </Card>}
      {!connected && <p role="status" className="text-caption text-brand-muted">{t('connection_error')}</p>}
    </Drawer>
    {isOpen && showDeposit && <DepositDialog onClose={() => setShowDeposit(false)} onSuccess={() => { void syncBalance(); }} />}
  </>;
}
