'use client';

import { useState } from "react";
import { motion } from "framer-motion";
import { FaTimes } from "react-icons/fa";
import { apiFetch } from "@/lib/api";

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
  const [withdrawAmount, setWithdrawAmount] = useState<string>("10");
  const [withdrawAddress, setWithdrawAddress] = useState<string>(initialWithdrawAddress);
  const [processing, setProcessing] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>( "");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [checked1, setChecked1] = useState<boolean>(false);
  const [checked2, setChecked2] = useState<boolean>(false);

  // Withdrawal Submission
  const handleWithdrawSubmit = async () => {
    const amt = parseFloat(withdrawAmount);
    if (isNaN(amt) || amt <= 0) {
      setErrorMessage(tw('invalid_amount'));
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

    try {
      const res = await apiFetch("/api/v1/wallet/withdraw", {
        method: "POST",
        body: JSON.stringify({
          amount: Math.round(amt * 100),
          address: withdrawAddress
        })
      });

      if (res.ok) {
        setSuccessMessage(tw('withdraw_success_sim', { amount: `$${amt.toFixed(2)}` }));
        onSuccess();
        setTimeout(() => {
          onClose();
          setSuccessMessage("");
        }, 3000);
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
        onClick={() => { if (!processing) onClose(); }}
        className="absolute inset-0 bg-[rgba(0,0,0,0.4)]"
      />

      {/* Content */}
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 350 }}
        className="bottom-drawer-sheet relative z-10"
      >
        <div className="bottom-drawer-handle" />
        <button
          onClick={onClose}
          disabled={processing}
          className="absolute top-4 right-4 text-brand-primary opacity-40 hover:text-brand-primary"
        >
          <FaTimes />
        </button>

        <div className="space-y-4">
          <h3 className="text-base font-black uppercase tracking-widest text-brand-primary ">{tw('withdraw_title')}</h3>

          <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider p-3 bg-brand-bg-opacity-5 rounded-xl border border-brand-border-opacity-10">
            <span className="text-brand-primary opacity-60">{tw('available_balance')}</span>
            <span className="text-sm font-black text-brand-primary">${(balance / 100).toFixed(2)}</span>
          </div>

          {/* Input amount */}
          <div className="flex flex-col space-y-1">
            <label className="text-[9px] font-black text-brand-primary opacity-40 uppercase tracking-widest">{tw('withdraw_amount')}</label>
            <input
              type="number"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              className="cyber-input w-full p-3 rounded-xl border border-brand-border-opacity-20 bg-brand-bg-opacity-20 text-brand-primary text-sm font-bold focus:outline-none focus:border-brand-primary transition-all"
              placeholder={tw('amount_placeholder')}
            />
          </div>

          {/* Input Target Wallet */}
          <div className="flex flex-col space-y-1">
            <label className="text-[9px] font-black text-brand-primary opacity-40 uppercase tracking-widest">{tw('target_address')}</label>
            <input
              type="text"
              value={withdrawAddress}
              onChange={(e) => setWithdrawAddress(e.target.value)}
              className="cyber-input w-full p-3 rounded-xl border border-brand-border-opacity-20 bg-brand-bg-opacity-20 text-brand-primary text-xs font-bold font-mono tracking-wider focus:outline-none focus:border-brand-primary transition-all"
              placeholder={tw('target_placeholder')}
            />
          </div>

          {/* Safety Checklist */}
          <div className="flex flex-col space-y-2 pt-2">
            <label className="flex items-center space-x-2 text-[9px] font-bold text-brand-primary opacity-60 uppercase tracking-widest cursor-pointer">
              <input 
                type="checkbox" 
                className="accent-brand-primary w-3 h-3" 
                checked={checked1}
                onChange={(e) => setChecked1(e.target.checked)}
              />
              <span>{tw('check1')}</span>
            </label>
            <label className="flex items-center space-x-2 text-[9px] font-bold text-brand-primary opacity-60 uppercase tracking-widest cursor-pointer">
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
            <div className="p-2.5 bg-brand-rose-opacity-10 border border-brand-rose-opacity-20 rounded-lg text-rose-400 text-[9px] font-black uppercase tracking-wider text-center animate-bounce">
              {tw('insufficient_balance')}
            </div>
          )}

          {successMessage && <div className="p-2.5 bg-brand-emerald-opacity-10 border border-brand-emerald-opacity-20 rounded-lg text-emerald-500 text-[10px] font-bold uppercase tracking-wider text-center">{successMessage}</div>}
          {errorMessage && <div className="p-2.5 bg-brand-rose-opacity-10 border border-brand-rose-opacity-20 rounded-lg text-rose-400 text-[10px] font-bold uppercase tracking-wider text-center">{errorMessage}</div>}

          <button
            onClick={handleWithdrawSubmit}
            disabled={processing || parseFloat(withdrawAmount) * 100 > balance || !checked1 || !checked2}
            className="w-full mt-2 py-3 rounded-xl border border-brand-border-opacity-20 bg-brand-primary text-brand-void text-[11px] font-black uppercase tracking-widest hover:bg-brand-primary-hover transition-all disabled:opacity-50"
          >
            {processing ? tw('signing_tx') : tw('request_withdraw')}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
