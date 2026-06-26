'use client';

import LayoutWrapper from "@/components/LayoutWrapper";
import { useTranslations, useLocale } from 'next-intl';
import { AnimatePresence } from "framer-motion";
import { apiFetch } from "@/lib/api";
import { useState, useEffect } from "react";
import { FaArrowUp, FaArrowDown, FaChevronLeft, FaWallet } from "react-icons/fa";
import Link from "next/link";
import DepositModal from "@/components/Wallet/DepositModal";
import WithdrawModal from "@/components/Wallet/WithdrawModal";
import WalletSelectorModal from "@/components/Wallet/WalletSelectorModal";
import CyberCard from "@/components/Wallet/CyberCard";
import TransactionLedger from "@/components/Wallet/TransactionLedger";
import { useUser } from "@/context/UserContext";

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
  const locale = useLocale();

  // Balance & wallet state
  const { walletBalance: balance, walletAddress, syncBalance } = useUser();
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
      await syncBalance();

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
          <Link href={`/${locale}/home`} className="flex items-center text-brand-primary opacity-60 hover:opacity-100 transition-opacity text-xs font-bold uppercase tracking-wider space-x-1">
            <FaChevronLeft className="text-xs" />
            <span>{t('back')}</span>
          </Link>
          <span className="text-xs font-black text-brand-primary opacity-40 uppercase tracking-widest">{tw('title')}</span>
        </div>

        {/* HOLOGRAPHIC CYBER-CARD */}
        <CyberCard balance={balance} walletAddress={walletAddress} />

        {/* QUICK ACTION TRIGGER BUTTONS */}
        <div className="w-full grid grid-cols-3 gap-2">
          <button 
            onClick={() => { setActiveModal('connect'); }}
            className="py-3.5 rounded-2xl border transition-all text-[10px] font-black uppercase tracking-widest flex flex-col items-center justify-center space-y-1.5 cursor-pointer shadow-sm"
            style={{
              borderColor: 'rgba(0,196,154,0.25)',
              background: 'rgba(0,196,154,0.07)',
              color: '#00C49A',
            }}
          >
            <FaWallet className="text-xs" style={{ color: '#00C49A' }} />
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
        <TransactionLedger loading={loading} transactions={transactions} />

        <AnimatePresence>
          {activeModal === 'deposit' && (
            <DepositModal
              onClose={() => setActiveModal('none')}
              onSuccess={fetchWalletData}
              walletAddress={walletAddress}
              tgUser={tgUser}
              tw={tw}
            />
          )}
          {activeModal === 'withdraw' && (
            <WithdrawModal
              onClose={() => setActiveModal('none')}
              onSuccess={fetchWalletData}
              balance={balance}
              initialWithdrawAddress={walletAddress}
              tw={tw}
            />
          )}
          {activeModal === 'connect' && (
            <WalletSelectorModal
              onClose={() => setActiveModal('none')}
              onConnected={fetchWalletData}
              tw={tw}
            />
          )}
        </AnimatePresence>

      </div>
    </LayoutWrapper>
  );
}
