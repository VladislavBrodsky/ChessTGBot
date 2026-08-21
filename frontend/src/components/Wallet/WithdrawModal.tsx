'use client';

import React, { useState } from "react";
import { apiFetch } from "@/lib/api";
import { Drawer } from "@/components/ui/Drawer";
import { Button } from "@/components/ui/Button";
import { telegramHaptic } from "@/lib/telegram";

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
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [pendingConfirmation, setPendingConfirmation] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [checked1, setChecked1] = useState<boolean>(false);
  const [checked2, setChecked2] = useState<boolean>(false);

  // Withdrawal Submission
  const handleWithdrawSubmit = async () => {
    const amt = parseFloat(withdrawAmount);
    if (isNaN(amt) || amt < 10) {
      telegramHaptic('warning');
      setErrorMessage("Minimum withdrawal amount is $10.00 USDT");
      return;
    }

    if (Math.round(amt * 100) > balance) {
      telegramHaptic('warning');
      setErrorMessage(tw('insufficient_balance'));
      return;
    }

    if (!withdrawAddress.trim()) {
      telegramHaptic('warning');
      setErrorMessage(tw('specify_target_address'));
      return;
    }

    if (!checked1 || !checked2) {
      telegramHaptic('warning');
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
        telegramHaptic('success');
        if (data.status === 'pending_confirmation') {
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
        telegramHaptic('error');
        setErrorMessage(errData.detail || tw('withdraw_failed'));
      }
    } catch (err: any) {
      telegramHaptic('error');
      setErrorMessage(err.message || tw('withdraw_failed'));
    } finally {
      setProcessing(false);
    }
  };

  const isInsufficient = parseFloat(withdrawAmount) * 100 > balance;
  const isFormValid = !isInsufficient && checked1 && checked2 && !isNaN(parseFloat(withdrawAmount)) && parseFloat(withdrawAmount) >= 10;

  return (
    <Drawer
      isOpen={true}
      onClose={onClose}
      title={tw('withdraw_funds')}
      description={`Available Balance: $${(balance / 100).toFixed(2)} USDT`}
    >
      <div className="space-y-4">
        {/* Input Amount */}
        <div className="space-y-1.5 text-left">
          <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-brand-muted">
            <span>{tw('withdraw_amount')}</span>
            <span className="text-[9px] text-brand-muted/70">Min. $10.00</span>
          </div>
          <div className="relative">
            <span className="absolute left-3.5 top-3.5 text-brand-muted text-sm font-bold font-mono">$</span>
            <input
              type="number"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              className="w-full bg-brand-elevated border border-brand-border rounded-xl py-3 pl-8 pr-4 text-base text-brand-primary font-bold focus:outline-none focus:border-emerald-500/60 transition-all shadow-inner"
              placeholder={tw('amount_placeholder')}
              min="10"
            />
          </div>
        </div>

        {/* Input Target Wallet */}
        <div className="space-y-1.5 text-left">
          <label className="text-[10px] font-black text-brand-muted uppercase tracking-widest block">
            {tw('target_address')}
          </label>
          <input
            type="text"
            value={withdrawAddress}
            onChange={(e) => setWithdrawAddress(e.target.value)}
            className="w-full bg-brand-elevated border border-brand-border rounded-xl py-3 px-3.5 text-xs text-brand-primary font-mono tracking-wider focus:outline-none focus:border-emerald-500/50 transition-all truncate shadow-inner"
            placeholder={tw('target_placeholder')}
          />
        </div>

        {/* Fee Breakdown Display */}
        {!isNaN(parseFloat(withdrawAmount)) && parseFloat(withdrawAmount) > 0 && (
          <div className="p-3.5 rounded-xl bg-brand-elevated border border-brand-border space-y-1.5 text-xs font-medium text-brand-muted">
            <div className="flex justify-between">
              <span>Requested Amount:</span>
              <span className="font-mono font-bold text-brand-primary">${parseFloat(withdrawAmount).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-rose-400">
              <span>Network Fee:</span>
              <span className="font-mono font-bold">-$0.20</span>
            </div>
            <div className="flex justify-between border-t border-brand-border pt-2 mt-1 font-bold text-brand-primary">
              <span>You Will Receive:</span>
              <span className="font-mono text-emerald-400">
                ${Math.max(0, parseFloat(withdrawAmount) - 0.20).toFixed(2)}
              </span>
            </div>
          </div>
        )}

        {/* Safety Checklist */}
        <div className="space-y-2 pt-1 text-left">
          <label className="flex items-center space-x-2 text-[11px] font-medium text-brand-muted cursor-pointer">
            <input 
              type="checkbox" 
              className="accent-brand-primary w-4 h-4 rounded cursor-pointer" 
              checked={checked1}
              onChange={(e) => setChecked1(e.target.checked)}
            />
            <span>{tw('check1')}</span>
          </label>
          <label className="flex items-center space-x-2 text-[11px] font-medium text-brand-muted cursor-pointer">
            <input 
              type="checkbox" 
              className="accent-brand-primary w-4 h-4 rounded cursor-pointer" 
              checked={checked2}
              onChange={(e) => setChecked2(e.target.checked)}
            />
            <span>{tw('check2')}</span>
          </label>
        </div>

        {/* Insufficient Funds Trigger */}
        {isInsufficient && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs font-bold text-center">
            {tw('insufficient_balance')}
          </div>
        )}

        {pendingConfirmation && (
          <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-center space-y-1.5 shadow-sm">
            <div className="text-emerald-400 text-xs font-black uppercase tracking-wider">Confirmation Sent</div>
            <p className="text-[11px] text-brand-muted leading-relaxed">
              Check your Telegram chat with the bot. Tap <strong>Confirm</strong> to release the payout.
            </p>
          </div>
        )}

        {successMessage && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs font-bold text-center">
            {successMessage}
          </div>
        )}

        {errorMessage && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs font-bold text-center">
            {errorMessage}
          </div>
        )}

        <Button
          variant="primary"
          size="lg"
          isLoading={processing}
          disabled={processing || pendingConfirmation || !isFormValid}
          onClick={handleWithdrawSubmit}
          className="w-full uppercase font-black tracking-wider"
        >
          {processing ? tw('signing_tx') : tw('request_withdraw')}
        </Button>
      </div>
    </Drawer>
  );
}
