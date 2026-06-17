'use client';

import LayoutWrapper from "@/components/LayoutWrapper";
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from "framer-motion";
import { apiFetch } from "@/lib/api";
import { useState, useEffect } from "react";
import { FaWallet, FaArrowUp, FaArrowDown, FaHistory, FaChevronLeft, FaCoins, FaNetworkWired } from "react-icons/fa";
import Link from "next/link";
import DepositModal from "@/components/Wallet/DepositModal";
import WithdrawModal from "@/components/Wallet/WithdrawModal";
import LinkWalletModal from "@/components/Wallet/LinkWalletModal";

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
  const [walletAddress, setWalletAddress] = useState<string>(" ");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Modals
  const [activeModal, setActiveModal] = useState<'none' | 'deposit' | 'withdraw' | 'connect'>('none');
  const [tgUser, setTgUser] = useState<any>(null);

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
 onClick={() => { setActiveModal('connect'); }}
 className="py-3.5 rounded-2xl border border-brand-border-opacity-10 bg-brand-surface hover:bg-brand-bg-opacity-5 transition-all text-[10px] font-black uppercase tracking-widest text-brand-primary flex flex-col items-center justify-center space-y-1.5 cursor-pointer shadow-sm"
 >
 <FaNetworkWired className="text-xs text-brand-primary opacity-60" />
 <span>{tw('link_ton')}</span>
 </button>
 <button 
 onClick={() => { setActiveModal('deposit'); }}
 className="py-3.5 rounded-2xl border border-brand-border-opacity-20 bg-brand-primary hover:bg-brand-primary-hover transition-all text-[10px] font-black uppercase tracking-widest text-brand-void flex flex-col items-center justify-center space-y-1.5 cursor-pointer shadow-md"
 >
 <FaArrowDown className="text-xs" />
 <span>{tw('deposit')}</span>
 </button>
 <button 
 onClick={() => { setActiveModal('withdraw'); }}
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

  <AnimatePresence>
    {activeModal === 'deposit' && (
      <DepositModal
        isOpen={activeModal === 'deposit'}
        onClose={() => setActiveModal('none')}
        onSuccess={fetchWalletData}
        walletAddress={walletAddress}
        tgUser={tgUser}
        tw={tw}
      />
    )}
    {activeModal === 'withdraw' && (
      <WithdrawModal
        isOpen={activeModal === 'withdraw'}
        onClose={() => setActiveModal('none')}
        onSuccess={fetchWalletData}
        balance={balance}
        initialWithdrawAddress={walletAddress}
        tw={tw}
      />
    )}
    {activeModal === 'connect' && (
      <LinkWalletModal
        isOpen={activeModal === 'connect'}
        onClose={() => setActiveModal('none')}
        onSuccess={fetchWalletData}
        initialAddress={walletAddress}
        tw={tw}
      />
    )}
  </AnimatePresence>

  </div>
  </LayoutWrapper>
  );
}
