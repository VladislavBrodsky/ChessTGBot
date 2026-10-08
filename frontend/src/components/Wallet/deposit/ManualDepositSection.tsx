'use client';

import React from 'react';
import { FaCopy, FaCheck } from 'react-icons/fa';

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
  return (
    <div className="space-y-4 pt-4">
      {/* ── Info Banner ── */}
      <div className="p-3.5 rounded-xl border border-amber-500/20 bg-amber-500/10 flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
            <span className="text-amber-400 text-caption font-semibold">i</span>
          </div>
          <p className="text-caption font-semibold text-amber-400 normal-case tracking-normal">
            Important: Memo Required
          </p>
        </div>
        <p className="text-caption font-bold text-amber-400/80 leading-relaxed pl-6">
          Please ensure you include your unique memo comment below so we can correctly attribute the deposit to your account.
        </p>
      </div>

      {/* ── Step 1: Copy destination address ── */}
      <div className="flex flex-col space-y-1.5">
        <p className="text-caption font-semibold text-brand-muted normal-case tracking-normal">
          Step 1 — Destination Address (Master Vault):
        </p>
        <button type="button" aria-label="Copy destination address"
          className="ui-tap-target group w-full p-2.5 rounded-xl border border-brand-border-opacity-20 bg-brand-void text-caption font-bold font-mono text-brand-primary flex justify-between items-center cursor-pointer hover:border-brand-primary/40 transition-colors text-start"
          onClick={onCopyWallet}
        >
          <span className="truncate">{masterWallet}</span>
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
        <p className="text-caption font-semibold text-brand-muted normal-case tracking-normal flex items-center gap-2">
          <span>Step 2 — {commentMemoText}</span>
          <span className="px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-400 text-caption font-semibold">
            REQUIRED
          </span>
        </p>
        <button type="button" aria-label="Copy required deposit memo"
          className="ui-tap-target group w-full p-3 rounded-xl border border-brand-primary/20 bg-brand-primary/5 text-brand-primary text-caption font-semibold font-mono flex justify-between items-center cursor-pointer hover:border-brand-primary/60 hover:bg-brand-primary/10 transition-all text-start"
          onClick={onCopyMemo}
        >
          <span className="tracking-normal">{memoComment}</span>
          <div className="flex items-center gap-1.5 shrink-0 ml-2">
            {copiedMemo ? (
              <>
                <FaCheck className="text-emerald-400 animate-pulse" />
                <span className="text-caption font-semibold text-emerald-400 normal-case tracking-normal">Copied!</span>
              </>
            ) : (
              <>
                <FaCopy className="text-brand-muted group-hover:opacity-100 transition-opacity" />
                <span className="text-caption font-semibold text-brand-muted group-hover:text-brand-muted normal-case tracking-normal transition-colors">
                  Copy
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
          I have copied the exact memo comment <span className="font-semibold text-brand-primary">({memoComment})</span> and will include it in my transfer.
        </span>
      </label>

      {/* ── Step 4: Verify hash ── */}
      <div
        className={`flex flex-col space-y-2 pt-3 border-t border-brand-border-opacity-10 transition-opacity duration-300 ${
          memoConfirmed ? 'opacity-100' : 'opacity-40 pointer-events-none'
        }`}
      >
        <label htmlFor="manual-deposit-hash" className="text-caption font-semibold text-brand-muted normal-case tracking-normal">
          Step 3 — Already paid? Paste transaction hash to verify:
        </label>
        <div className="flex gap-2">
          <input
            id="manual-deposit-hash"
            type="text"
            value={manualTxHash}
            disabled={processing || !memoConfirmed}
            onChange={(e) => setManualTxHash(e.target.value)}
            placeholder="e.g. 0:abcd... or msg_hash..."
            className="flex-1 bg-brand-void border border-brand-border-opacity-20 rounded-xl py-2.5 px-3.5 text-caption text-brand-primary font-mono focus:outline-none focus:border-brand-primary/50 transition-colors"
          />
          <button
            type="button"
            disabled={processing || !manualTxHash.trim() || !memoConfirmed}
            onClick={onManualVerify}
            className="ui-tap-target px-4 rounded-xl bg-brand-primary text-brand-void text-caption font-semibold hover:bg-brand-primary-hover transition-all normal-case tracking-normal disabled:opacity-40 disabled:bg-brand-primary/50 disabled:cursor-not-allowed shrink-0"
          >
            {processing ? "Checking..." : "Verify"}
          </button>
        </div>
      </div>
    </div>
  );
}
