'use client';

import { useState } from "react";
import { motion } from "framer-motion";
import { FaTimes, FaCopy, FaCheck } from "react-icons/fa";
import { apiFetch } from "@/lib/api";
import { telegramHaptic } from "@/lib/telegram";

interface DepositModalProps {
  onClose: () => void;
  onSuccess: () => void;
  walletAddress: string;
  tgUser: any;
  tw: any;
}

export default function DepositModal({
  onClose,
  onSuccess,
  walletAddress,
  tgUser,
  tw,
}: DepositModalProps) {
  const [depositAmount, setDepositAmount] = useState<string>("10");
  const [invoiceUrl, setInvoiceUrl] = useState<string>("");
  const [processing, setProcessing] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [showManualFallback, setShowManualFallback] = useState<boolean>(false);
  const [copiedWallet, setCopiedWallet] = useState<boolean>(false);
  const [copiedMemo, setCopiedMemo] = useState<boolean>(false);

  const tgId = tgUser?.id || 1029384;
  const memoComment = `ref_${tgId}`;
  const masterWallet = "EQBvW8ZDR3YQ4vK42898h32fG3-q392u381uD28Ue9wU81E2";

  // Deposit Simulation
  const handleDepositSubmit = async () => {
    const amt = parseFloat(depositAmount);
    if (isNaN(amt) || amt <= 0) {
      setErrorMessage(tw('invalid_amount'));
      return;
    }

    setProcessing(true);
    setErrorMessage("");
    setSuccessMessage("");

    const mockTxHash = `sim_tx_${Date.now()}_${Math.floor(Math.random() * 1000000)}`;

    try {
      const res = await apiFetch("/api/v1/wallet/webhook", {
        method: "POST",
        headers: {
          "X-Webhook-Secret": "dev_webhook_secret",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          event: "transfer",
          tx_hash: mockTxHash,
          sender: walletAddress || "EQ_SenderAddress_Simulated_xxxx",
          destination: masterWallet,
          amount_cents: Math.round(amt * 100),
          comment: `ref_${tgId}`
        })
      });

      if (res.ok) {
        const data = await res.json();
        setSuccessMessage(tw('deposit_success_sim', { amount: `$${amt.toFixed(2)}`, credited: `$${(data.credited_amount / 100).toFixed(2)}` }));
        onSuccess();
        setTimeout(() => {
          onClose();
          setSuccessMessage("");
        }, 3000);
      } else {
        const errData = await res.json();
        setErrorMessage(errData.detail || tw('deposit_failed'));
      }
    } catch {
      setErrorMessage(tw('deposit_network_error'));
    } finally {
      setProcessing(false);
    }
  };

  const handleGenerateInvoice = async () => {
    const amt = parseFloat(depositAmount);
    if (isNaN(amt) || amt <= 0) {
      setErrorMessage(tw('invalid_amount'));
      return;
    }

    setProcessing(true);
    setErrorMessage("");
    setSuccessMessage("");
    setInvoiceUrl("");

    try {
      const res = await apiFetch("/api/v1/wallet/deposit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          amount: Math.round(amt * 100) // cents
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.status === "invoice") {
          setInvoiceUrl(data.payment_link || "");
          setSuccessMessage(tw('deposit_invoice_success'));
        } else if (data.status === "success") {
          setSuccessMessage(tw('deposit_success_sim', { amount: `$${amt.toFixed(2)}`, credited: `$${(data.credited_amount / 100).toFixed(2)}` }));
          onSuccess();
          setTimeout(() => {
            onClose();
            setSuccessMessage("");
          }, 3000);
        }
      } else {
        const errData = await res.json();
        setErrorMessage(errData.detail || tw('deposit_failed'));
      }
    } catch {
      setErrorMessage(tw('deposit_network_error'));
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
          <h3 className="text-base font-black uppercase tracking-widest text-brand-primary ">{tw('deposit_invoice')}</h3>

          {invoiceUrl ? (
            // Show Real Invoice details
            <div className="space-y-4">
              <p className="text-[10px] font-bold text-brand-primary opacity-60 uppercase tracking-wider text-center">
                {tw('deposit_invoice_success')}
              </p>

              <div className="w-full bg-brand-void p-4 rounded-xl border border-brand-border-opacity-20 flex flex-col items-center justify-center space-y-3 relative overflow-hidden">
                <div className="absolute inset-0 bg-brand-bg-opacity-5 animate-pulse pointer-events-none" />
                <div className="w-32 h-32 bg-white rounded-lg flex items-center justify-center p-2 relative z-10">
                  <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(invoiceUrl)}`} alt="Invoice QR Code" className="w-full h-full object-contain" />
                </div>
                <div className="text-[9px] font-black tracking-widest uppercase text-brand-primary opacity-40 pt-1">{tw('scan_info')}</div>
              </div>

              <div className="w-full flex flex-col gap-2">
                <a
                  href={invoiceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 rounded-xl bg-brand-primary text-brand-void text-[11px] font-black uppercase tracking-widest text-center shadow-lg block hover:bg-brand-primary-hover transition-all"
                >
                  Open in Wallet ⚡
                </a>

                <button
                  onClick={() => { setInvoiceUrl(""); setSuccessMessage(""); setErrorMessage(""); }}
                  className="w-full py-2 rounded-lg border border-brand-border-opacity-10 bg-brand-void text-brand-primary text-[10px] font-bold uppercase tracking-widest hover:border-brand-primary transition-all"
                >
                  Change Amount / Back
                </button>
              </div>
            </div>
          ) : (
            // Generate Invoice Form
            <div className="space-y-4">
              <p className="text-[10px] font-bold text-brand-primary opacity-60 uppercase tracking-wider text-center">
                {tw('deposit_desc')}
              </p>

              <div className="flex flex-col space-y-2">
                <label className="text-[9px] font-black text-brand-primary opacity-40 uppercase tracking-widest">Deposit Amount (USDT)</label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-brand-primary opacity-40 text-xs font-black font-mono">$</span>
                  <input
                    type="number"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    className="w-full bg-brand-void border border-brand-border-opacity-20 rounded-lg py-2.5 pl-7 pr-3 text-xs text-brand-primary font-black focus:outline-none focus:border-brand-primary"
                    placeholder="10.00"
                    min="1"
                  />
                </div>
              </div>

              <button
                onClick={handleGenerateInvoice}
                disabled={processing}
                className="w-full py-3 rounded-xl border border-brand-border-opacity-20 bg-brand-primary text-brand-void text-[11px] font-black uppercase tracking-widest shadow-lg hover:bg-brand-primary-hover transition-all flex items-center justify-center gap-2"
              >
                <div className="w-3 h-3 rounded-full border-2 border-brand-void border-t-transparent animate-spin" style={{ display: processing ? 'block' : 'none' }} />
                <span>{processing ? "Generating..." : tw('deposit_cta')}</span>
              </button>

              {/* Toggleable Direct manual transfer fallback */}
              <div className="border-t border-brand-border-opacity-10 pt-3.5 flex flex-col">
                <button
                  type="button"
                  onClick={() => setShowManualFallback(!showManualFallback)}
                  className="w-full flex items-center justify-between py-1 text-[10px] font-black text-brand-primary/60 hover:text-brand-primary uppercase tracking-wider transition-colors cursor-pointer"
                >
                  <span>Or Pay Manually (Direct Transfer)</span>
                  <span className="text-xs transition-transform duration-200" style={{ transform: showManualFallback ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                    ▼
                  </span>
                </button>

                {showManualFallback && (
                  <div className="space-y-3 pt-3">
                    <div className="p-3 rounded-xl border border-amber-500/20 bg-amber-500/5 text-[9px] font-bold text-amber-300/80 leading-normal uppercase tracking-wider text-center">
                      ⚠️ WARNING: Include the unique comment memo in your transfer or your deposit will be lost.
                    </div>

                    <div className="flex flex-col space-y-1">
                      <label className="text-[8px] font-black text-brand-primary opacity-40 uppercase tracking-widest">{tw('destination')}</label>
                      <div className="cyber-input w-full p-2.5 rounded-xl border border-brand-border-opacity-10 bg-brand-void text-brand-primary text-[10px] font-bold font-mono truncate flex justify-between items-center cursor-pointer hover:border-brand-primary transition-all" onClick={() => {
                        navigator.clipboard.writeText(masterWallet);
                        setCopiedWallet(true);
                        telegramHaptic('light');
                        setTimeout(() => setCopiedWallet(false), 2000);
                      }}>
                        <span className="truncate">{masterWallet}</span>
                        {copiedWallet ? (
                          <FaCheck className="text-emerald-400 shrink-0 ml-2 animate-pulse" />
                        ) : (
                          <FaCopy className="text-brand-primary opacity-40 shrink-0 ml-2" />
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col space-y-1">
                      <label className="text-[8px] font-black text-emerald-400 uppercase tracking-widest">{tw('comment_memo')}</label>
                      <div className="cyber-input w-full p-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/5 text-emerald-400 text-[10px] font-black font-mono flex justify-between items-center cursor-pointer hover:border-emerald-500 transition-all" onClick={() => {
                        navigator.clipboard.writeText(memoComment);
                        setCopiedMemo(true);
                        telegramHaptic('light');
                        setTimeout(() => setCopiedMemo(false), 2000);
                      }}>
                        <span>{memoComment}</span>
                        {copiedMemo ? (
                          <FaCheck className="text-emerald-400 animate-pulse" />
                        ) : (
                          <FaCopy className="text-emerald-500 opacity-60" />
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Commission Alert */}
          <div className="p-3.5 rounded-lg border border-brand-border-opacity-10 bg-brand-bg-opacity-5 flex flex-col items-center justify-center text-[10px] font-bold text-brand-primary opacity-80 uppercase tracking-wider">
            <span>{tw('platform_fee')} <strong className="text-brand-primary">5%</strong></span>
          </div>

          {/* Messages and Simulation Fallback */}
          <div className="w-full pt-1 space-y-2">
            {successMessage && <div className="p-2.5 mb-2 bg-brand-emerald-opacity-10 border border-brand-emerald-opacity-20 rounded-lg text-emerald-500 text-[10px] font-bold uppercase tracking-wider text-center">{successMessage}</div>}
            {errorMessage && <div className="p-2.5 mb-2 bg-brand-rose-opacity-10 border border-brand-rose-opacity-20 rounded-lg text-rose-400 text-[10px] font-bold uppercase tracking-wider text-center">{errorMessage}</div>}

            {!invoiceUrl && process.env.NODE_ENV === 'development' && (
              <div className="p-3.5 rounded-2xl border border-dashed border-brand-primary/10 bg-brand-void/25 flex flex-col space-y-2 mt-2">
                <span className="text-[8px] font-black text-brand-primary/30 uppercase tracking-[0.2em] text-center">Dev Sandbox Tools</span>
                <button
                  onClick={() => { setDepositAmount("10"); handleDepositSubmit(); }}
                  disabled={processing}
                  className="w-full py-2 rounded-xl bg-brand-primary/5 border border-brand-primary/10 hover:bg-brand-primary/10 text-brand-primary/60 text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <div className="w-2.5 h-2.5 rounded-full border-2 border-brand-primary border-t-transparent animate-spin" style={{ display: processing ? 'block' : 'none' }} />
                  <span>{processing ? tw('listening_tx') : "Simulate Instant Deposit"}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
