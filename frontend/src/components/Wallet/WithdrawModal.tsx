'use client';

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FaTimes } from "react-icons/fa";
import { apiFetch } from "@/lib/api";

import { useNavbarHideWhileMounted } from "@/context/NavbarContext";

interface WithdrawModalProps {
  onClose: () => void;
  onSuccess: () => void;
  balance: number;
  initialWithdrawAddress: string;
  tw: any;
}

export default function WithdrawModal({
  onClose,
  onSuccess,
  balance,
  initialWithdrawAddress,
  tw,
}: WithdrawModalProps) {
  useNavbarHideWhileMounted();
  const [withdrawAmount, setWithdrawAmount] = useState<string>("10");
  const [withdrawAddress, setWithdrawAddress] = useState<string>(initialWithdrawAddress);
  const [processing, setProcessing] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>( "");
  const [pendingConfirmation, setPendingConfirmation] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [checked1, setChecked1] = useState<boolean>(false);
  const [checked2, setChecked2] = useState<boolean>(false);
  const [canClose, setCanClose] = useState<boolean>(false);

  // Cooldown to prevent double-clicks/mouseup race conditions on desktop from closing drawer instantly on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setCanClose(true);
    }, 250);
    return () => clearTimeout(timer);
  }, []);

  // Withdrawal Submission
  const handleWithdrawSubmit = async () => {
    const amt = parseFloat(withdrawAmount);
    if (isNaN(amt) || amt < 10) {
      setErrorMessage("Minimum withdrawal amount is $10.00 USDT");
      return;
    }

    if (Math.round(amt * 100) > balance) {
      setErrorMessage(tw('insufficient_balance'));
      return;
    }

    if (!withdrawAddress.trim()) {
      setErrorMessage(tw('specify_target_address'));
      return;
    }

    if (!checked1 || !checked2) {
      setErrorMessage(tw('confirm_all_warnings'));
      return;
    }

    setProcessing(true);
    setErrorMessage("");
    setSuccessMessage("");
    setPendingConfirmation(false);

    try {
      const res = await apiFetch("/api/v1/wallet/withdraw", {
        method: "POST",
        body: JSON.stringify({
          amount: Math.round(amt * 100),
          address: withdrawAddress
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.status === 'pending_confirmation') {
          // Funds are held until the user taps Confirm in the bot chat.
          setPendingConfirmation(true);
          onSuccess();
          setTimeout(() => {
            onClose();
            setPendingConfirmation(false);
          }, 8000);
        } else {
          setSuccessMessage(tw('withdraw_success_sim', { amount: `$${amt.toFixed(2)}` }));
          onSuccess();
          setTimeout(() => {
            onClose();
            setSuccessMessage("");
          }, 3000);
        }
      } else {
        const errData = await res.json();
        setErrorMessage(errData.detail || tw('withdraw_failed'));
      }
    } catch {
      setErrorMessage(tw('withdraw_network_error'));
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="bottom-drawer-backdrop z-[100]">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => { if (!processing && canClose) onClose(); }}
        className="absolute inset-0 bg-[rgba(0,0,0,0.4)]" style={{ touchAction: 'none' }}
      />

      {/* Content */}
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 350 }}
        className="bottom-drawer-sheet relative z-10 pb-[calc(16px+var(--app-safe-bottom))]"
      >
        <div className="bottom-drawer-handle" />
        <button
          onClick={onClose}
          disabled={processing}
          className="absolute top-4 right-4 text-brand-muted hover:text-brand-primary"
        >
          <FaTimes />
        </button>

        <div className="space-y-4">
          <h3 className="text-base font-black uppercase tracking-widest text-brand-primary ">{tw('withdraw_title')}</h3>

          <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider p-3 bg-brand-bg-opacity-5 rounded-xl border border-brand-border-opacity-10">
            <span className="text-brand-muted">{tw('available_balance')}</span>
            <span className="text-sm font-black text-emerald-500">${(balance / 100).toFixed(2)}</span>
          </div>

          {/* Input amount */}
          <div className="flex flex-col space-y-1.5">
            <label className="text-[10px] font-black text-brand-muted uppercase tracking-widest flex items-center justify-between">
              <span>{tw('withdraw_amount')}</span>
              <span className="text-[8px] opacity-60">Min. $10.00</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-3.5 text-brand-muted text-[11px] font-black font-mono">$</span>
              <input
                type="number"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                className="w-full bg-brand-void border border-emerald-500/20 rounded-xl py-3 pl-8 pr-4 text-[16px] text-emerald-500 font-black focus:outline-none focus:border-emerald-500/60 transition-all shadow-inner"
                placeholder={tw('amount_placeholder')}
                min="10"
              />
            </div>
          </div>

          {/* Input Target Wallet */}
          <div className="flex flex-col space-y-1.5">
            <label className="text-[10px] font-black text-brand-muted uppercase tracking-widest">{tw('target_address')}</label>
            <input
              type="text"
              value={withdrawAddress}
              onChange={(e) => setWithdrawAddress(e.target.value)}
              className="w-full bg-brand-void border border-brand-border-opacity-20 rounded-xl py-3 px-3.5 text-[16px] text-brand-primary font-bold font-mono tracking-wider focus:outline-none focus:border-emerald-500/50 transition-all truncate shadow-inner"
              placeholder={tw('target_placeholder')}
            />
          </div>

          {/* Fee Breakdown Display */}
          {!isNaN(parseFloat(withdrawAmount)) && parseFloat(withdrawAmount) > 0 && (
            <div className="p-3 rounded-xl bg-brand-void border border-brand-border-opacity-10 space-y-1.5 text-[10px] font-bold uppercase tracking-wider text-brand-muted">
              <div className="flex justify-between">
                <span>Requested Amount:</span>
                <span className="font-mono">${parseFloat(withdrawAmount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-rose-400">
                <span>Network Fee:</span>
                <span className="font-mono">-$0.20</span>
              </div>
              <div className="flex justify-between border-t border-brand-border-opacity-10 pt-2 mt-1 font-black text-brand-primary">
                <span>You Will Receive:</span>
                <span className="font-mono text-emerald-400">
                  ${Math.max(0, parseFloat(withdrawAmount) - 0.20).toFixed(2)}
                </span>
              </div>
            </div>
          )}

          {/* Safety Checklist */}
          <div className="flex flex-col space-y-2 pt-2">
            <label className="flex items-center space-x-2 text-[10px] font-bold text-brand-muted uppercase tracking-widest cursor-pointer">
              <input 
                type="checkbox" 
                className="accent-brand-primary w-3 h-3" 
                checked={checked1}
                onChange={(e) => setChecked1(e.target.checked)}
              />
              <span>{tw('check1')}</span>
            </label>
            <label className="flex items-center space-x-2 text-[10px] font-bold text-brand-muted uppercase tracking-widest cursor-pointer">
              <input 
                type="checkbox" 
                className="accent-brand-primary w-3 h-3" 
                checked={checked2}
                onChange={(e) => setChecked2(e.target.checked)}
              />
              <span>{tw('check2')}</span>
            </label>
          </div>

          {/* Insufficient Funds Trigger */}
          {parseFloat(withdrawAmount) * 100 > balance && (
            <div className="p-2.5 bg-brand-rose-opacity-10 border border-brand-rose-opacity-20 rounded-lg text-rose-400 text-[10px] font-black uppercase tracking-wider text-center animate-bounce">
              {tw('insufficient_balance')}
            </div>
          )}

          {pendingConfirmation && (
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-center space-y-2 shadow-premium">
              <div className="text-emerald-500 text-[11px] font-black uppercase tracking-widest animate-pulse">Action Required</div>
              <p className="text-[10px] font-bold text-brand-muted leading-relaxed">
                Check your Telegram DMs with the bot. You must tap <strong>Confirm</strong> to release the funds.
              </p>
            </motion.div>
          )}

          {successMessage && <div className="p-2.5 bg-brand-emerald-opacity-10 border border-brand-emerald-opacity-20 rounded-lg text-emerald-500 text-[10px] font-bold uppercase tracking-wider text-center">{successMessage}</div>}
          {errorMessage && <div className="p-2.5 bg-brand-rose-opacity-10 border border-brand-rose-opacity-20 rounded-lg text-rose-400 text-[10px] font-bold uppercase tracking-wider text-center">{errorMessage}</div>}

          <button
            onClick={handleWithdrawSubmit}
            disabled={processing || pendingConfirmation || parseFloat(withdrawAmount) * 100 > balance || !checked1 || !checked2}
            className="w-full mt-2 py-3 rounded-xl border border-emerald-500/20 bg-emerald-500 text-brand-void text-[11px] font-black uppercase tracking-widest hover:brightness-110 shadow-premium transition-all disabled:opacity-50"
          >
            {processing ? tw('signing_tx') : tw('request_withdraw')}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
