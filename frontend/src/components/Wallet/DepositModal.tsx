'use client';

import TonConnectProvider from '@/components/TonConnectProvider';

import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FaWallet, FaAngleDown, FaCoins } from "react-icons/fa";
import { SiTether } from "react-icons/si";
import { apiFetch } from "@/lib/api";
import { telegramHaptic } from "@/lib/telegram";
import { copyToClipboard } from "@/lib/clipboard";
import { logTelemetryEvent } from "@/lib/telemetry";
import { useTonConnectUI, useTonWallet } from '@tonconnect/ui-react';
import { beginCell, Address, Cell } from '@ton/core';
import { useNavbarHideWhileMounted } from "@/context/NavbarContext";
import { useUser } from "@/context/UserContext";
import { useTranslations } from 'next-intl';
import { ErrorState } from '@/components/ui/ErrorState';
import { Skeleton } from '@/components/ui/Skeleton';
import { Drawer } from '@/components/ui/Drawer';
import { SegmentedControl } from '@/components/ui/SegmentedControl';

import {
  DepositSuccessView,
  ManualDepositSection,
} from './deposit';

class DepositFeedbackError extends Error {}

type DepositTab = 'crypto' | 'direct';

// Card checkout happens outside the Mini App (Telegram opens Stripe in its
// browser), so the player returns to a modal that knows nothing about the
// payment. Remember the session, and keep asking the server about it, so the
// balance and a success screen appear without the player doing anything.
// verify-session asks Stripe and credits through the idempotent server path.
const PENDING_STRIPE_KEY = 'deposit_pending_stripe';
const PENDING_STRIPE_MAX_AGE_MS = 30 * 60 * 1000;
const STRIPE_POLL_INTERVAL_MS = 4000;
const STRIPE_POLL_WINDOW_MS = 10 * 60 * 1000;

type PendingStripe = { sessionId: string; startedAt: number };

