'use client';

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FaCheck, FaCopy } from "react-icons/fa";
import { useTranslations } from "next-intl";
import { apiFetch } from "@/lib/api";
import { telegramHaptic } from "@/lib/telegram";

interface LobbyDepositDrawerProps {
  chosenWager: number;
  walletBalance: number;
  tgUser: any;
  onClose: () => void;
  syncBalance: () => Promise<void>;
  onDepositSuccess: (newBalance: number) => void;
}

export default function LobbyDepositDrawer({
  chosenWager,
  walletBalance,
  tgUser,
  onClose,
  syncBalance,
  onDepositSuccess,
}: LobbyDepositDrawerProps) {
  const t = useTranslations('Index');
  const tw = useTranslations('Wallet');
  const [depositAmount, setDepositAmount] = useState<string>("10.00");
  const [invoiceUrl, setInvoiceUrl] = useState<string>("");
  const [isDepositing, setIsDepositing] = useState<boolean>(false);
  const [depositSuccess, setDepositSuccess] = useState<string>("");
  const [depositError, setDepositError] = useState<string>("");
  const [showManualFallback, setShowManualFallback] = useState<boolean>(false);
  const [copiedWallet, setCopiedWallet] = useState<boolean>(false);
  const [copiedMemo, setCopiedMemo] = useState<boolean>(false);

  // Sync depositAmount on load if chosenWager > walletBalance
  useEffect(() => {
    if (chosenWager > walletBalance) {
      const deficitCents = chosenWager - walletBalance;
      const deficitUsd = (deficitCents / 100).toFixed(2);
      setDepositAmount(deficitUsd);
    }
  }, [chosenWager, walletBalance]);

  // Poll for balance updates while deposit drawer is active
  useEffect(() => {
    const pollInterval = setInterval(() => {
      syncBalance();
    }, 4000);

    return () => clearInterval(pollInterval);
  }, [syncBalance]);

  const handleGenerateLobbyInvoice = async () => {
    const amt = parseFloat(depositAmount);
    if (isNaN(amt) || amt <= 0) {
      setDepositError(tw('invalid_amount'));
      return;
    }

    setIsDepositing(true);
    setDepositError("");
    setDepositSuccess("");
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
          setDepositSuccess(tw('deposit_invoice_success'));
        } else if (data.status === "success") {
          onDepositSuccess(data.new_balance);
          setDepositSuccess(tw('deposit_success_sim', { amount: `$${amt.toFixed(2)}`, credited: `$${(data.credited_amount / 100).toFixed(2)}` }));
          setTimeout(() => {
            onClose();
            setDepositSuccess("");
          }, 2000);
        }
      } else {
        const errData = await res.json();
        setDepositError(errData.detail || tw('deposit_failed'));
      }
    } catch {
      setDepositError(tw('deposit_network_error'));
    } finally {
      setIsDepositing(false);
    }
  };

  const handleSimulateLobbyDeposit = async () => {
    const amt = parseFloat(depositAmount);
    if (isNaN(amt) || amt <= 0) {
      setDepositError(tw('invalid_amount'));
      return;
    }

    setIsDepositing(true);
    setDepositError("");
    setDepositSuccess("");

    const tgId = tgUser?.id || 1029384;
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
          sender: "EQ_SenderAddress_Simulated_xxxx",
          destination: "EQBvW8ZDR3YQ4vK42898h32fG3-q392u381uD28Ue9wU81E2",
          amount_cents: Math.round(amt * 100),
          comment: `ref_${tgId}`
        })
      });

      if (res.ok) {
        const data = await res.json();
        onDepositSuccess(data.new_balance);
        setDepositSuccess(tw('deposit_success_sim', { amount: `$${amt.toFixed(2)}`, credited: `$${(data.credited_amount / 100).toFixed(2)}` }));
        setTimeout(() => {
          onClose();
          setDepositSuccess("");
        }, 2000);
      } else {
        const errData = await res.json();
        setDepositError(errData.detail || tw('deposit_failed'));
      }
    } catch {
      setDepositError(tw('deposit_network_error'));
    } finally {
      setIsDepositing(false);
    }
  };

  const isProduction = process.env.NODE_ENV === 'production';

  return (
    <div className="bottom-drawer-backdrop z-[100]">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }} 
        onClick={onClose}
        className="absolute inset-0 bg-[rgba(0,0,0,0.4)]" 
      />
      <motion.div 
        initial={{ y: "100%" }} 
        animate={{ y: 0 }} 
        exit={{ y: "100%" }} 
        transition={{ type: "spring", damping: 30, stiffness: 350 }}
        className="bottom-drawer-sheet relative z-10"
      >
        <div className="bottom-drawer-handle" />
        
        <div className="flex flex-col items-center text-center mt-2 w-full">
          <h2 className="text-xl font-black uppercase tracking-widest mb-1 text-brand-primary">
            {tw('deposit_invoice')}
          </h2>
          <p className="text-[10px] font-bold text-brand-primary opacity-60 uppercase tracking-[0.2em] mb-4">
            Quick Top Up & Play
          </p>
          
          {/* Cyber Grid Summary Card */}
          <div className="w-full bg-brand-void/50 rounded-2xl p-4 border border-brand-border-opacity-5 mb-4 text-xs font-bold text-brand-primary/80 leading-relaxed space-y-2.5 shadow-inner">
            <div className="grid grid-cols-2 gap-2 text-[10px] uppercase tracking-wider">
              <div className="text-left opacity-50">Wager Stake</div>
              <div className="text-right text-brand-primary font-black">${(chosenWager / 100).toFixed(2)} USDT</div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[10px] uppercase tracking-wider">
              <div className="text-left opacity-50">Your Balance</div>
              <div className="text-right text-brand-primary/70 font-black">${(walletBalance / 100).toFixed(2)} USDT</div>
            </div>
            <div className="h-px bg-brand-border-opacity-5 my-0.5" />
            <div className="grid grid-cols-2 gap-2 text-[11px] uppercase tracking-widest font-black">
              <div className="text-left text-brand-primary opacity-60">Deficit Needed</div>
              <div className="text-right text-brand-primary">${((chosenWager - walletBalance) / 100).toFixed(2)} USDT</div>
            </div>
          </div>
        </div>
        
        {invoiceUrl ? (
          // Show Real Invoice details
          <div className="space-y-4 w-full">
            <p className="text-[10px] font-bold text-brand-primary opacity-60 uppercase tracking-wider text-center">
              {tw('deposit_invoice_success')}
            </p>

            <div className="w-full bg-brand-void p-4 rounded-xl border border-brand-border-opacity-20 flex flex-col items-center justify-center space-y-3 relative overflow-hidden">
              <div className="absolute inset-0 bg-brand-bg-opacity-5 animate-pulse pointer-events-none" />
              <div className="w-32 h-32 bg-white rounded-lg flex items-center justify-center p-2 relative z-10 mx-auto">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(invoiceUrl)}`} 
                  alt="Invoice QR Code" 
                  className="w-full h-full object-contain" 
                />
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
                onClick={() => { setInvoiceUrl(""); setDepositSuccess(""); setDepositError(""); }}
                className="w-full py-2.5 rounded-xl border border-brand-border-opacity-10 bg-brand-void text-brand-primary text-[10px] font-bold uppercase tracking-widest hover:border-brand-primary transition-all cursor-pointer"
              >
                Change Amount / Back
              </button>
            </div>
          </div>
        ) : (
          // Generate Invoice Form
          <div className="space-y-4 w-full">
            <p className="text-[10px] font-bold text-brand-primary opacity-60 uppercase tracking-wider text-center">
              {tw('deposit_desc')}
            </p>

            <div className="flex flex-col space-y-2">
              <label className="text-[9px] font-black text-brand-primary opacity-40 uppercase tracking-widest">Top Up Amount (USDT)</label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-brand-primary opacity-40 text-xs font-black font-mono">$</span>
                <input
                  type="number"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="w-full bg-brand-void border border-brand-border-opacity-20 rounded-lg py-2.5 pl-7 pr-3 text-xs text-brand-primary font-black focus:outline-none focus:border-brand-primary"
                  placeholder="5.00"
                  min="0.01"
                  step="0.01"
                />
              </div>
            </div>

            <button
              onClick={handleGenerateLobbyInvoice}
              disabled={isDepositing}
              className="w-full py-3 rounded-xl border border-brand-border-opacity-20 bg-brand-primary text-brand-void text-[11px] font-black uppercase tracking-widest shadow-lg hover:bg-brand-primary-hover transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <div className="w-3 h-3 rounded-full border-2 border-brand-void border-t-transparent animate-spin" style={{ display: isDepositing ? 'block' : 'none' }} />
              <span>{isDepositing ? "Generating..." : tw('deposit_cta')}</span>
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

                  {(() => {
                    const tgId = tgUser?.id || 1029384;
                    const memoComment = `ref_${tgId}`;
                    const masterWallet = "EQBvW8ZDR3YQ4vK42898h32fG3-q392u381uD28Ue9wU81E2";
                    return (
                      <div className="space-y-3">
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
                    );
                  })()}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Commission Alert */}
        <div className="p-3 rounded-lg border border-brand-border-opacity-10 bg-brand-bg-opacity-5 flex flex-col items-center justify-center text-[10px] font-bold text-brand-primary opacity-80 uppercase tracking-wider w-full mt-2">
          <span>{tw('platform_fee')} <strong className="text-brand-primary">5%</strong></span>
        </div>

        {/* Messages and Simulation Fallback */}
        <div className="w-full pt-2 space-y-2">
          {depositSuccess && <div className="p-2.5 mb-2 bg-brand-emerald-opacity-10 border border-brand-emerald-opacity-20 rounded-lg text-emerald-500 text-[10px] font-bold uppercase tracking-wider text-center">{depositSuccess}</div>}
          {depositError && <div className="p-2.5 mb-2 bg-brand-rose-opacity-10 border border-brand-rose-opacity-20 rounded-lg text-rose-400 text-[10px] font-bold uppercase tracking-wider text-center">{depositError}</div>}

          {!invoiceUrl && !isProduction && (
            <div className="p-3.5 rounded-2xl border border-dashed border-brand-primary/10 bg-brand-void/25 flex flex-col space-y-2 mt-2">
              <span className="text-[8px] font-black text-brand-primary/30 uppercase tracking-[0.2em] text-center">Dev Sandbox Tools</span>
              <button
                onClick={handleSimulateLobbyDeposit}
                disabled={isDepositing}
                className="w-full py-2 rounded-xl bg-brand-primary/5 border border-brand-primary/10 hover:bg-brand-primary/10 text-brand-primary/60 text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <div className="w-2.5 h-2.5 rounded-full border-2 border-brand-primary border-t-transparent animate-spin" style={{ display: isDepositing ? 'block' : 'none' }} />
                <span>{isDepositing ? "Simulating..." : "Simulate Instant Deposit"}</span>
              </button>
            </div>
          )}
          
          <button
            onClick={onClose}
            className="w-full py-2.5 mt-2 rounded-xl border border-brand-border-opacity-10 bg-brand-surface text-brand-primary/70 text-[10px] font-bold uppercase tracking-widest hover:border-brand-primary transition-all cursor-pointer"
          >
            {t('back')}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
