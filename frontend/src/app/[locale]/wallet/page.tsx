'use client';

import LayoutWrapper from "@/components/LayoutWrapper";
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from "framer-motion";
import { apiFetch } from "@/lib/api";
import { useState, useEffect } from "react";
import { FaWallet, FaArrowUp, FaArrowDown, FaHistory, FaChevronLeft, FaTimes, FaCoins, FaNetworkWired, FaCopy, FaCheck } from "react-icons/fa";
import { telegramHaptic } from "@/lib/telegram";
import Link from "next/link";

interface Transaction {
 id: number;
 type: string;
 amount: number;
 fee: number;
 status: string;
 reference_id: string;
 created_at: string;
}

export default function WalletPage() {
 const t = useTranslations('Index');
 const tw = useTranslations('Wallet');

 // Balance & wallet state
 const [balance, setBalance] = useState<number>(0);
 const [walletAddress, setWalletAddress] = useState<string>("");
 const [transactions, setTransactions] = useState<Transaction[]>([]);
 const [loading, setLoading] = useState<boolean>(true);

 // Modals
 const [activeModal, setActiveModal] = useState<'none' | 'deposit' | 'withdraw' | 'connect'>('none');
 const [depositAmount, setDepositAmount] = useState<string>("10");
 const [withdrawAmount, setWithdrawAmount] = useState<string>("10");
 const [withdrawAddress, setWithdrawAddress] = useState<string>("");
 const [connectAddressInput, setConnectAddressInput] = useState<string>("");

 // TON Console Invoice states
 const [invoiceUrl, setInvoiceUrl] = useState<string>("");
 const [invoiceId, setInvoiceId] = useState<string>("");

 // Processing status
 const [processing, setProcessing] = useState<boolean>(false);
 const [successMessage, setSuccessMessage] = useState<string>("");
 const [errorMessage, setErrorMessage] = useState<string>("");
 const [tgUser, setTgUser] = useState<any>(null);
 const [showManualFallback, setShowManualFallback] = useState<boolean>(false);
 const [copiedWallet, setCopiedWallet] = useState<boolean>(false);
 const [copiedMemo, setCopiedMemo] = useState<boolean>(false);

 useEffect(() => {
 fetchWalletData();
 if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
 setTgUser(window.Telegram.WebApp.initDataUnsafe?.user);
 }
 }, []);

 const fetchWalletData = async () => {
 try {
 setLoading(true);
 const balRes = await apiFetch("/api/v1/wallet/balance");
 if (balRes.ok) {
 const balData = await balRes.json();
 setBalance(balData.balance);
 setWalletAddress(balData.wallet_address || "");
 if (balData.wallet_address) {
 setConnectAddressInput(balData.wallet_address);
 setWithdrawAddress(balData.wallet_address);
 }
 }

 const txRes = await apiFetch("/api/v1/wallet/transactions");
 if (txRes.ok) {
 const txData = await txRes.json();
 setTransactions(txData);
 }
 } catch (err) {
 console.error("Failed to fetch wallet data", err);
 } finally {
 setLoading(false);
 }
 };

 // Deposit Simulation
 const handleDepositSubmit = async () => {
 const amt = parseFloat(depositAmount);
 if (isNaN(amt) || amt <= 0) {
 setErrorMessage("Please enter a valid deposit amount.");
 return;
 }

 setProcessing(true);
 setErrorMessage("");
 setSuccessMessage("");

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
 sender: walletAddress || "EQ_SenderAddress_Simulated_xxxx",
 destination: "EQBvW8ZDR3YQ4vK42898h32fG3-q392u381uD28Ue9wU81E2",
 amount_cents: Math.round(amt * 100),
 comment: `ref_${tgId}`
 })
 });

 if (res.ok) {
 const data = await res.json();
 setBalance(data.new_balance);
 setSuccessMessage(`Simulated deposit of $${amt.toFixed(2)} successful! Platform credited $${(data.credited_amount / 100).toFixed(2)} after 5% platform fee.`);
 fetchWalletData();
 setTimeout(() => {
 setActiveModal('none');
 setSuccessMessage("");
 }, 3000);
 } else {
 const errData = await res.json();
 setErrorMessage(errData.detail || "Deposit failed.");
 }
 } catch (err) {
 setErrorMessage("Network error during deposit processing.");
 } finally {
 setProcessing(false);
 }
 };

  const handleGenerateInvoice = async () => {
    const amt = parseFloat(depositAmount);
    if (isNaN(amt) || amt <= 0) {
      setErrorMessage("Please enter a valid deposit amount.");
      return;
    }

    setProcessing(true);
    setErrorMessage("");
    setSuccessMessage("");
    setInvoiceUrl("");
    setInvoiceId("");

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
          setInvoiceId(data.invoice_id || "");
          setSuccessMessage("Invoice generated successfully! Scan the QR code or click 'Open in Wallet' to pay.");
        } else if (data.status === "success") {
          // Fallback mock success
          setBalance(data.new_balance);
          setSuccessMessage(`Simulated deposit of $${amt.toFixed(2)} successful! Platform credited $${(data.credited_amount / 100).toFixed(2)} after 5% platform fee.`);
          fetchWalletData();
          setTimeout(() => {
            setActiveModal('none');
            setSuccessMessage("");
          }, 3000);
        }
      } else {
        const errData = await res.json();
        setErrorMessage(errData.detail || "Failed to initiate deposit.");
      }
    } catch (err) {
      setErrorMessage("Network error during deposit initiation.");
    } finally {
      setProcessing(false);
    }
  };

  // Withdrawal Simulation
 const handleWithdrawSubmit = async () => {
 const amt = parseFloat(withdrawAmount);
 if (isNaN(amt) || amt <= 0) {
 setErrorMessage("Please enter a valid withdrawal amount.");
 return;
 }

 if (Math.round(amt * 100) > balance) {
 setErrorMessage("Insufficient funds in your platform balance.");
 return;
 }

 if (!withdrawAddress.trim()) {
 setErrorMessage("Please specify a target TON Wallet address.");
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
 const data = await res.json();
 setBalance(data.new_balance);
 setSuccessMessage(`Simulated withdrawal of $${amt.toFixed(2)} successfully sent to TON Network.`);
 fetchWalletData();
 setTimeout(() => {
 setActiveModal('none');
 setSuccessMessage("");
 }, 3000);
 } else {
 const errData = await res.json();
 setErrorMessage(errData.detail || "Withdrawal failed.");
 }
 } catch (err) {
 setErrorMessage("Network error during withdrawal processing.");
 } finally {
 setProcessing(false);
 }
 };

 // Connect Wallet Simulation
 const handleConnectSubmit = async () => {
 if (!connectAddressInput.trim()) {
 setErrorMessage("Please enter a valid wallet address.");
 return;
 }

 setProcessing(true);
 setErrorMessage("");
 setSuccessMessage("");

 try {
 const res = await apiFetch("/api/v1/wallet/connect", {
 method: "POST",
 body: JSON.stringify({ wallet_address: connectAddressInput })
 });

 if (res.ok) {
 const data = await res.json();
 setWalletAddress(data.wallet_address);
 setWithdrawAddress(data.wallet_address);
 setSuccessMessage("TON Web3 Wallet linked successfully!");
 setTimeout(() => {
 setActiveModal('none');
 setSuccessMessage("");
 }, 2000);
 } else {
 setErrorMessage("Failed to link wallet.");
 }
 } catch (err) {
 setErrorMessage("Network error linking wallet.");
 } finally {
 setProcessing(false);
 }
 };

 return (
 <LayoutWrapper className="justify-start pt-6 pb-32">
 <div className="w-full max-w-sm flex flex-col items-center px-4 mx-auto space-y-6">
 
 {/* Header Back Link */}
 <div className="w-full flex items-center justify-between">
 <Link href="/home" className="flex items-center text-brand-primary opacity-60 hover:opacity-100 transition-opacity text-xs font-bold uppercase tracking-wider space-x-1">
 <FaChevronLeft className="text-xs" />
 <span>{t('back')}</span>
 </Link>
 <span className="text-xs font-black text-brand-primary opacity-40 uppercase tracking-widest">{tw('title')}</span>
 </div>

 {/* HOLOGRAPHIC CYBER-CARD */}
 <motion.div 
 initial={{ opacity: 0, y: -20 }}
 animate={{ opacity: 1, y: 0 }}
 className="w-full relative overflow-hidden rounded-2xl p-6 glass-panel border border-brand-border-opacity-20 bg-cyber-card shadow-2xl flex flex-col justify-between h-48"
 >
 {/* Matrix cyber grid overlay */}
 <div className="absolute inset-0 bg-cyber-grid opacity-[0.03] pointer-events-none" />
 
 {/* Card Top */}
 <div className="flex justify-between items-start z-10">
 <div className="flex flex-col">
 <span className="text-[10px] font-black text-brand-primary opacity-40 uppercase tracking-widest mb-0.5">{tw('connected_status')}</span>
 <div className="flex items-center space-x-2">
 <FaCoins className="text-brand-primary text-sm animate-pulse" />
 <span className="text-xs font-bold text-brand-primary opacity-80 uppercase tracking-wider">{tw('usdt_balance')}</span>
 </div>
 </div>
 <div className="w-8 h-8 rounded-lg bg-brand-bg-opacity-10 flex items-center justify-center border border-brand-border-opacity-20">
 <FaWallet className="text-brand-primary text-sm" />
 </div>
 </div>

 {/* Card Middle Balance */}
 <div className="z-10 my-auto">
 <h2 className="text-3xl font-black text-brand-primary tracking-tighter uppercase">
 ${(balance / 100).toFixed(2)}
 </h2>
 </div>

 {/* Card Bottom Linked Wallet */}
 <div className="flex justify-between items-center z-10 pt-2 border-t border-brand-border-opacity-5">
 <div className="flex items-center space-x-2">
 <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
 <span className="w-2 h-2 rounded-full bg-emerald-500 absolute" />
 <span className="text-[10px] font-bold text-brand-primary opacity-60 uppercase tracking-widest">
 {walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : tw('no_wallet')}
 </span>
 </div>
 <span className="text-[9px] font-black text-brand-primary opacity-20 uppercase tracking-widest">{tw('version')}</span>
 </div>
 </motion.div>

 {/* QUICK ACTION TRIGGER BUTTONS */}
 <div className="w-full grid grid-cols-3 gap-2">
 <button 
 onClick={() => { setErrorMessage(""); setSuccessMessage(""); setActiveModal('connect'); }}
 className="py-3.5 rounded-2xl border border-brand-border-opacity-10 bg-brand-surface hover:bg-brand-bg-opacity-5 transition-all text-[10px] font-black uppercase tracking-widest text-brand-primary flex flex-col items-center justify-center space-y-1.5 cursor-pointer shadow-sm"
 >
 <FaNetworkWired className="text-xs text-brand-primary opacity-60" />
 <span>{tw('link_ton')}</span>
 </button>
 <button 
 onClick={() => { setErrorMessage(""); setSuccessMessage(""); setActiveModal('deposit'); }}
 className="py-3.5 rounded-2xl border border-brand-border-opacity-20 bg-brand-primary hover:bg-brand-primary-hover transition-all text-[10px] font-black uppercase tracking-widest text-brand-void flex flex-col items-center justify-center space-y-1.5 cursor-pointer shadow-md"
 >
 <FaArrowDown className="text-xs" />
 <span>{tw('deposit')}</span>
 </button>
 <button 
 onClick={() => { setErrorMessage(""); setSuccessMessage(""); setActiveModal('withdraw'); }}
 className="py-3.5 rounded-2xl border border-brand-border-opacity-10 bg-brand-surface hover:bg-brand-bg-opacity-5 transition-all text-[10px] font-black uppercase tracking-widest text-brand-primary flex flex-col items-center justify-center space-y-1.5 cursor-pointer shadow-sm"
 >
 <FaArrowUp className="text-xs text-brand-primary opacity-60" />
 <span>{tw('withdraw')}</span>
 </button>
 </div>

 {/* DEPOSIT/WITHDRAW COMMISSION BANNER */}
 <div className="w-full p-3 rounded-xl border border-brand-border-opacity-5 bg-brand-surface flex items-center justify-between text-[10px] font-bold text-brand-primary opacity-60 uppercase tracking-wider">
 <span>{tw('deposit_fee')} <strong className="text-brand-primary">5%</strong></span>
 <span>•</span>
 <span>{tw('game_rake')} <strong className="text-brand-primary">3%</strong></span>
 <span>•</span>
 <span>{tw('withdraw_fee')} <strong className="text-brand-primary">{tw('free')}</strong></span>
 </div>

 {/* TRANSACTION LEDGER SECTION */}
 <div className="w-full flex flex-col space-y-3 pt-2">
 <div className="flex items-center justify-between px-1">
 <div className="flex items-center space-x-2 text-brand-primary opacity-80">
 <FaHistory className="text-xs" />
 <h3 className="text-xs font-black uppercase tracking-widest">{tw('ledger')}</h3>
 </div>
 <span className="text-[9px] font-bold text-brand-primary opacity-40 uppercase tracking-widest">{tw('sorted_recent')}</span>
 </div>

 {loading ? (
 <div className="w-full text-center py-8 text-xs font-bold text-brand-primary opacity-40 uppercase tracking-widest animate-pulse">
 {tw('loading')}
 </div>
 ) : transactions.length === 0 ? (
 <div className="w-full glass-panel rounded-xl p-8 text-center text-xs font-bold text-brand-primary opacity-30 uppercase tracking-widest">
 {tw('no_entries')}
 </div>
 ) : (
 <div className="w-full flex flex-col space-y-2 max-h-72 overflow-y-auto">
 {transactions.map((tx) => {
 const isPositive = tx.amount > 0;
 const formattedAmt = `$${(Math.abs(tx.amount) / 100).toFixed(2)}`;
 const formattedFee = tx.fee > 0 ? `($${(tx.fee / 100).toFixed(2)} fee)` : "";
 
 return (
 <motion.div 
 key={tx.id}
 layout
 className="w-full p-3 rounded-xl glass-panel border border-brand-border-opacity-5 flex items-center justify-between bg-brand-surface"
 >
 <div className="flex items-center space-x-3">
 <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs ${
 tx.type === 'game_win' ? 'bg-brand-emerald-opacity-10 text-emerald-500' :
 tx.type === 'deposit' ? 'bg-brand-cyan-opacity-10 text-cyan-500' :
 tx.type === 'game_wager' ? 'bg-brand-rose-opacity-10 text-rose-500' :
 'bg-brand-amber-opacity-10 text-amber-500'
 }`}>
 {isPositive ? <FaArrowDown /> : <FaArrowUp />}
 </div>
 <div className="flex flex-col">
 <span className="text-[11px] font-black uppercase tracking-wide text-brand-primary">
 {tx.type === 'deposit' ? tw('tx_deposit') :
 tx.type === 'withdrawal' ? tw('tx_withdrawal') :
 tx.type === 'game_wager' ? tw('tx_wager') :
 tx.type === 'game_win' ? tw('tx_win') : tx.type}
 </span>
 <span className="text-[9px] font-bold text-brand-primary opacity-40 uppercase tracking-widest">
 {new Date(tx.created_at).toLocaleDateString()} {new Date(tx.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
 </span>
 </div>
 </div>
 <div className="flex flex-col items-end">
 <span className={`text-[12px] font-black ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
 {isPositive ? '+' : '-'}{formattedAmt}
 </span>
 {tx.fee > 0 && (
 <span className="text-[8px] font-bold text-brand-primary opacity-40 uppercase tracking-widest">
 {formattedFee}
 </span>
 )}
 </div>
 </motion.div>
 );
 })}
 </div>
 )}
 </div>

 {/* MODALS (Bottom Drawer Sheets) */}
 <AnimatePresence>
 {activeModal !== 'none' && (
 <div className="bottom-drawer-backdrop z-[100]">
 {/* Backdrop */}
 <motion.div 
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 onClick={() => { if(!processing) setActiveModal('none'); }}
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
 onClick={() => setActiveModal('none')}
 disabled={processing}
 className="absolute top-4 right-4 text-brand-primary opacity-40 hover:text-brand-primary"
 >
 <FaTimes />
 </button>
 
 {/* 1. DEPOSIT MODAL */}
 {activeModal === 'deposit' && (() => {
  const tgId = tgUser?.id || 1029384;
  const memoComment = `ref_${tgId}`;
  const masterWallet = "EQBvW8ZDR3YQ4vK42898h32fG3-q392u381uD28Ue9wU81E2";
  return (
  <div className="space-y-4">
  <h3 className="text-base font-black uppercase tracking-widest text-brand-primary ">{tw('deposit_invoice')}</h3>
  
  {invoiceUrl ? (
    // Show Real Invoice details
    <div className="space-y-4">
      <p className="text-[10px] font-bold text-brand-primary opacity-60 uppercase tracking-wider text-center">
        Real Web3 TON invoice generated successfully. Scan or tap below to pay using your connected Web3 wallet.
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
          onClick={() => { setInvoiceUrl(""); setInvoiceId(""); setSuccessMessage(""); setErrorMessage(""); }}
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
        <span>{processing ? "Generating..." : "Generate Web3 Invoice"}</span>
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

    {!invoiceUrl && (
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
  );
  })()}

 {/* 2. WITHDRAW MODAL */}
 {activeModal === 'withdraw' && (
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
 <input type="checkbox" className="accent-brand-primary w-3 h-3" defaultChecked />
 <span>{tw('check1')}</span>
 </label>
 <label className="flex items-center space-x-2 text-[9px] font-bold text-brand-primary opacity-60 uppercase tracking-widest cursor-pointer">
 <input type="checkbox" className="accent-brand-primary w-3 h-3" defaultChecked />
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
 disabled={processing || parseFloat(withdrawAmount) * 100 > balance}
 className="w-full mt-2 py-3 rounded-xl border border-brand-border-opacity-20 bg-brand-primary text-brand-void text-[11px] font-black uppercase tracking-widest hover:bg-brand-primary-hover transition-all disabled:opacity-50"
 >
 {processing ? tw('signing_tx') : tw('request_withdraw')}
 </button>
 </div>
 )}

 {/* 3. LINK WALLET MODAL */}
 {activeModal === 'connect' && (
 <div className="space-y-4">
 <h3 className="text-base font-black uppercase tracking-widest text-brand-primary ">{tw('connect_title')}</h3>
 <p className="text-[10px] font-bold text-brand-primary opacity-60 uppercase tracking-wider text-center">
 {tw('connect_desc')}
 </p>

 <div className="flex flex-col space-y-1">
 <label className="text-[9px] font-black text-brand-primary opacity-40 uppercase tracking-widest">{tw('ton_address')}</label>
 <input 
 type="text"
 value={connectAddressInput}
 onChange={(e) => setConnectAddressInput(e.target.value)}
 className="cyber-input w-full p-2.5 rounded-lg border border-brand-border-opacity-20 bg-brand-bg-opacity-20 text-brand-primary text-xs font-bold focus:outline-none"
 placeholder={tw('ton_placeholder')}
 />
 </div>

 {successMessage && <div className="p-2.5 bg-brand-emerald-opacity-10 border border-brand-emerald-opacity-20 rounded-lg text-emerald-500 text-[10px] font-bold uppercase tracking-wider">{successMessage}</div>}
 {errorMessage && <div className="p-2.5 bg-brand-rose-opacity-10 border border-brand-rose-opacity-20 rounded-lg text-rose-400 text-[10px] font-bold uppercase tracking-wider">{errorMessage}</div>}

 <button
 onClick={handleConnectSubmit}
 disabled={processing}
 className="w-full py-2.5 rounded-xl border border-brand-border-opacity-20 bg-brand-primary text-brand-void text-xs font-black uppercase tracking-widest hover:bg-brand-primary-hover transition-all"
 >
 {processing ? tw('linking_address') : tw('verify_link')}
 </button>
 </div>
 )}
 </motion.div>
 </div>
 )}
 </AnimatePresence>

 </div>
 </LayoutWrapper>
 );
}
