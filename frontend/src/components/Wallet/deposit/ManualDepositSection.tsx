'use client';

import { useTranslations } from 'next-intl';
import React from 'react';
import { Badge } from '@/components/ui/Badge';
import { FaCopy, FaCheck } from 'react-icons/fa';
import { SiTether } from 'react-icons/si';
import { FiAlertCircle } from 'react-icons/fi';
import { telegramHaptic } from '@/lib/telegram';

export interface ManualDepositSectionProps {
  masterWallet: string;
  memoComment: string;
  copiedWallet: boolean;
  copiedMemo: boolean;
  memoConfirmed: boolean;
  manualTxHash: string;
  processing: boolean;
  onCopyWallet: () => void;
  onCopyMemo: () => void;
  setMemoConfirmed: (val: boolean) => void;
  setManualTxHash: (val: string) => void;
  onManualVerify: () => void;
  commentMemoText: string;
}

export function ManualDepositSection({
  masterWallet,
  memoComment,
  copiedWallet,
  copiedMemo,
  memoConfirmed,
  manualTxHash,
  processing,
  onCopyWallet,
  onCopyMemo,
  setMemoConfirmed,
  setManualTxHash,
  onManualVerify,
  commentMemoText,
}: ManualDepositSectionProps) {
  const tw = useTranslations('Wallet');
  const tc = useTranslations('Common');

  return (
    <div className="space-y-3.5 pt-1">
      {/* ── Asset & Network Header: Clarifies USDT on TON exclusivity ── */}
      <div className="p-3.5 rounded-2xl border border-brand-border bg-brand-surface flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-[#26A17B]/15 border border-[#26A17B]/30 flex items-center justify-center shrink-0">
              <SiTether size={17} className="text-[#26A17B]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-body font-bold text-brand-primary">USDT</span>
                <span className="px-1.5 py-0.5 rounded-md bg-brand-elevated border border-brand-border text-caption font-semibold text-brand-muted">
                  Jetton
                </span>
              </div>
              <p className="text-caption text-brand-muted flex items-center gap-1">
                <span>The Open Network</span>
                <span className="text-brand-muted">•</span>
                <span className="font-mono text-cyan-400 font-semibold">TON</span>
              </p>
            </div>
          </div>
          <div className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-caption font-bold flex items-center gap-1.5 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>USDT Only</span>
          </div>
        </div>

        {/* Network Safety Note answering 'one wallet for all crypto?' */}
        <div className="pt-2 border-t border-brand-border/60 flex items-start gap-2 text-caption text-brand-muted">
          <FiAlertCircle className="text-amber-400 shrink-0 mt-0.5" size={13} aria-hidden="true" />
          <p className="leading-snug">
            Send only <strong className="text-brand-primary">USDT via TON network</strong>. Transfers of native TON, BTC, ETH, or other chains cannot be credited to this address.
          </p>
        </div>
      </div>

      {/* ── Step 1: Destination Address ── */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-caption font-semibold">
          <span className="text-brand-muted">{tw('step_address')}</span>
          <span className="font-mono text-cyan-400 text-caption">TON Master Wallet</span>
        </div>
        <div className="w-full p-2.5 sm:p-3 rounded-xl border border-brand-border bg-brand-void flex items-center justify-between gap-2 hover:border-brand-primary/40 transition-colors">
          <div className="min-w-0 flex-1">
            <p className="font-mono text-caption text-brand-primary font-semibold truncate select-all" dir="ltr">
              {masterWallet}
            </p>
          </div>
          <button
            type="button"
            aria-label={tw('copy_address')}
            onClick={onCopyWallet}
            className="ui-tap-target shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-elevated border border-brand-border text-caption font-semibold text-brand-primary hover:border-emerald-500/40 hover:text-emerald-400 active:scale-95 transition-all cursor-pointer"
          >
            {copiedWallet ? (
              <>
                <FaCheck className="text-emerald-400 animate-pulse" size={11} aria-hidden="true" />
                <span className="text-emerald-400 font-bold">{tc('copied')}</span>
              </>
            ) : (
              <>
                <FaCopy className="text-brand-muted" size={11} aria-hidden="true" />
                <span>{tc('copy')}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── Step 2: Required Memo / Comment ── */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-caption font-semibold">
          <span className="text-brand-muted">{tw('step_memo', { memo: commentMemoText })}</span>
          <Badge variant="amber">{tc('required')}</Badge>
        </div>
        <div className="w-full p-3 rounded-xl border border-amber-500/40 bg-amber-500/10 flex items-center justify-between gap-2.5 hover:border-amber-500/60 transition-colors">
          <div className="min-w-0 flex-1">
            <p className="font-mono text-caption sm:text-body text-amber-300 font-bold tracking-wide select-all" dir="ltr">
              {memoComment}
            </p>
          </div>
          <button
            type="button"
            aria-label={tw('copy_memo')}
            onClick={onCopyMemo}
            className="ui-tap-target shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 border border-amber-500/40 text-caption font-bold text-amber-300 hover:bg-amber-500/30 active:scale-95 transition-all cursor-pointer"
          >
            {copiedMemo ? (
              <>
                <FaCheck className="text-emerald-400 animate-pulse" size={11} aria-hidden="true" />
                <span className="text-emerald-400">{tc('copied')}</span>
              </>
            ) : (
              <>
                <FaCopy size={11} aria-hidden="true" />
                <span>{tc('copy')}</span>
              </>
            )}
          </button>
        </div>
        <p className="text-caption text-amber-400 flex items-start gap-1.5 pt-0.5 leading-snug">
          <span className="font-bold shrink-0">⚠️</span>
          <span>{tw('memo_description')}</span>
        </p>
      </div>

      {/* ── Step 3: Memo Confirmation Checkbox ── */}
      <label className="flex min-h-[44px] items-center gap-3 p-3 rounded-xl border border-brand-border bg-brand-surface cursor-pointer group hover:border-brand-primary/40 transition-colors">
        <input
          type="checkbox"
          checked={memoConfirmed}
          onChange={(e) => {
            telegramHaptic('selection');
            setMemoConfirmed(e.target.checked);
          }}
          className="w-4 h-4 rounded border-brand-border bg-brand-void text-emerald-500 accent-emerald-500 cursor-pointer shrink-0"
        />
        <span className="text-caption font-semibold text-brand-muted group-hover:text-brand-primary transition-colors leading-relaxed">
          {tw('memo_confirm', { memo: memoComment })}
        </span>
      </label>

      {/* ── Step 4: Verification & Auto-Listener ── */}
      <div
        className={`space-y-2 pt-2.5 border-t border-brand-border/60 transition-opacity duration-300 ${
          memoConfirmed ? 'opacity-100' : 'opacity-40 pointer-events-none'
        }`}
      >
        <label htmlFor="manual-deposit-hash" className="text-caption font-semibold text-brand-muted block">
          {tw('step_verify')}
        </label>
        <div className="flex gap-2">
          <input
            id="manual-deposit-hash"
            type="text"
            value={manualTxHash}
            disabled={processing || !memoConfirmed}
            onChange={(e) => setManualTxHash(e.target.value)}
            placeholder="e.g. transaction hash or Tonviewer link..."
            dir="ltr"
            className="min-w-0 flex-1 bg-brand-void border border-brand-border rounded-xl py-2.5 px-3 text-caption text-brand-primary font-mono focus:outline-none focus:border-brand-primary/50 transition-colors"
          />
          <button
            type="button"
            disabled={processing || !manualTxHash.trim() || !memoConfirmed}
            onClick={onManualVerify}
            className="ui-tap-target px-4 rounded-xl bg-emerald-500 text-brand-void text-caption font-bold hover:bg-emerald-400 active:scale-95 transition-all normal-case tracking-normal disabled:opacity-40 disabled:bg-emerald-500/50 disabled:cursor-not-allowed shrink-0"
          >
            {processing ? tw('checking') : tw('verify')}
          </button>
        </div>
        <div className="flex items-center justify-between text-caption text-brand-muted pt-1">
          <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping shrink-0" />
            <span>{tw('listening_tx')}</span>
          </span>
          <span className="text-brand-muted">{tw('platform_fee')}: 5%</span>
        </div>
      </div>
    </div>
  );
}
