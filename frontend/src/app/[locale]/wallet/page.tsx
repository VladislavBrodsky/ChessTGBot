'use client';

import { PageHeader } from '@/components/ui/PageHeader';
import LayoutWrapper from "@/components/LayoutWrapper";
import { useTranslations } from 'next-intl';
import { AnimatePresence } from "framer-motion";
import { useSWRFetch } from '@/hooks/useSWRFetch';
import { useState, useEffect, useRef, useCallback } from "react";
import { FaArrowUp, FaArrowDown, FaWallet } from "react-icons/fa";
import { DepositDialog as DepositModal, WalletSelectorDialog as WalletSelectorModal } from '@/components/Wallet/WalletDialogs';
import WithdrawModal from "@/components/Wallet/WithdrawModal";
import CyberCard from "@/components/Wallet/CyberCard";
import TransactionLedger from "@/components/Wallet/TransactionLedger";
import { useUser } from "@/context/UserContext";
import { useAudio } from "@/hooks/useAudio";
import { logTelemetryEvent } from "@/lib/telemetry";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { FiCreditCard } from 'react-icons/fi';

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
  const tw = useTranslations('Wallet');

  // Balance & wallet state
  const { walletBalance: balance, walletAddress, syncBalance, balanceError, loadingBalance } = useUser();
  const { play: playAudio } = useAudio();
  const prevBalanceRef = useRef<number | null>(null);
  const { data: txData, error: txError, isLoading: loading, mutate: fetchTransactions } = useSWRFetch<Transaction[]>('/api/v1/wallet/transactions', { revalidateOnFocus: false, dedupingInterval: 30_000 });
  const transactions = Array.isArray(txData) ? txData : [];

  useEffect(() => {
    if (loadingBalance || balanceError) return;
    if (prevBalanceRef.current !== null && balance > prevBalanceRef.current) {
      playAudio('topup');
    }
    prevBalanceRef.current = balance;
  }, [balance, balanceError, loadingBalance, playAudio]);

  // Modals
  const [activeModal, setActiveModal] = useState<'none' | 'deposit' | 'withdraw' | 'connect'>('none');

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
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const status = params.get('status');
      const sessionId = params.get('session_id');
      if (status === 'success' && sessionId) {
        setActiveModal('deposit');
      }
      // One-shot: Home sends a player with an empty balance straight to the
      // deposit drawer. Drop the parameter so a reload does not reopen it.
      if (params.get('deposit') === '1') {
        setActiveModal('deposit');
        logTelemetryEvent('topup_entry', { source: 'home_zero_balance' });
        params.delete('deposit');
        const query = params.toString();
        window.history.replaceState(window.history.state, '', `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`);
      }
    }
  }, []);

  return (
    <LayoutWrapper className="w-full ">
      <main className="w-full app-page flex flex-col items-center mx-auto ">
      
        {/* Header Back Link */}
        <PageHeader icon={<FiCreditCard />} tone="info" title={tw('title')} description={tw('page_purpose')} />

        {/* HOLOGRAPHIC CYBER-CARD */}
        <section aria-labelledby="wallet-balance-heading" className="w-full">
          <h2 id="wallet-balance-heading" className="sr-only">{tw('usdt_balance')}</h2>
          <CyberCard
            balance={balance}
            walletAddress={walletAddress}
            balanceError={balanceError}
            loading={loadingBalance}
            onRetry={refreshWalletData}
            onConnect={() => setActiveModal('connect')}
          />
        </section>

        <div className="grid w-full grid-cols-2 gap-2">
          <Button variant="action" size="lg" leftIcon={<FaArrowDown />} onClick={() => setActiveModal('deposit')}>{tw('deposit')}</Button>
          <Button variant="secondary" size="lg" leftIcon={<FaArrowUp />}
            disabled={loadingBalance}
            onClick={() => { if (balanceError) { void refreshWalletData(); return; } setActiveModal('withdraw'); }}>
            {balanceError ? tw('balance_unavailable') : tw('withdraw')}
          </Button>
        </div>
        <Card variant="solid" className="w-full p-3 space-y-3">
          <Button variant="secondary" className="w-full" leftIcon={<FaWallet />} onClick={() => setActiveModal('connect')}>
            {walletAddress ? tw('reconnect') : tw('link_ton')}
          </Button>
          <dl className="grid grid-cols-2 gap-3 text-caption">
            <div><dt className="text-brand-muted">{tw('deposit_fee')}</dt><dd className="text-sm font-semibold text-brand-primary">5%</dd></div>
            <div><dt className="text-brand-muted">{tw('withdraw_fee')}</dt><dd className="text-sm font-semibold text-brand-primary">$1.50</dd></div>
          </dl>
        </Card>

        {/* TRANSACTION LEDGER */}
        <div className="w-full">
          <TransactionLedger 
            loading={loading}
            transactions={transactions}
            error={Boolean(txError)}
            onRetry={refreshWalletData}
          />
        </div>

        <AnimatePresence>
          {activeModal === 'deposit' && (
            <DepositModal
              onClose={() => setActiveModal('none')}
              onSuccess={refreshWalletData}
              walletAddress={walletAddress}
              walletBalance={balance}
            />
          )}
          {activeModal === 'withdraw' && (
            <WithdrawModal
              onClose={() => setActiveModal('none')}
              onSuccess={refreshWalletData}
              balance={balance}
              initialWithdrawAddress={walletAddress}
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
