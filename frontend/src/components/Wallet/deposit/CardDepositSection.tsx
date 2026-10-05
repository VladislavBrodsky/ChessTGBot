'use client';

import React from 'react';
import { SiVisa } from 'react-icons/si';
import { FaStripe } from 'react-icons/fa';

export interface CardDepositSectionProps {
  depositAmount: string;
  setDepositAmount: (val: string) => void;
  processing: boolean;
  onCardTopUp: () => void;
}

export function CardDepositSection({
  depositAmount,
  setDepositAmount,
  processing,
  onCardTopUp,
}: CardDepositSectionProps) {
  const parsedAmt = parseFloat(depositAmount);
  const isValidAmt = !isNaN(parsedAmt) && parsedAmt >= 1.0;

  return (
    <div className="space-y-4">
      <div className="flex justify-center mb-2">
        <div className="px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[9px] font-black uppercase tracking-widest text-emerald-500">
            Instant Card Top-Up
          </span>
        </div>
      </div>

      {/* Visa / MasterCard Logos display */}
      <div className="flex items-center justify-center gap-4 py-2.5 bg-brand-void/35 rounded-xl border border-brand-border-opacity-5">
        <SiVisa className="w-10 h-8 text-white" />
        <div className="w-px h-6 bg-brand-border-opacity-10" />
        <svg className="w-10 h-6" viewBox="0 0 24 15" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="7.5" cy="7.5" r="7.5" fill="#EB001B" />
          <circle cx="16.5" cy="7.5" r="7.5" fill="#F79E1B" />
          <path d="M12 11.5A7.478 7.478 0 0113.882 7.5 7.478 7.478 0 0112 3.5a7.478 7.478 0 01-1.882 4A7.478 7.478 0 0112 11.5z" fill="#FF5F00" />
        </svg>
      </div>

      {/* Amount (USD) */}
      <div className="flex flex-col space-y-1.5">
        <label className="text-[10px] font-black text-brand-muted uppercase tracking-widest">
          Amount (USD)
        </label>
        <div className="relative">
          <span className="absolute left-3 top-3.5 text-brand-muted text-[10px] font-black font-mono">$</span>
          <input
            type="number"
            value={depositAmount}
            disabled={processing}
            onChange={(e) => setDepositAmount(e.target.value)}
            className="w-full bg-brand-void border border-brand-border-opacity-20 rounded-lg py-3 pl-8 pr-4 text-sm text-brand-primary font-black focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/30 focus:shadow-[0_0_15px_rgba(255,215,0,0.1)] transition-all"
            placeholder="10.00"
            min="1"
          />
        </div>
        <span className="text-[10px] font-bold text-brand-muted uppercase tracking-wider">
          Minimum top-up is $1.00 USD
        </span>
      </div>

      {/* Fee Breakdown Display */}
      {isValidAmt && (
        <div className="p-3 rounded-lg bg-brand-void border border-brand-border-opacity-10 space-y-1 text-[10px] font-bold uppercase tracking-wider text-brand-muted animate-fade-in">
          <div className="flex justify-between">
            <span>Credited to Balance:</span>
            <span className="text-emerald-400 font-mono">${(parsedAmt * 0.95).toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Platform Fee (5%):</span>
            <span className="text-rose-400 font-mono">${(parsedAmt * 0.05).toFixed(2)}</span>
          </div>
          <div className="flex justify-between border-t border-brand-border-opacity-10 pt-1 font-black text-brand-primary">
            <span>Total Charged:</span>
            <span className="font-mono">${parsedAmt.toFixed(2)}</span>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={onCardTopUp}
        disabled={processing || !isValidAmt}
        className="group relative overflow-hidden w-full py-3.5 rounded-xl border border-white/10 bg-gradient-to-r from-[#635BFF] to-[#4338CA] text-white text-[11px] font-black uppercase tracking-widest shadow-[0_0_20px_rgba(99,91,255,0.25)] hover:shadow-[0_0_25px_rgba(99,91,255,0.4)] transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
      >
        <div className="absolute inset-0 bg-white/20 translate-y-[-100%] group-hover:translate-y-[100%] transition-transform duration-700 ease-in-out" />
        {processing ? (
          <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
        ) : (
          <FaStripe className="w-12 h-6 text-white shrink-0" />
        )}
        <span>{processing ? "Initializing Checkout..." : "Checkout securely"}</span>
      </button>
      <div className="flex items-center justify-center gap-2 opacity-50 mt-1">
        <svg className="w-2.5 h-2.5 fill-brand-primary" viewBox="0 0 448 512">
          <path d="M400 224h-24v-72C376 68.2 307.8 0 224 0S72 68.2 72 152v72H48c-26.5 0-48 21.5-48 48v192c0 26.5 21.5 48 48 48h352c26.5 0 48-21.5 48-48V272c0-26.5-21.5-48-48-48zm-104 0H152v-72c0-39.7 32.3-72 72-72s72 32.3 72 72v72z" />
        </svg>
        <span className="text-[9px] font-bold text-brand-primary uppercase tracking-widest">
          Guaranteed safe & secure
        </span>
      </div>
    </div>
  );
}
