'use client';

import { PageHeader } from '@/components/ui/PageHeader';
import LayoutWrapper from "@/components/LayoutWrapper";
import { useTranslations, useLocale } from 'next-intl';
import { AnimatePresence } from "framer-motion";
import { apiFetch } from "@/lib/api";
import { useState, useEffect, useRef, useCallback } from "react";
import { FaArrowUp, FaArrowDown, FaWallet } from "react-icons/fa";
import DepositModal from "@/components/Wallet/DepositModal";
import WithdrawModal from "@/components/Wallet/WithdrawModal";
import WalletSelectorModal from "@/components/Wallet/WalletSelectorModal";
import CyberCard from "@/components/Wallet/CyberCard";
import TransactionLedger from "@/components/Wallet/TransactionLedger";
import { useUser } from "@/context/UserContext";
import { useAudio } from "@/hooks/useAudio";
import { Button } from "@/components/ui/Button";
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
  const { walletBalance: balance, walletAddress, syncBalance, balanceError, loadingBalance } = useUser();
  const { play: playAudio } = useAudio();
  const prevBalanceRef = useRef<number | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  // Distinguishes "you have no transactions" from "the list failed to load".
  const [txError, setTxError] = useState(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (loadingBalance || balanceError) return;
    if (prevBalanceRef.current !== null && balance > prevBalanceRef.current) {
      playAudio('topup');
    }
    prevBalanceRef.current = balance;
  }, [balance, balanceError, loadingBalance, playAudio]);

  // Modals
  const [activeModal, setActiveModal] = useState<'none' | 'deposit' | 'withdraw' | 'connect'>('none');

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      setTxError(false);
      const txRes = await apiFetch("/api/v1/wallet/transactions");
      if (txRes.ok) {
        const txData = await txRes.json();
        if (!Array.isArray(txData)) throw new Error('Invalid transaction history');
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
  }, []);

  const refreshWalletData = useCallback(async () => {
    // Balance errors are surfaced by UserProvider; they must not prevent the
    // independently useful transaction history from refreshing.
    await Promise.allSettled([syncBalance(), fetchTransactions()]);
  }, [syncBalance, fetchTransactions]);

  useEffect(() => {
    // UserProvider already starts the balance request for this SWR key. Calling
    // syncBalance here used to revalidate it again on every callback identity
    // change, causing an unbounded balance-request loop. Transaction history is
    // independent and is the only wallet-specific request needed on mount.
    fetchTransactions();
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const status = params.get('status');
      const sessionId = params.get('session_id');
      if (status === 'success' && sessionId) {
        setActiveModal('deposit');
      }
    }
  }, [fetchTransactions]);

  return (
    <LayoutWrapper className="w-full ">
      <main className="w-full app-page flex flex-col items-center mx-auto ">
      
        {/* Header Back Link */}
        <PageHeader title={tw('title')} backHref={`/${locale}/home`} backLabel={t('back')} />

        {/* HOLOGRAPHIC CYBER-CARD */}
        <section aria-labelledby="wallet-balance-heading" className="w-full">
          <h2 id="wallet-balance-heading" className="sr-only">Wallet Balance Card</h2>
          <CyberCard balance={balance} walletAddress={walletAddress} balanceError={balanceError} loading={loadingBalance} onRetry={refreshWalletData} />
        </section>

        <div className="grid w-full grid-cols-2 gap-3">
          <Button variant="action" size="lg" leftIcon={<FaArrowDown />} onClick={() => setActiveModal('deposit')}>{tw('deposit')}</Button>
          <Button variant="secondary" size="lg" leftIcon={<FaArrowUp />}
            disabled={loadingBalance}
            onClick={() => { if (balanceError) { void refreshWalletData(); return; } setActiveModal('withdraw'); }}>
            {balanceError ? tw('balance_unavailable') : loadingBalance ? `${tw('usdt_balance')}…` : tw('withdraw')}
          </Button>
        </div>
        <Card variant="solid" className="w-full p-4 sm:p-5 space-y-4">
          <Button variant="secondary" className="w-full" leftIcon={<FaWallet />} onClick={() => setActiveModal('connect')}>{tw('link_ton')}</Button>
          <dl className="grid grid-cols-2 gap-4 text-caption">
            <div><dt className="text-brand-muted">{tw('deposit_fee')}</dt><dd className="mt-1 text-sm font-semibold text-brand-primary">5%</dd></div>
            <div><dt className="text-brand-muted">{tw('withdraw_fee')}</dt><dd className="mt-1 text-sm font-semibold text-brand-primary">$0.20</dd></div>
          </dl>
        </Card>

        {/* TRANSACTION LEDGER */}
        <div className="w-full">
          <TransactionLedger 
            loading={loading}
            transactions={transactions}
            balance={loadingBalance || balanceError ? undefined : balance}
            error={txError}
            onRetry={refreshWalletData}
          />
        </div>

        <AnimatePresence>
          {activeModal === 'deposit' && (
            <DepositModal
              onClose={() => setActiveModal('none')}
              onSuccess={refreshWalletData}
              walletAddress={walletAddress}
              tw={tw}
            />
          )}
          {activeModal === 'withdraw' && (
            <WithdrawModal
              onClose={() => setActiveModal('none')}
              onSuccess={refreshWalletData}
              balance={balance}
              initialWithdrawAddress={walletAddress}
              tw={tw}
            />
          )}
          {activeModal === 'connect' && (
            <WalletSelectorModal
              onClose={() => setActiveModal('none')}
              onConnected={refreshWalletData}
              tw={tw}
            />
          )}
        </AnimatePresence>

      </main>
    </LayoutWrapper>
  );
}
