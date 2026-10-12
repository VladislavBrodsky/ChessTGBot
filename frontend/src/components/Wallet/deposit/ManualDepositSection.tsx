'use client';

import { useTranslations } from 'next-intl';
import React from 'react';
import { Badge } from '@/components/ui/Badge';
import { FaCopy, FaCheck } from 'react-icons/fa';
import { SiTether, SiTon, SiBitcoin, SiEthereum } from 'react-icons/si';

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
    <div className="space-y-4 pt-2">
      {/* ── Supported Rails & Multi-Chain Badges ── */}
      <div className="flex items-center justify-between p-2.5 rounded-xl border border-brand-border bg-brand-surface">
        <span className="text-caption font-mono text-brand-muted">Accepted:</span>
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-caption font-bold">
            <SiTether size={12} className="text-[#26A17B]" />
            <span>USDT</span>
          </div>
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 text-caption font-bold">
            <SiTon size={12} className="text-[#0098EA]" />
            <span>TON</span>
          </div>
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-400 text-caption font-bold">
            <SiBitcoin size={12} className="text-[#F7931A]" />
            <span>BTC</span>
          </div>
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg border border-indigo-500/30 bg-indigo-500/10 text-indigo-400 text-caption font-bold">
            <SiEthereum size={12} className="text-[#627EEA]" />
            <span>ETH</span>
          </div>
        </div>
      </div>

      {/* ── Info Banner ── */}
      <div className="p-3.5 rounded-xl border border-amber-500/20 bg-amber-500/10 flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
            <span className="text-amber-400 text-caption font-semibold">i</span>
          </div>
          <p className="text-caption font-semibold text-amber-400 normal-case tracking-normal">
            {tw('memo_required')}
          </p>
        </div>
        <p className="text-caption font-bold text-amber-400/80 leading-relaxed pl-6">
          {tw('memo_description')}
        </p>
      </div>

      {/* ── Step 1: Copy destination address ── */}
      <div className="flex flex-col space-y-1.5">
        <p className="text-caption font-semibold text-brand-muted normal-case tracking-normal">
          {tw('step_address')}
        </p>
        <button type="button" aria-label={tw('copy_address')}
          className="ui-tap-target group w-full p-2.5 rounded-xl border border-brand-border-opacity-20 bg-brand-void text-caption font-bold font-mono text-brand-primary flex justify-between items-center cursor-pointer hover:border-brand-primary/40 transition-colors text-start"
          onClick={onCopyWallet}
        >
          <bdi className="truncate">{masterWallet}</bdi>
          <div className="w-5 h-5 flex items-center justify-center shrink-0 ml-2">
            {copiedWallet ? (
              <FaCheck className="text-emerald-400 animate-pulse" />
            ) : (
              <FaCopy className="text-brand-muted group-hover:opacity-100 transition-opacity" />
            )}
          </div>
        </button>
      </div>

      {/* ── Step 2: Copy memo comment ── */}
      <div className="flex flex-col space-y-1.5">
        <p className="text-caption font-semibold text-brand-muted flex flex-wrap items-center gap-2">
          <span>{tw('step_memo', { memo: commentMemoText })}</span>
          <Badge variant="amber">{tc('required')}</Badge>
        </p>
        <button type="button" aria-label={tw('copy_memo')}
          className="ui-tap-target group w-full p-3 rounded-xl border border-brand-primary/20 bg-brand-primary/5 text-brand-primary text-caption font-semibold font-mono flex justify-between items-center cursor-pointer hover:border-brand-primary/60 hover:bg-brand-primary/10 transition-all text-start"
          onClick={onCopyMemo}
        >
          <bdi className="tracking-normal">{memoComment}</bdi>
          <div className="flex items-center gap-1.5 shrink-0 ml-2">
            {copiedMemo ? (
              <>
                <FaCheck className="text-emerald-400 animate-pulse" />
                <span className="text-caption font-semibold text-emerald-400 normal-case tracking-normal">{tc('copied')}</span>
              </>
            ) : (
              <>
                <FaCopy className="text-brand-muted group-hover:opacity-100 transition-opacity" />
                <span className="text-caption font-semibold text-brand-muted group-hover:text-brand-muted normal-case tracking-normal transition-colors">
                  {tc('copy')}
                </span>
              </>
            )}
          </div>
        </button>
      </div>

      {/* ── Step 3: Memo confirmation checkbox ── */}
      <label className="flex min-h-11 items-start gap-2.5 cursor-pointer group pt-1">
        <input
          type="checkbox"
          checked={memoConfirmed}
          onChange={(e) => setMemoConfirmed(e.target.checked)}
          className="mt-0.5 w-5 h-5 rounded border-brand-primary/30 accent-brand-primary cursor-pointer shrink-0"
        />
        <span className="text-caption font-bold text-brand-muted group-hover:text-brand-muted leading-relaxed transition-colors">
          {tw('memo_confirm', { memo: memoComment })}
        </span>
      </label>

      {/* ── Step 4: Verify hash ── */}
      <div
        className={`flex flex-col space-y-2 pt-3 border-t border-brand-border-opacity-10 transition-opacity duration-300 ${
          memoConfirmed ? 'opacity-100' : 'opacity-40 pointer-events-none'
        }`}
      >
        <label htmlFor="manual-deposit-hash" className="text-caption font-semibold text-brand-muted normal-case tracking-normal">
          {tw('step_verify')}
        </label>
        <div className="flex gap-2">
          <input
            id="manual-deposit-hash"
            type="text"
            value={manualTxHash}
            disabled={processing || !memoConfirmed}
            onChange={(e) => setManualTxHash(e.target.value)}
            placeholder="e.g. tx_hash or tonviewer link..."
            dir="ltr"
            className="min-w-0 flex-1 bg-brand-void border border-brand-border-opacity-20 rounded-xl py-2.5 px-3.5 text-caption text-brand-primary font-mono focus:outline-none focus:border-brand-primary/50 transition-colors"
          />
          <button
            type="button"
            disabled={processing || !manualTxHash.trim() || !memoConfirmed}
            onClick={onManualVerify}
            className="ui-tap-target px-4 rounded-xl bg-brand-primary text-brand-void text-caption font-semibold hover:bg-brand-primary-hover transition-all normal-case tracking-normal disabled:opacity-40 disabled:bg-brand-primary/50 disabled:cursor-not-allowed shrink-0"
          >
            {processing ? tw('checking') : tw('verify')}
          </button>
        </div>
        <p className="text-caption text-brand-muted leading-relaxed">
          ⚡ {tw('listening_tx')}
        </p>
      </div>
    </div>
  );
}
