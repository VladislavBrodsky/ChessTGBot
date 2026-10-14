'use client';

import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/Input';
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
}

export default function WithdrawModal({
  onClose,
  onSuccess,
  balance,
  initialWithdrawAddress,
}: WithdrawModalProps) {
  const tw = useTranslations('Wallet');
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
      setErrorMessage(tw('withdraw_minimum', { amount: '$10.00' }));
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
          setSuccessMessage(tw('withdraw_submitted', { amount: `$${amt.toFixed(2)}` }));
          onSuccess();
          setTimeout(() => {
            onClose();
            setSuccessMessage("");
          }, 3000);
        }
      } else {
        const _errData = await res.json().catch(() => ({}));
        telegramHaptic('error');
        setErrorMessage(tw('withdraw_failed'));
      }
    } catch (_err) {
      telegramHaptic('error');
      setErrorMessage(tw('withdraw_network_error'));
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
      title={tw('withdraw_title')}
      description={<>{tw('available_balance')}: <bdi>${(balance / 100).toFixed(2)} USDT</bdi></>}
    >
      <div className="space-y-4">
        <Input type="number" label={tw('withdraw_amount')} value={withdrawAmount}
          onChange={(event) => setWithdrawAmount(event.target.value)} min="10" step="0.01" dir="ltr"
          helperText={tw('withdraw_minimum', { amount: '$10.00' })} placeholder={tw('amount_placeholder')} />
        <div>
          <Input type="text" label={tw('target_address')} value={withdrawAddress} dir="ltr"
            onChange={(event) => setWithdrawAddress(event.target.value)} placeholder={tw('target_placeholder')} />
          {initialWithdrawAddress && (
            <div className="flex items-center justify-between gap-2 pt-1.5 px-0.5 text-caption">
              {withdrawAddress === initialWithdrawAddress ? (
                <>
                  <span className="flex items-center gap-1.5 text-brand-muted truncate">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" aria-hidden="true" />
                    <span>Prefilled from connected TON wallet</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setWithdrawAddress('')}
                    className="text-brand-muted hover:text-brand-primary font-semibold text-caption shrink-0 transition-colors cursor-pointer"
                  >
                    Clear
                  </button>
                </>
              ) : (
                <>
                  <span className="text-brand-muted truncate">Enter receiving TON wallet</span>
                  <button
                    type="button"
                    onClick={() => setWithdrawAddress(initialWithdrawAddress)}
                    className="text-emerald-400 hover:text-emerald-300 font-semibold text-caption shrink-0 flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <span>Use connected wallet ({initialWithdrawAddress.slice(0, 4)}…{initialWithdrawAddress.slice(-3)})</span>
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Fee Breakdown Display */}
        {!isNaN(parseFloat(withdrawAmount)) && parseFloat(withdrawAmount) > 0 && (
          <div className="p-3.5 rounded-xl bg-brand-elevated border border-brand-border space-y-1.5 text-sm font-medium text-brand-muted">
            <div className="flex justify-between">
              <span>{tw('requested_amount')}</span>
              <span className="font-mono font-bold text-brand-primary">${parseFloat(withdrawAmount).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-rose-400">
              <span>{tw('withdraw_fee')}</span>
              <span className="font-mono font-bold">-$0.20</span>
            </div>
            <div className="flex justify-between border-t border-brand-border pt-2 mt-1 font-bold text-brand-primary">
              <span>{tw('you_receive')}</span>
              <span className="font-mono text-emerald-400">
                ${Math.max(0, parseFloat(withdrawAmount) - 0.20).toFixed(2)}
              </span>
            </div>
          </div>
        )}

        {/* Safety Checklist */}
        <div className="space-y-2 pt-1 text-start">
          <label className="flex items-center space-x-2 text-caption font-medium text-brand-muted cursor-pointer">
            <input 
              type="checkbox" 
              className="accent-brand-primary w-4 h-4 rounded cursor-pointer" 
              checked={checked1}
              onChange={(e) => setChecked1(e.target.checked)}
            />
            <span>{tw('check1')}</span>
          </label>
          <label className="flex items-center space-x-2 text-caption font-medium text-brand-muted cursor-pointer">
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
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm font-bold text-center">
            {tw('insufficient_balance')}
          </div>
        )}

        {pendingConfirmation && (
          <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-center space-y-1.5 shadow-sm">
            <div className="text-emerald-400 text-sm font-semibold normal-case tracking-normal">{tw('confirmation_sent')}</div>
            <p className="text-caption text-brand-muted leading-relaxed">
              {tw('confirm_in_bot')}
            </p>
          </div>
        )}

        {successMessage && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-sm font-bold text-center">
            {successMessage}
          </div>
        )}

        {errorMessage && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm font-bold text-center">
            {errorMessage}
          </div>
        )}

        <Button
          variant="primary"
          size="lg"
          isLoading={processing}
          disabled={processing || pendingConfirmation || !isFormValid}
          onClick={handleWithdrawSubmit}
          className="w-full normal-case font-semibold tracking-normal"
        >
          {processing ? tw('signing_tx') : tw('request_withdraw')}
        </Button>
      </div>
    </Drawer>
  );
}