function readPendingStripe(): PendingStripe | null {
  try {
    const raw = typeof window !== 'undefined' ? window.sessionStorage.getItem(PENDING_STRIPE_KEY) : null;
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed?.sessionId !== 'string' || typeof parsed?.startedAt !== 'number') return null;
    if (Date.now() - parsed.startedAt > PENDING_STRIPE_MAX_AGE_MS) {
      window.sessionStorage.removeItem(PENDING_STRIPE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function writePendingStripe(pending: PendingStripe | null) {
  try {
    if (pending) window.sessionStorage.setItem(PENDING_STRIPE_KEY, JSON.stringify(pending));
    else window.sessionStorage.removeItem(PENDING_STRIPE_KEY);
  } catch {
    // Storage can be unavailable in some WebViews; polling still works in memory.
  }
}

export interface DepositModalProps {
  onClose: () => void;
  onSuccess: () => void;
  walletAddress?: string;
  chosenWager?: number;
  walletBalance?: number;
}

// USDT-only settlement: the platform credits deposits solely in USDT (1:1 USD).
// The backend rejects any other asset (see wallet.py _is_usdt_master), so the UI
// must only ever settle USDT. Users holding BTC/ETH can bridge into their OWN
// TON wallet, then use this same verified deposit path. Volatile assets and
// third-party bridge status are never credited directly.
const currenciesList = [
  { symbol: 'USDT', name: 'Tether USDT', decimals: 6, master: 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs', color: '#26A17B' },
];

function DepositModalContent({
  onClose,
  onSuccess,
  walletAddress,
  chosenWager,
  walletBalance,
}: DepositModalProps) {
  useNavbarHideWhileMounted();
  const tw = useTranslations('Wallet');
  const tc = useTranslations('Common');
  const [tonConnectUI] = useTonConnectUI();
  const wallet = useTonWallet();
  const ti = useTranslations('Index');
  const { stats, loadingStats, syncStats, walletAddress: linkedWalletAddress } = useUser();

  // A player without a TON wallet cannot use the connected-wallet tab, and most
  // newcomers have none, so they open on manual transfer. Most call sites omit the
  // walletAddress prop, so the account's linked wallet is the real signal. Decided
  // once at open: TonConnect restores its session asynchronously and tabs that
  // reorder under the player's thumb are worse than a stale default.
  const hasWallet = Boolean(walletAddress || linkedWalletAddress || wallet);
  const [tabOrder] = useState<DepositTab[]>(() =>
    hasWallet ? ['crypto', 'direct'] : ['direct', 'crypto']);
  const [activeTab, setActiveTab] = useState<DepositTab>(tabOrder[0]);
  const [showConfetti, setShowConfetti] = useState<boolean>(false);
  const [windowDimensions, setWindowDimensions] = useState<{ width: number; height: number }>({ width: 400, height: 600 });
  const [verificationSuccess, setVerificationSuccess] = useState<boolean>(false);
  
  const [depositAmount, setDepositAmount] = useState<string>(() => {
    if (chosenWager !== undefined && walletBalance !== undefined && chosenWager > walletBalance) {
      return (Math.ceil((chosenWager - walletBalance) / 0.95) / 100).toFixed(2);
    }
    return "10";
  });
  const [currency, setCurrency] = useState<'GRAM' | 'USDT' | 'USDC' | 'BTC' | 'ETH'>('USDT');
  const [tokenAmount, setTokenAmount] = useState<string>("10.00");
  const [prices, setPrices] = useState<{ [key: string]: number }>({
    TON: 5.40,
    USDT: 1.00,
    USDC: 1.00,
    BTC: 65000.00,
    ETH: 35000.00,
  });

  const [processing, setProcessing] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>(" ");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState<boolean>(false);
  const [copiedWallet, setCopiedWallet] = useState<boolean>(false);
  const [copiedMemo, setCopiedMemo] = useState<boolean>(false);
  const [memoConfirmed, setMemoConfirmed] = useState<boolean>(false);
  const [masterWallet, setMasterWallet] = useState<string>("UQD_n02bdxQxFztKTXpWBaFDxo713qIuETyefIeK7wiUB0DN");
  const [manualTxHash, setManualTxHash] = useState<string>("");

  const funnelStateRef = useRef<'opened' | 'initiated' | 'submitted' | 'completed'>('opened');
  // A card checkout opened in the browser and not yet confirmed. Seeded from
  // storage so reopening the modal resumes watching the same payment.
  const [pendingStripe, setPendingStripe] = useState<PendingStripe | null>(() => readPendingStripe());
  const stripeFinishedRef = useRef<boolean>(false);
  const stripeCheckInFlightRef = useRef<boolean>(false);
  const [gasGrantMsg, setGasGrantMsg] = useState<string>("");
  const [gasGrantBusy, setGasGrantBusy] = useState<boolean>(false);
  const [balanceTelegramId, setBalanceTelegramId] = useState<number | null>(null);
  const [balanceMemo, setBalanceMemo] = useState<string>("");

  // The memo must identify the account confirmed by the API, never client-only Telegram data.
  const tgId = Number(stats?.telegram_id || balanceTelegramId);
  const hasVerifiedAccountId = (Number.isSafeInteger(tgId) && tgId > 0) || Boolean(balanceMemo);
  const memoComment = balanceMemo || (hasVerifiedAccountId ? `ref_${tgId}` : '');

  useEffect(() => {
    logTelemetryEvent('deposit_modal_open', {
      source: chosenWager !== undefined ? 'wager_top_up' : 'wallet',
      chosen_wager: chosenWager,
      wallet_balance: walletBalance,
      default_tab: tabOrder[0],
      has_wallet: hasWallet,
    });
    // Opening the modal is a single lifecycle event. Subsequent prop changes
    // should not create duplicate funnel entries.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectTab = (tab: DepositTab) => {
    if (tab !== activeTab) logTelemetryEvent('deposit_tab_selected', { tab, from: activeTab });
    setActiveTab(tab);
    setErrorMessage("");
  };

  const trackDepositInitiated = (method: string, amount: number) => {
    funnelStateRef.current = 'initiated';
    logTelemetryEvent('deposit_initiated', { method, amount_usd: amount });
  };

  const trackDepositCompleted = (method: string, creditedAmount: number) => {
    funnelStateRef.current = 'completed';
    logTelemetryEvent('deposit_completed', {
      method,
      credited_amount_cents: creditedAmount,
    });
  };

  const closeDeposit = () => {
    if (funnelStateRef.current === 'submitted') {
      logTelemetryEvent('deposit_submitted_pending', { method: activeTab });
    } else if (funnelStateRef.current !== 'completed') {
      logTelemetryEvent('deposit_abandoned', {
        stage: funnelStateRef.current,
        method: activeTab,
      });
    }
    onClose();
  };

  // Load prices and master wallet address on mount
  useEffect(() => {
    const loadRatesAndConfig = async () => {
      try {
        const priceRes = await apiFetch("/api/v1/wallet/prices");
        if (priceRes.ok) {
          const rates = await priceRes.json();
          setPrices(rates);
        }
        const balanceRes = await apiFetch("/api/v1/wallet/balance");
        if (balanceRes.ok) {
          const data = await balanceRes.json();
          if (data.master_wallet_address) {
            setMasterWallet(data.master_wallet_address);
          }
          if (data.telegram_id) {
            setBalanceTelegramId(Number(data.telegram_id));
          }
          if (data.deposit_memo) {
            setBalanceMemo(String(data.deposit_memo));
          }
        }
      } catch (err) {
        console.error("Failed to load prices/config", err);
      }
    };
    loadRatesAndConfig();
  }, []);

  // Recalculate equivalent tokens needed based on USD amount entered (charged amount is selected + 5%)
  useEffect(() => {
    const usd = parseFloat(depositAmount);
    if (isNaN(usd) || usd <= 0) {
      setTokenAmount("0.00");
      return;
    }
    const price = prices[currency] || 1.0;
    const chargedUsd = usd;
    const tokens = chargedUsd / price;

    if (currency === 'BTC') {
      setTokenAmount(tokens.toFixed(6));
    } else {
      setTokenAmount(tokens.toFixed(4));
    }
  }, [depositAmount, currency, prices]);

  // Gas wall escape hatch: the platform sends a TON splash to wallets that
  // hold USDT but can't pay jetton-transfer gas (server-side gated).
  const handleGasGrant = async () => {
    if (gasGrantBusy) return;
    setGasGrantBusy(true);
    setGasGrantMsg("");
    try {
      const res = await apiFetch("/api/v1/wallet/gas-grant", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        telegramHaptic('success');
        setGasGrantMsg(tw('gas_sent'));
      } else {
        setGasGrantMsg(data.detail || tw('gas_unavailable'));
      }
    } catch {
      setGasGrantMsg(tw('gas_network_error'));
    } finally {
      setGasGrantBusy(false);
    }
  };

  const handleWeb3Deposit = async () => {
    if (!hasVerifiedAccountId) {
      setErrorMessage(tw('account_unavailable'));
      return;
    }
    const amt = parseFloat(depositAmount);
    if (isNaN(amt) || amt <= 0) {
      setErrorMessage(tw('invalid_amount'));
      return;
    }

    if (!wallet) {
      setErrorMessage(tw('connect_title'));
      return;
    }

    trackDepositInitiated('onchain_wallet', amt);
    setProcessing(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const selectedCurrencyObj = currenciesList.find(c => c.symbol === currency);
      if (!selectedCurrencyObj) throw new DepositFeedbackError(tw('invalid_amount'));

      const price = prices[currency] || 1.0;
      const chargedAmt = amt;
      const tokensNeeded = chargedAmt / price;
      const decimals = selectedCurrencyObj.decimals;
      const amountUnits = BigInt(Math.round(tokensNeeded * Math.pow(10, decimals)));

      if (amountUnits <= BigInt(0)) {
        throw new DepositFeedbackError(tw('invalid_amount'));
      }

      let targetAddress = masterWallet;
      let payloadBase64 = "";
      let attachedTon = "100000000"; // 0.1 GRAM gas fee attached for Jettons

      // Construct a comment cell using @ton/core
      const commentCell = beginCell()
        .storeUint(0, 32)
        .storeStringTail(memoComment)
        .endCell();

      if (currency === 'GRAM') {
        targetAddress = masterWallet;
        payloadBase64 = commentCell.toBoc().toString('base64');
        attachedTon = amountUnits.toString();
      } else {
        // Pre-check user's on-chain USDT balance to prevent submitting transfers without enough tokens
        try {
        const balRes = await apiFetch(`/api/v1/wallet/onchain-balances?user_address=${encodeURIComponent(wallet.account.address)}`);
        if (balRes.ok) {
          const balData = await balRes.json();
          const usdtUnits = balData?.usdt_units ?? 0;
          const usdtBalance = usdtUnits / 1e6;
          if (usdtBalance < tokensNeeded) {
            throw new DepositFeedbackError(tw('token_balance_low', { balance: usdtBalance.toFixed(2), required: tokensNeeded.toFixed(2) }));
          }
        }
        } catch (balErr: any) {
          if (balErr instanceof DepositFeedbackError) {
            throw balErr;
          }
          // proceed if onchain balance lookup fails transiently
        }

        // Resolve Jetton wallet address from backend with client-side fallback
        try {
        const jettonWalletRes = await apiFetch(
          `/api/v1/wallet/jetton-wallet?user_address=${encodeURIComponent(wallet.account.address)}&jetton_master=${encodeURIComponent(selectedCurrencyObj.master)}`,
        );
        if (jettonWalletRes.ok) {
          const jettonWalletData = await jettonWalletRes.json();
          targetAddress = jettonWalletData.jetton_wallet_address;
        }
        } catch (fetchErr) {
          console.warn("Backend jetton-wallet resolution failed, attempting fallback:", fetchErr);
        }

        if (!targetAddress) {
          try {
          const rawWalletAddress = Address.parse(wallet.account.address).toRawString();
          const clientRes = await fetch(
            `https://tonapi.io/v2/blockchain/accounts/${selectedCurrencyObj.master}/methods/get_wallet_address?args=${encodeURIComponent(rawWalletAddress)}`,
          );
          if (clientRes.ok) {
            const clientData = await clientRes.json();
            const resolvedAddress = clientData?.decoded?.jetton_wallet_address;
            if (resolvedAddress) {
              targetAddress = Address.parse(resolvedAddress).toString({ urlSafe: true, bounceable: true });
            }
          }
          } catch (cErr) {
            console.warn("Client fallback for jetton-wallet resolution failed:", cErr);
          }
        }

        if (!targetAddress) {
          throw new DepositFeedbackError(tw('address_lookup_failed'));
        }

        // Construct standard Jetton transfer payload
        const transferPayload = beginCell()
        .storeUint(0x0f8a7ea5, 32) // opcode
        .storeUint(0, 64) // query_id
        .storeCoins(amountUnits) // amount
        .storeAddress(Address.parse(masterWallet)) // destination
        .storeAddress(Address.parse(wallet.account.address)) // response_destination
        .storeBit(0) // custom_payload
        .storeCoins(BigInt(50000000)) // forward_ton_amount (0.05 TON)
        .storeBit(1) // forward_payload in reference
        .storeRef(commentCell)
        .endCell();

        payloadBase64 = transferPayload.toBoc().toString('base64');
      }

      // Prompt wallet signature
      const result = await tonConnectUI.sendTransaction({
        validUntil: Math.floor(Date.now() / 1000) + 300,
        messages: [
          {
            address: targetAddress,
            amount: attachedTon,
            payload: payloadBase64
          }
        ]
      });
      funnelStateRef.current = 'submitted';
      logTelemetryEvent('deposit_submitted', {
        method: 'onchain_wallet',
        amount_usd: amt,
      });

      // Parse signed BOC and calculate hash
      const cell = Cell.fromBase64(result.boc);
      const messageHash = cell.hash().toString('hex');

      setSuccessMessage(tw('verifying_transaction'));
      telegramHaptic('medium');

      // Verify on backend
      const verifyRes = await apiFetch("/api/v1/wallet/deposit/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message_hash: messageHash
        })
      });

      if (verifyRes.ok) {
        const data = await verifyRes.json();
        trackDepositCompleted('onchain_wallet', data.credited_amount);
        setSuccessMessage(tw('deposit_credited', { amount: `$${(data.credited_amount / 100).toFixed(2)}` }));
        onSuccess();
        telegramHaptic('success');
        setTimeout(() => {
          closeDeposit();
          setSuccessMessage("");
        }, 3000);
      } else {
        const _errData = await verifyRes.json().catch(() => ({}));
        
        if (verifyRes.status === 404) {
          // TonAPI might be lagging behind the blockchain.
          // Show a reassuring pending message.
          setErrorMessage("");
          setSuccessMessage(tw('pending_transaction'));
          telegramHaptic('success');
          setTimeout(() => { closeDeposit(); setSuccessMessage(""); }, 6000);
        } else {
          // A real validation error from the backend
          setSuccessMessage("");
          setErrorMessage(tw('verification_failed'));
          telegramHaptic('error');
        }
      }

    } catch (err: any) {
      console.error(err);
      setSuccessMessage("");
      let msg = err instanceof DepositFeedbackError ? err.message : tw('deposit_not_confirmed');
      const providerMessage = String(err.message || '').toLowerCase();
      if (providerMessage.includes('enough funds') || providerMessage.includes('insufficient funds')) {
        msg = tw('gas_fee_needed');
      }
      setErrorMessage(msg);
      telegramHaptic('error');
    } finally {
      setProcessing(false);
    }
  };

  const handleManualVerify = async () => {
    if (!hasVerifiedAccountId) {
      setErrorMessage(tw('account_unavailable'));
      return;
    }
    if (!manualTxHash.trim()) return;
    trackDepositInitiated('manual_transfer', parseFloat(depositAmount) || 0);
    funnelStateRef.current = 'submitted';
    logTelemetryEvent('deposit_submitted', {
      method: 'manual_transfer',
      amount_usd: parseFloat(depositAmount) || 0,
    });
    setProcessing(true);
    setErrorMessage("");
    setSuccessMessage("");
    try {
      setSuccessMessage(tw('verifying_transaction'));
      telegramHaptic('medium');

      const verifyRes = await apiFetch("/api/v1/wallet/deposit/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message_hash: manualTxHash.trim()
        })
      });

      if (verifyRes.ok) {
        const data = await verifyRes.json();
        trackDepositCompleted('manual_transfer', data.credited_amount);
        setSuccessMessage(tw('deposit_credited', { amount: `$${(data.credited_amount / 100).toFixed(2)}` }));
        onSuccess();
        telegramHaptic('success');
        setManualTxHash("");
        setTimeout(() => {
          closeDeposit();
          setSuccessMessage("");
        }, 3000);
      } else {
        const errData = await verifyRes.json().catch(() => ({}));
        setSuccessMessage("");
        if (verifyRes.status === 404) {
          setErrorMessage("");
          setSuccessMessage(tw('pending_transaction'));
          telegramHaptic('success');
          setTimeout(() => {
            closeDeposit();
            setSuccessMessage("");
          }, 6000);
        } else {
          setErrorMessage(errData?.detail || tw('verification_failed'));
          telegramHaptic('error');
        }
      }
    } catch (err: any) {
      console.error(err);
      setSuccessMessage("");
      setErrorMessage(tw('verification_failed'));
      telegramHaptic('error');
    } finally {
      setProcessing(false);
    }
  };

  // Handle window resizing for full-screen confetti
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setWindowDimensions({ width: window.innerWidth, height: window.innerHeight });
    }
  }, []);

  // Latest translator and parent callback, so the payment watchers below keep a
  // stable identity however the parent re-renders.
  const twRef = useRef(tw);
  twRef.current = tw;
  const onSuccessRef = useRef(onSuccess);
  onSuccessRef.current = onSuccess;

  // The single success path for a card payment: the return page, the polling
  // loop and the Check button all land here, once.
  const finishStripeDeposit = useCallback((creditedCents: number) => {
    if (stripeFinishedRef.current) return;
    stripeFinishedRef.current = true;
    writePendingStripe(null);
    setPendingStripe(null);
    trackDepositCompleted('stripe', creditedCents);
    setVerificationSuccess(true);
    setSuccessMessage(twRef.current('deposit_credited', { amount: `$${(creditedCents / 100).toFixed(2)}` }));
    setShowConfetti(true);
    telegramHaptic('success');
    onSuccessRef.current(); // updates user balance on parent

    // Clear the return-page query params without a reload.
    const url = new URL(window.location.href);
    if (url.searchParams.has('status') || url.searchParams.has('session_id')) {
      url.searchParams.delete('status');
      url.searchParams.delete('session_id');
      window.history.replaceState({}, '', url.pathname + url.search);
    }
  }, []);

  // One status check of a card payment. 'unknown' means the server has no such
  // payment for this player (nothing left to watch); 'error' is a failed request.
  const checkStripeSession = useCallback(async (sessionId: string): Promise<'completed' | 'pending' | 'unknown' | 'error'> => {
    try {
      const res = await apiFetch(`/api/v1/wallet/stripe/verify-session?session_id=${encodeURIComponent(sessionId)}`);
      if (res.status === 404) return 'unknown';
      if (!res.ok) return 'error';
      const data = await res.json();
      if (data.status === 'completed') {
        finishStripeDeposit(data.credited_amount);
        return 'completed';
      }
      return data.status === 'failed' ? 'unknown' : 'pending';
    } catch {
      return 'error';
    }
  }, [finishStripeDeposit]);

  // Never two checks at once, and a payment the server does not know is dropped.
  const runStripeCheck = useCallback(async (pending: PendingStripe) => {
    if (stripeCheckInFlightRef.current) return null;
    stripeCheckInFlightRef.current = true;
    try {
      const outcome = await checkStripeSession(pending.sessionId);
      if (outcome === 'unknown') {
        writePendingStripe(null);
        setPendingStripe(null);
      }
      return outcome;
    } finally {
      stripeCheckInFlightRef.current = false;
    }
  }, [checkStripeSession]);

  // Verify a payment the Stripe return page told us about (the webhook can lag
  // the redirect by a few seconds).
  const verifyStripeSession = useCallback(async (sessionId: string) => {
    setProcessing(true);
    setErrorMessage("");
    setSuccessMessage("");
    try {
      let outcome = await checkStripeSession(sessionId);
      for (let i = 0; i < 5 && outcome === 'pending'; i++) {
        await new Promise(r => setTimeout(r, 2000));
        outcome = await checkStripeSession(sessionId);
      }
      if (outcome === 'pending') setErrorMessage(twRef.current('pending_transaction'));
      else if (outcome === 'unknown' || outcome === 'error') setErrorMessage(twRef.current('verification_failed'));
    } catch (err: any) {
      console.error(err);
      setErrorMessage(twRef.current('verification_failed'));
    } finally {
      setProcessing(false);
    }
  }, [checkStripeSession]);

  // Watch a card payment that is in flight: right away (covers resuming), every
  // few seconds while the app is visible, and the moment the player returns.
  useEffect(() => {
    if (!pendingStripe || verificationSuccess) return;
    let stopped = false;
    let timer: number | undefined;
    const check = async () => {
      if (stopped) return;
      const outcome = await runStripeCheck(pendingStripe);
      if (stopped || outcome === 'completed' || outcome === 'unknown') return;
      if (Date.now() - pendingStripe.startedAt >= STRIPE_POLL_WINDOW_MS) {
        stopped = true;
        window.clearInterval(timer);
        setErrorMessage(twRef.current('pending_transaction'));
      }
    };
    const onReturn = () => {
      if (document.visibilityState === 'hidden') return;
      logTelemetryEvent('deposit_checkout_returned', { session_id: pendingStripe.sessionId });
      void check();
    };
    void check();
    timer = window.setInterval(() => { if (document.visibilityState !== 'hidden') void check(); }, STRIPE_POLL_INTERVAL_MS);
    document.addEventListener('visibilitychange', onReturn);
    window.addEventListener('focus', onReturn);
    return () => {
      stopped = true;
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onReturn);
      window.removeEventListener('focus', onReturn);
    };
  }, [pendingStripe, verificationSuccess, runStripeCheck]);

  // Check URL parameters for Stripe checkout redirections on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const status = params.get('status');
      const sessionId = params.get('session_id');
      if (status === 'success' && sessionId) {
        verifyStripeSession(sessionId);
      }
    }
  }, [verifyStripeSession]);

  const selectedCurrencyObj = currenciesList.find(c => c.symbol === currency);

  // Portaled to document.body so a transformed/filtered ancestor can never
  // scope this fixed overlay (the leaderboard-modal stacking trap).
  if (typeof document === 'undefined') return null;

  if (verificationSuccess) {
    return createPortal(
      <DepositSuccessView
        showConfetti={showConfetti}
        windowDimensions={windowDimensions}
        successMessage={successMessage}
        walletBalance={walletBalance}
        onClose={() => {
          setVerificationSuccess(false);
          setSuccessMessage("");
          closeDeposit();
        }}
      />,
      document.body
    );
  }

  return (
    <Drawer isOpen title={tw('deposit_invoice')} onClose={() => { if (!processing) closeDeposit(); }} maxHeight="90dvh">
        <div className="space-y-4">
          {chosenWager !== undefined && walletBalance !== undefined && chosenWager > walletBalance && (
            <div className="w-full bg-brand-surface rounded-xl px-3.5 py-2.5 border border-brand-border flex items-center justify-between text-caption shadow-xs">
              <div className="flex items-center gap-1.5 text-brand-muted">
                <span>{tw('your_balance')}:</span>
                <span className="font-semibold text-brand-primary">${(walletBalance / 100).toFixed(2)} USDT</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-brand-muted">{tw('deficit_needed')}:</span>
                <span className="font-bold text-emerald-400">${((chosenWager - walletBalance) / 100).toFixed(2)} USDT</span>
              </div>
            </div>
          )}

          <fieldset disabled={processing} className={processing ? 'opacity-50' : ''}>
            <SegmentedControl
              aria-label={tw('top_up')}
              value={activeTab}
              options={tabOrder.map(tab => ({
                value: tab,
                label: tab === 'crypto' ? tw('tab_crypto') : tw('tab_direct'),
              }))}
              onChange={selectTab}
            />
          </fieldset>

          {activeTab === 'crypto' && !hasVerifiedAccountId && (
            loadingStats ? <Skeleton variant="rectangular" width="100%" height={120} /> : (
              <ErrorState
                title={ti('load_failed')}
                message={tw('account_unavailable')}
                onRetry={() => { void syncStats(); }}
                retryLabel={ti('retry')}
              />
            )
          )}

          {activeTab === 'crypto' && hasVerifiedAccountId && (
          <div className="space-y-4">
            <p className="text-caption font-bold text-brand-muted normal-case tracking-normal text-center">
              {tw('connected_deposit')}
            </p>

            {/* Currency Selector Dropdown */}
            <div className="flex flex-col space-y-1.5 relative">
              <label className="text-caption font-semibold text-brand-muted normal-case tracking-normal">{tw('asset')}</label>
              <button
                type="button"
                // Only interactive when more than one asset is offered. Under
                // USDT-only settlement there is a single asset, so this is a
                // static display (no dropdown).
                onClick={() => { if (!processing && currenciesList.length > 1) setShowCurrencyDropdown(!showCurrencyDropdown); }}
                className={`ui-tap-target w-full bg-brand-void border border-brand-border-opacity-20 rounded-lg py-2.5 px-3 text-sm text-brand-primary font-semibold flex items-center justify-between transition-all ${currenciesList.length > 1 ? 'cursor-pointer hover:border-brand-primary' : 'cursor-default'}`}
              >
                <div className="flex items-center space-x-2">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center text-caption font-bold bg-[#26A17B]/20">
                    <SiTether size={13} className="text-[#26A17B]" />
                  </div>
                  <span>{selectedCurrencyObj?.name} ({currency})</span>
                </div>
                {currenciesList.length > 1 && (
                  <FaAngleDown className={`text-brand-muted transition-transform ${showCurrencyDropdown ? 'rotate-180' : ''}`} />
                )}
              </button>

              <AnimatePresence>
                {showCurrencyDropdown && currenciesList.length > 1 && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute z-50 left-0 right-0 top-[60px] bg-brand-surface border border-brand-border-opacity-20 rounded-lg overflow-hidden shadow-xl"
                  >
                    {currenciesList.map((c) => (
                      <button
                        key={c.symbol}
                        type="button"
                        onClick={() => {
                          setCurrency(c.symbol as any);
                          setShowCurrencyDropdown(false);
                        }}
                        className={`ui-tap-target w-full py-2.5 px-3.5 text-left text-sm font-bold hover:bg-brand-bg-opacity-5 flex items-center justify-between cursor-pointer ${currency === c.symbol ? 'text-brand-primary bg-brand-bg-opacity-10' : 'text-brand-muted'}`}
                      >
                        <div className="flex items-center space-x-2.5">
                          <div className="w-3.5 h-3.5 rounded-full flex items-center justify-center text-caption" style={{ backgroundColor: c.color + '20', color: c.color }}>
                            <FaCoins />
                          </div>
                          <span>{c.name}</span>
                        </div>
                        <span className="text-caption text-brand-muted">{c.symbol}</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Deposit Amount in USD */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col space-y-1.5">
                <label className="text-caption font-semibold text-brand-muted normal-case tracking-normal">{tw('amount_usd')}</label>
                <div className="relative">
                  <span className="absolute left-3 top-3.5 text-brand-muted text-caption font-semibold font-mono">$</span>
                  <input
                    type="number"
                    value={depositAmount}
                    disabled={processing}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    className="w-full bg-brand-void border border-brand-border-opacity-20 rounded-lg py-2.5 pl-7 pr-3 text-[16px] text-brand-primary font-semibold focus:outline-none focus:border-brand-primary"
                    placeholder="10.00"
                    min="1"
                  />
                </div>
              </div>

              {/* Converted Token Amount */}
              <div className="flex flex-col space-y-1.5">
                <label className="text-caption font-semibold text-brand-muted normal-case tracking-normal">{tw('equivalent', { currency })}</label>
                <div className="w-full bg-brand-void/50 border border-brand-border-opacity-10 rounded-lg py-2.5 px-3 text-sm text-brand-primary font-semibold flex items-center space-x-1 shadow-inner h-[40px]">
                  <span className="truncate">{tokenAmount}</span>
                  <span className="text-caption text-brand-muted shrink-0">{currency}</span>
                </div>
              </div>
            </div>

            {/* Fee Breakdown Display */}
            {!isNaN(parseFloat(depositAmount)) && parseFloat(depositAmount) > 0 && (
              <div className="p-3 rounded-lg bg-brand-void border border-brand-border-opacity-10 space-y-1 text-caption font-bold normal-case tracking-normal text-brand-muted">
                <div className="flex justify-between">
                  <span>{tw('credited_balance')}</span>
                  <span className="text-emerald-400 font-mono">${(parseFloat(depositAmount) * 0.95).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>{tw('platform_fee')} (5%)</span>
                  <span className="text-rose-400 font-mono">${(parseFloat(depositAmount) * 0.05).toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t border-brand-border-opacity-10 pt-1 font-semibold text-brand-primary">
                  <span>{tw('total_charged')}</span>
                  <span className="font-mono">${parseFloat(depositAmount).toFixed(2)}</span>
                </div>
              </div>
            )}

            {/* Web3 CTA Action */}
            {!wallet ? (
              <button
                type="button"
                onClick={() => tonConnectUI.openModal()}
                className="ui-tap-target w-full py-3 rounded-xl border border-emerald-500/20 bg-emerald-500 text-brand-void text-caption font-semibold normal-case tracking-normal shadow-premium hover:brightness-110 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <FaWallet size={11} />
                <span>{walletAddress ? tw('reconnect') : tw('connect_to_deposit')}</span>
              </button>
            ) : (
              <button type="button"
                onClick={handleWeb3Deposit}
                disabled={processing}
                className="ui-tap-target w-full py-3 rounded-xl border border-emerald-500/20 bg-emerald-500 text-brand-void text-caption font-semibold normal-case tracking-normal shadow-premium hover:brightness-110 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {processing ? (
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-brand-void border-t-transparent animate-spin" />
                ) : (
                  <FaWallet size={11} />
                )}
                <span>{processing ? tw('waiting') : tw('connected_deposit_cta')}</span>
              </button>
            )}

            {/* Gas wall escape hatch */}
            {wallet && (
              <div className="flex flex-col items-center space-y-1.5">
                <button
                  type="button"
                  onClick={handleGasGrant}
                  disabled={gasGrantBusy}
                  className="ui-tap-target text-caption font-semibold text-brand-muted hover:text-brand-primary normal-case tracking-normal transition-colors cursor-pointer disabled:opacity-50"
                >
                  {gasGrantBusy ? tw('gas_requesting') : tw('gas_link')}
                </button>
                {gasGrantMsg && (
                  <p className="text-caption font-bold text-brand-muted leading-relaxed text-center px-2">{gasGrantMsg}</p>
                )}
              </div>
            )}

            {/* Switch to Direct Transfer */}
            <div className="border-t border-brand-border-opacity-10 pt-3.5 flex flex-col">
              <button
                type="button"
                onClick={() => {
                  telegramHaptic('light');
                  selectTab('direct');
                }}
                className="ui-tap-target w-full flex items-center justify-between py-1 text-caption font-semibold text-brand-muted hover:text-brand-primary normal-case tracking-normal transition-colors cursor-pointer"
              >
                <span>{tw('manual_transfer')}</span>
                <span className="text-caption text-brand-muted font-bold">→</span>
              </button>
            </div>

            {/* Commission Alert */}
            <div className="p-3.5 rounded-lg border border-brand-border-opacity-10 bg-brand-bg-opacity-5 flex flex-col items-center justify-center text-caption font-bold text-brand-muted normal-case tracking-normal">
              <span>{tw('platform_fee')} <strong className="text-brand-primary">5%</strong></span>
            </div>
          </div>
          )}

          {activeTab === 'direct' && !hasVerifiedAccountId && (
            loadingStats ? <Skeleton variant="rectangular" width="100%" height={120} /> : (
              <ErrorState
                title={ti('load_failed')}
                message={tw('account_unavailable')}
                onRetry={() => { void syncStats(); }}
                retryLabel={ti('retry')}
              />
            )
          )}

          {activeTab === 'direct' && hasVerifiedAccountId && (
            <ManualDepositSection
              masterWallet={masterWallet}
              memoComment={memoComment}
              copiedWallet={copiedWallet}
              copiedMemo={copiedMemo}
              memoConfirmed={memoConfirmed}
              manualTxHash={manualTxHash}
              processing={processing}
              onCopyWallet={() => {
                copyToClipboard(masterWallet).then((ok) => {
                  if (!ok) return;
                  setCopiedWallet(true);
                  logTelemetryEvent('deposit_address_copied', {
                    field: 'master_wallet',
                    method: 'manual_transfer',
                  });
                  telegramHaptic('light');
                  setTimeout(() => setCopiedWallet(false), 2000);
                });
              }}
              onCopyMemo={() => {
                copyToClipboard(memoComment).then((ok) => {
                  if (!ok) return;
                  setCopiedMemo(true);
                  setMemoConfirmed(true);
                  logTelemetryEvent('deposit_address_copied', {
                    field: 'memo',
                    method: 'manual_transfer',
                  });
                  telegramHaptic('medium');
                  setTimeout(() => setCopiedMemo(false), 2500);
                });
              }}
              setMemoConfirmed={setMemoConfirmed}
              setManualTxHash={setManualTxHash}
              onManualVerify={handleManualVerify}
              commentMemoText={tw('comment_memo')}
            />
          )}

          {/* Messages */}
          <div className="w-full pt-1">
            {successMessage && successMessage.trim() && <div className="p-2.5 mb-2 bg-brand-emerald-opacity-10 border border-brand-emerald-opacity-20 rounded-lg text-emerald-500 text-caption font-bold normal-case tracking-normal text-center">{successMessage}</div>}
            {errorMessage && <div className="p-2.5 mb-2 bg-brand-rose-opacity-10 border border-brand-rose-opacity-20 rounded-lg text-rose-400 text-caption font-bold normal-case tracking-normal text-center">{errorMessage}</div>}
            
            {chosenWager !== undefined && (
              <button type="button"
                onClick={closeDeposit}
                disabled={processing}
                className="ui-tap-target w-full py-2.5 mt-2 rounded-xl border border-brand-border-opacity-10 bg-brand-surface text-brand-muted text-caption font-bold normal-case tracking-normal hover:border-brand-primary transition-all cursor-pointer"
              >
                {tc('back')}
              </button>
            )}
          </div>
        </div>
    </Drawer>
  );
}

export default function DepositModal(props: DepositModalProps) {
  return <TonConnectProvider><DepositModalContent {...props} /></TonConnectProvider>;
}
