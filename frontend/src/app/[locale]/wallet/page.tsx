'use client';

import LayoutWrapper from "@/components/LayoutWrapper";
import { useTranslations, useLocale } from 'next-intl';
import { AnimatePresence, motion } from "framer-motion";
import { apiFetch } from "@/lib/api";
import { useState, useEffect, useRef, useCallback } from "react";
import { FaArrowUp, FaArrowDown, FaChevronLeft, FaWallet } from "react-icons/fa";
import Link from "next/link";
import DepositModal from "@/components/Wallet/DepositModal";
import WithdrawModal from "@/components/Wallet/WithdrawModal";
import WalletSelectorModal from "@/components/Wallet/WalletSelectorModal";
import CyberCard from "@/components/Wallet/CyberCard";
import TransactionLedger from "@/components/Wallet/TransactionLedger";
import { useUser } from "@/context/UserContext";
import { useAudio } from "@/hooks/useAudio";
import { Card } from "@/components/ui/Card";

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
  const { walletBalance: balance, walletAddress, syncBalance, balanceError } = useUser();
  const { play: playAudio } = useAudio();
  const prevBalanceRef = useRef<number | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  // Distinguishes "you have no transactions" from "the list failed to load".
  const [txError, setTxError] = useState(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (prevBalanceRef.current !== null && balance > prevBalanceRef.current) {
      playAudio('topup');
    }
    prevBalanceRef.current = balance;
  }, [balance, playAudio]);

  // Modals
  const [activeModal, setActiveModal] = useState<'none' | 'deposit' | 'withdraw' | 'connect'>('none');
  const [tgUser, setTgUser] = useState<any>(null);

  const fetchWalletData = useCallback(async () => {
    try {
      setLoading(true);
      setTxError(false);
      await syncBalance();

      const txRes = await apiFetch("/api/v1/wallet/transactions");
      if (txRes.ok) {
        const txData = await txRes.json();
        setTransactions(txData);
      } else {
        setTxError(true);
      }
    } catch (err) {
      console.error("Failed to fetch wallet data", err);
      setTxError(true);
    } finally {
      setLoading(false);
    }
  }, [syncBalance]);

  useEffect(() => {
    fetchWalletData();
    if (typeof window !== 'undefined') {
      if (window.Telegram?.WebApp) {
        setTgUser(window.Telegram.WebApp.initDataUnsafe?.user);
      }
      const params = new URLSearchParams(window.location.search);
      const status = params.get('status');
      const sessionId = params.get('session_id');
      if (status === 'success' && sessionId) {
        setActiveModal('deposit');
      }
    }
  }, [fetchWalletData]);

  return (
    <LayoutWrapper className="w-full">
      <div className="w-full max-w-sm md:max-w-xl lg:max-w-3xl flex flex-col items-center px-4 mx-auto pb-12">
      
        {/* Header Back Link */}
        <div className="w-full flex items-center justify-between">
          <Link href={`/${locale}/home`} className="html-back-button flex items-center text-brand-muted hover:opacity-100 transition-opacity text-xs font-bold uppercase tracking-wider space-x-1">
            <FaChevronLeft className="text-xs" />
            <span>{t('back')}</span>
          </Link>
          <span className="text-xs font-black text-brand-muted uppercase tracking-widest">{tw('title')}</span>
        </div>

        {/* HOLOGRAPHIC CYBER-CARD */}
        <div className="w-full mt-6">
          <CyberCard balance={balance} walletAddress={walletAddress} balanceError={balanceError} onRetry={fetchWalletData} />
        </div>

        {/* QUICK ACTION TRIGGER BUTTONS */}
        <div className="w-full grid grid-cols-3 gap-2.5 mt-6">
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => { setActiveModal('connect'); }}
            className="w-full"
          >
            <Card variant="glass" className="p-3.5 flex flex-col items-center justify-center space-y-2 border-brand-border-opacity-10 shadow-sm hover:border-brand-primary/30 group">
              <div className="w-8 h-8 rounded-xl bg-[var(--color-brand-primary-opacity-10)] text-brand-primary flex items-center justify-center transition-all group-hover:scale-110">
                <FaWallet className="text-xs" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider text-brand-muted">{tw('link_ton')}</span>
            </Card>
          </motion.button>
          
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => { setActiveModal('deposit'); }}
            className="w-full"
          >
            <Card variant="glass" className="p-3.5 flex flex-col items-center justify-center space-y-2 border-brand-border-opacity-10 shadow-sm hover:border-brand-success/30 group">
              <div className="w-8 h-8 rounded-xl bg-[var(--color-brand-success-opacity-10)] text-brand-success flex items-center justify-center transition-all group-hover:scale-110">
                <FaArrowDown className="text-xs" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider text-brand-muted">{tw('deposit')}</span>
            </Card>
          </motion.button>
          
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => { setActiveModal('withdraw'); }}
            className="w-full"
          >
            <Card variant="glass" className="p-3.5 flex flex-col items-center justify-center space-y-2 border-brand-border-opacity-10 shadow-sm hover:border-brand-danger/30 group">
              <div className="w-8 h-8 rounded-xl bg-[var(--color-brand-danger-opacity-10)] text-brand-danger flex items-center justify-center transition-all group-hover:scale-110">
                <FaArrowUp className="text-xs" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider text-brand-muted">{tw('withdraw')}</span>
            </Card>
          </motion.button>
        </div>

        {/* DEPOSIT/WITHDRAW COMMISSION BANNER */}
        <div className="w-full mt-6">
          <Card variant="glass" className="w-full p-3 border-brand-border-opacity-10 shadow-sm flex items-center justify-between text-[10px] font-bold text-brand-muted uppercase tracking-widest relative overflow-hidden">
            <div className="absolute inset-0 bg-brand-surface opacity-50 pointer-events-none" />
            <span className="flex items-center gap-1.5 relative z-10">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-success shadow-neon" />
              {tw('deposit_fee')} <strong className="text-brand-success font-black">5%</strong>
            </span>
            <span className="opacity-30 relative z-10">•</span>
            <span className="flex items-center gap-1.5 relative z-10">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-primary shadow-neon" />
              {tw('withdraw_fee')} <strong className="text-brand-primary font-black">$0.20</strong>
            </span>
          </Card>
        </div>

        {/* TRANSACTION LEDGER */}
        <div className="w-full mt-6">
          <TransactionLedger 
            loading={loading}
            transactions={transactions}
            balance={balance}
            error={txError}
            onRetry={fetchWalletData}
          />
        </div>

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
