'use client';

import { useTranslations } from 'next-intl';
import React, { useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { FaCopy, FaCheck } from 'react-icons/fa';
import { SiTether } from 'react-icons/si';

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
  manualTxHash,
  processing,
  onCopyWallet,
  onCopyMemo,
  setManualTxHash,
  onManualVerify,
  commentMemoText,
}: ManualDepositSectionProps) {
  const tw = useTranslations('Wallet');
  const tc = useTranslations('Common');
  const [showManualVerify, setShowManualVerify] = useState(Boolean(manualTxHash.trim()));

  return (
    <div className="space-y-3 pt-1">
      {/* ── Asset & Network Minimalist Pill ── */}
      <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-brand-surface border border-brand-border text-caption">
        <div className="flex items-center gap-2 min-w-0">
          <SiTether size={15} className="text-[#26A17B] shrink-0" aria-hidden="true" />
          <span className="font-bold text-brand-primary">USDT</span>
          <span className="text-brand-muted">•</span>
          <span className="font-semibold text-brand-muted truncate">TON Network (Jetton)</span>
        </div>
        <span className="text-brand-muted font-semibold shrink-0 ml-2">Fee: 5%</span>
      </div>

      {/* ── Core Transfer Card: Address & Required Memo in one clean surface ── */}
      <div className="rounded-2xl border border-brand-border bg-brand-surface p-3.5 space-y-3 shadow-xs">
        {/* Destination Address */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-caption font-semibold">
            <span className="text-brand-muted">{tw('destination')}</span>
            <span className="font-mono text-cyan-400 text-caption">TON</span>
          </div>
          <div className="w-full p-2.5 rounded-xl border border-brand-border bg-brand-void flex items-center justify-between gap-2 hover:border-brand-primary/40 transition-colors">
            <span className="font-mono text-caption text-brand-primary font-semibold truncate select-all" dir="ltr">
              {masterWallet}
            </span>
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

        {/* Required Memo */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-caption font-semibold">
            <span className="text-brand-muted">{commentMemoText || tw('comment_memo')}</span>
            <Badge variant="amber">{tc('required')}</Badge>
          </div>
          <div className="w-full p-2.5 rounded-xl border border-amber-500/40 bg-amber-500/10 flex items-center justify-between gap-2 hover:border-amber-500/60 transition-colors">
            <span className="font-mono text-caption sm:text-body text-amber-300 font-bold tracking-wide select-all" dir="ltr">
              {memoComment}
            </span>
            <button
              type="button"
              aria-label={tw('copy_memo')}
              onClick={onCopyMemo}
              className="ui-tap-target shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 border border-amber-500/40 text-caption font-bold text-amber-300 hover:bg-amber-500/30 active:scale-95 transition-all cursor-pointer"
            >
              {copiedMemo ? (
                <>
                  <FaCheck className="text-emerald-400 animate-pulse" size={11} aria-hidden="true" />
                  <span className="text-emerald-400 font-bold">{tc('copied')}</span>
                </>
              ) : (
                <>
                  <FaCopy size={11} aria-hidden="true" />
                  <span>{tc('copy')}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Concise helper note */}
        <p className="text-caption text-amber-400 flex items-start gap-1.5 pt-0.5 leading-snug">
          <span className="font-bold shrink-0">⚠️</span>
          <span>{tw('memo_description')}</span>
        </p>
      </div>

      {/* ── Realtime Auto-Crediting Status ── */}
      <div className="flex items-center justify-center gap-2 py-1 text-caption text-emerald-400 font-semibold text-center">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping shrink-0" aria-hidden="true" />
        <span>{tw('listening_tx')}</span>
      </div>

      {/* ── Optional Manual Hash Verification (Collapsible) ── */}
      <div className="pt-0.5">
        <button
          type="button"
          onClick={() => setShowManualVerify(!showManualVerify)}
          className="w-full text-center text-caption font-semibold text-brand-muted hover:text-brand-primary transition-colors cursor-pointer py-1 block"
        >
          {showManualVerify ? '▲ Hide hash verification' : '▼ Already sent? Verify transaction hash'}
        </button>

        {showManualVerify && (
          <div className="mt-2 p-3 rounded-xl bg-brand-surface border border-brand-border space-y-2">
            <label htmlFor="manual-deposit-hash" className="text-caption font-semibold text-brand-muted block">
              {tw('step_verify')}
            </label>
            <div className="flex gap-2">
              <input
                id="manual-deposit-hash"
                type="text"
                value={manualTxHash}
                disabled={processing}
                onChange={(e) => setManualTxHash(e.target.value)}
                placeholder="Transaction hash or link..."
                dir="ltr"
                className="min-w-0 flex-1 bg-brand-void border border-brand-border rounded-xl py-2 px-3 text-caption text-brand-primary font-mono focus:outline-none focus:border-brand-primary/50 transition-colors"
              />
              <button
                type="button"
                disabled={processing || !manualTxHash.trim()}
                onClick={onManualVerify}
                className="ui-tap-target px-4 rounded-xl bg-emerald-500 text-brand-void text-caption font-bold hover:bg-emerald-400 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
              >
                {processing ? tw('checking') : tw('verify')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
