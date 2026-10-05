'use client';

import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FaTimes, FaCopy, FaCheck, FaWallet, FaAngleDown, FaCoins } from "react-icons/fa";
import { apiFetch } from "@/lib/api";
import { telegramHaptic } from "@/lib/telegram";
import { copyToClipboard } from "@/lib/clipboard";
import { logTelemetryEvent } from "@/lib/telemetry";
import { useTonConnectUI, useTonWallet } from '@tonconnect/ui-react';
import { beginCell, Address, Cell } from '@ton/core';
import { useNavbarHideWhileMounted } from "@/context/NavbarContext";
import { useUser } from "@/context/UserContext";

import {
  DepositSuccessView,
  CardDepositSection,
  ManualDepositSection,
} from './deposit';

interface DepositModalProps {
  onClose: () => void;
  onSuccess: () => void;
  walletAddress?: string;
  tgUser: any;
  tw: any;
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

export default function DepositModal({
  onClose,
  onSuccess,
  walletAddress,
  tgUser,
  tw,
  chosenWager,
  walletBalance,
}: DepositModalProps) {
  useNavbarHideWhileMounted();
  const [tonConnectUI] = useTonConnectUI();
  const wallet = useTonWallet();
  const { stats } = useUser();

  const [activeTab, setActiveTab] = useState<'crypto' | 'card'>('crypto');
  const [showConfetti, setShowConfetti] = useState<boolean>(false);
  const [windowDimensions, setWindowDimensions] = useState<{ width: number; height: number }>({ width: 400, height: 600 });
  const [verificationSuccess, setVerificationSuccess] = useState<boolean>(false);
  const cardEnabled = true; // Always enable bank card tab since we use Stripe
  
  const [depositAmount, setDepositAmount] = useState<string>(() => {
    if (chosenWager !== undefined && walletBalance !== undefined && chosenWager > walletBalance) {
      return ((chosenWager - walletBalance) / 100).toFixed(2);
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
  const [showManualFallback, setShowManualFallback] = useState<boolean>(false);
  const [copiedWallet, setCopiedWallet] = useState<boolean>(false);
  const [copiedMemo, setCopiedMemo] = useState<boolean>(false);
  const [memoConfirmed, setMemoConfirmed] = useState<boolean>(false);
  const [masterWallet, setMasterWallet] = useState<string>("UQD_n02bdxQxFztKTXpWBaFDxo713qIuETyefIeK7wiUB0DN");
  const [manualTxHash, setManualTxHash] = useState<string>("");
  const [canClose, setCanClose] = useState<boolean>(false);

  const funnelStateRef = useRef<'opened' | 'initiated' | 'submitted' | 'completed'>('opened');
  const [gasGrantMsg, setGasGrantMsg] = useState<string>("");
  const [gasGrantBusy, setGasGrantBusy] = useState<boolean>(false);

  const tgId = tgUser?.id || stats?.telegram_id || 1029384;
  const memoComment = `ref_${tgId}`;

  useEffect(() => {
    logTelemetryEvent('deposit_modal_open', {
      source: chosenWager !== undefined ? 'wager_top_up' : 'wallet',
      chosen_wager: chosenWager,
      wallet_balance: walletBalance,
    });
    // Opening the modal is a single lifecycle event. Subsequent prop changes
    // should not create duplicate funnel entries.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  // Cooldown to prevent double-clicks/mouseup race conditions on desktop from closing drawer instantly on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setCanClose(true);
    }, 250);
    return () => clearTimeout(timer);
  }, []);

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
    const amt = parseFloat(depositAmount);
    if (isNaN(amt) || amt <= 0) {
      setErrorMessage(tw('invalid_amount'));
      return;
    }

    if (!wallet) {
      setErrorMessage("Please connect your Web3 wallet first.");
      return;
    }

    trackDepositInitiated('onchain_wallet', amt);
    setProcessing(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const selectedCurrencyObj = currenciesList.find(c => c.symbol === currency);
      if (!selectedCurrencyObj) throw new Error("Invalid currency selection");

      const price = prices[currency] || 1.0;
      const chargedAmt = amt;
      const tokensNeeded = chargedAmt / price;
      const decimals = selectedCurrencyObj.decimals;
      const amountUnits = BigInt(Math.round(tokensNeeded * Math.pow(10, decimals)));

      if (amountUnits <= BigInt(0)) {
        throw new Error("Amount is too small to process.");
      }

      let targetAddress = masterWallet;
      let payloadBase64 = "";
      let attachedTon = "100000000"; // 0.1 GRAM gas fee attached for Jettons

      // Construct a comment cell using @ton/core
      const commentCell = beginCell()
        .storeUint(0, 32)
        .storeStringTail(`ref_${tgId}`)
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
            throw new Error(`Insufficient USDT balance in your wallet. You have ${usdtBalance.toFixed(2)} USDT, but ${tokensNeeded.toFixed(2)} USDT is required for this deposit. Please add USDT or swap TON to USDT.`);
          }
        }
        } catch (balErr: any) {
          if (balErr.message && balErr.message.includes("Insufficient USDT")) {
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
          throw new Error("Failed to resolve USDT Jetton Wallet address. Please try again or use the manual direct transfer option below.");
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

      setSuccessMessage("Transaction signed. Verifying on the blockchain...");
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
        setSuccessMessage(tw('deposit_success_sim', {
          amount: `$${amt.toFixed(2)}`,
          credited: `$${(data.credited_amount / 100).toFixed(2)}`
        }));
        onSuccess();
        telegramHaptic('success');
        setTimeout(() => {
          closeDeposit();
          setSuccessMessage("");
        }, 3000);
      } else {
        const errData = await verifyRes.json().catch(() => ({}));
        
        if (verifyRes.status === 404) {
          // TonAPI might be lagging behind the blockchain.
          // Show a reassuring pending message.
          setErrorMessage("");
          setSuccessMessage("Transaction is still pending on the blockchain. If you approved it in your wallet, it will be credited automatically within a couple of minutes.");
          telegramHaptic('success');
          setTimeout(() => { closeDeposit(); setSuccessMessage(""); }, 6000);
        } else {
          // A real validation error from the backend
          setSuccessMessage("");
          setErrorMessage(errData.detail || "Transaction verification failed.");
          telegramHaptic('error');
        }
      }

    } catch (err: any) {
      console.error(err);
      setSuccessMessage("");
      let msg = err.message || "Transaction cancelled or failed.";
      if (msg.toLowerCase().includes("enough funds") || msg.toLowerCase().includes("insufficient funds")) {
        msg = "Insufficient Gas: To complete this deposit, your wallet needs a tiny amount of native TON to pay blockchain network gas fees. Alternatively, use the 'Pay Manually' option below.";
      }
      setErrorMessage(msg);
      telegramHaptic('error');
    } finally {
      setProcessing(false);
    }
  };

  const handleManualVerify = async () => {
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
      setSuccessMessage("Verifying transaction on the blockchain...");
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
        setSuccessMessage(`Top-Up Confirmed! +$${(data.credited_amount / 100).toFixed(2)} USDT credited.`);
        onSuccess();
        telegramHaptic('success');
        setManualTxHash("");
        setTimeout(() => {
          closeDeposit();
          setSuccessMessage("");
        }, 3000);
      } else {
        const errData = await verifyRes.json();
        setSuccessMessage("");
        setErrorMessage(errData.detail || "Transaction verification failed. Please check your transaction.");
      }
    } catch (err: any) {
      console.error(err);
      setSuccessMessage("");
      setErrorMessage(err.message || "Verification failed. Please check connection.");
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

  // Poll server to verify Stripe Checkout completion
  const verifyStripeSession = useCallback(async (sessionId: string) => {
    setProcessing(true);
    setErrorMessage("");
    setSuccessMessage("");
    try {
      const res = await apiFetch(`/api/v1/wallet/stripe/verify-session?session_id=${sessionId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.status === "completed") {
          trackDepositCompleted('stripe', data.credited_amount);
          setVerificationSuccess(true);
          setSuccessMessage(`Top-Up of $${(data.credited_amount / 100).toFixed(2)} completed!`);
          setShowConfetti(true);
          telegramHaptic('success');
          onSuccess(); // updates user balance on parent
          
          // Clear query params from URL safely without page reload
          const url = new URL(window.location.href);
          url.searchParams.delete('status');
          url.searchParams.delete('session_id');
          window.history.replaceState({}, '', url.pathname + url.search);
        } else {
          // Poll for completed state since webhook can have transient latency
          let verified = false;
          for (let i = 0; i < 5; i++) {
            await new Promise(r => setTimeout(r, 2000));
            const retryRes = await apiFetch(`/api/v1/wallet/stripe/verify-session?session_id=${sessionId}`);
            if (retryRes.ok) {
              const retryData = await retryRes.json();
              if (retryData.status === "completed") {
                trackDepositCompleted('stripe', retryData.credited_amount);
                setVerificationSuccess(true);
                setSuccessMessage(`Top-Up of $${(retryData.credited_amount / 100).toFixed(2)} completed!`);
                setShowConfetti(true);
                telegramHaptic('success');
                onSuccess();
                verified = true;
                
                const url = new URL(window.location.href);
                url.searchParams.delete('status');
                url.searchParams.delete('session_id');
                window.history.replaceState({}, '', url.pathname + url.search);
                break;
              }
            }
          }
          if (!verified) {
            setErrorMessage("Payment verification is taking longer than expected. Balance will update shortly.");
          }
        }
      } else {
        setErrorMessage("Could not verify session with server.");
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage("Verification error.");
    } finally {
      setProcessing(false);
    }
  }, [onSuccess]);

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

  // Launch the Stripe Checkout redirection
  const handleCardTopUp = async () => {
    const amt = parseFloat(depositAmount);
    if (isNaN(amt) || amt < 1.0) {
      setErrorMessage("Minimum deposit amount is $1.00 USD");
      return;
    }
    trackDepositInitiated('stripe', amt);
    setProcessing(true);
    setErrorMessage("");
    setSuccessMessage("");
    telegramHaptic('medium');

    try {
      const currentPath = typeof window !== 'undefined' ? window.location.pathname : "/wallet";
      const res = await apiFetch("/api/v1/wallet/stripe/create-session", {
        method: "POST",
        body: JSON.stringify({ amount: amt, redirect_path: currentPath })
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Failed to create checkout session.");
      }
      const data = await res.json();
      funnelStateRef.current = 'submitted';
      logTelemetryEvent('deposit_submitted', {
        method: 'stripe',
        amount_usd: amt,
        session_id: data.session_id,
      });
      
      // Redirect using Telegram WebApp openLink if available
      if (typeof window !== 'undefined' && window.Telegram?.WebApp?.openLink) {
        window.Telegram.WebApp.openLink(data.checkout_url);
      } else {
        window.open(data.checkout_url, '_blank', 'noopener,noreferrer');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "Stripe top up failed. Please retry.");
      telegramHaptic('error');
    } finally {
      setProcessing(false);
    }
  };

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

  return createPortal(
    <div className="bottom-drawer-backdrop z-[100]">
       <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => { if (!processing && canClose) closeDeposit(); }}
        className="absolute inset-0 bg-[rgba(0,0,0,0.4)]" style={{ touchAction: 'none' }}
      />

      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 350 }}
        className="bottom-drawer-sheet relative z-10 pb-[calc(32px+var(--app-safe-bottom))] sm:pb-[calc(16px+var(--app-safe-bottom))]"
      >
        <div className="bottom-drawer-handle" />
        <button
          onClick={closeDeposit}
          disabled={processing}
          className="absolute top-4 right-4 text-brand-muted hover:text-brand-primary cursor-pointer"
        >
          <FaTimes />
        </button>

        <div className="space-y-4">
          <div className="flex flex-col">
            <h3 className="text-base font-black uppercase tracking-widest text-brand-primary leading-tight">{tw('deposit_invoice')}</h3>
            {chosenWager !== undefined && walletBalance !== undefined && (
              <p className="text-[10px] font-bold text-brand-muted uppercase tracking-[0.2em] mt-0.5">
                Quick Top Up & Play
              </p>
            )}
          </div>

          {chosenWager !== undefined && walletBalance !== undefined && (
            <div className="w-full bg-brand-void/50 rounded-2xl p-4 border border-brand-border-opacity-5 text-xs font-bold text-brand-muted leading-relaxed space-y-2.5 shadow-inner">
              <div className="grid grid-cols-2 gap-2 text-[10px] uppercase tracking-wider">
                <div className="text-left opacity-50">Wager Stake</div>
                <div className="text-right text-brand-primary font-black">${(chosenWager / 100).toFixed(2)} USDT</div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[10px] uppercase tracking-wider">
                <div className="text-left opacity-50">Your Balance</div>
                <div className="text-right text-brand-muted font-black">${(walletBalance / 100).toFixed(2)} USDT</div>
              </div>
              <div className="h-px bg-brand-border-opacity-5 my-0.5" />
              <div className="grid grid-cols-2 gap-2 text-[11px] uppercase tracking-widest font-black">
                <div className="text-left text-brand-muted">Deficit Needed</div>
                <div className="text-right text-brand-primary">${((chosenWager - walletBalance) / 100).toFixed(2)} USDT</div>
              </div>
            </div>
          )}

          {cardEnabled && (
            <div className="relative flex p-1 rounded-xl bg-brand-elevated border border-brand-border shadow-inner overflow-hidden">
              <div 
                className="absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-lg bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.25)] transition-all duration-300 ease-out"
                style={{ left: activeTab === 'crypto' ? '4px' : 'calc(50%)' }}
              />
              {(['crypto', 'card'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  disabled={processing}
                  onClick={() => { telegramHaptic('light'); setActiveTab(tab); setErrorMessage(""); }}
                  className={`relative z-10 flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors duration-300 cursor-pointer ${activeTab === tab ? 'text-brand-void' : 'text-brand-muted hover:text-brand-primary'}`}
                >
                  {tab === 'crypto' ? tw('tab_crypto') : tw('tab_card')}
                </button>
              ))}
            </div>
          )}

          {activeTab === 'crypto' && (
          <div className="space-y-4">
            <p className="text-[10px] font-bold text-brand-muted uppercase tracking-wider text-center">
              Deposit instantly using your connected Web3 wallet.
            </p>

            {/* Currency Selector Dropdown */}
            <div className="flex flex-col space-y-1.5 relative">
              <label className="text-[10px] font-black text-brand-muted uppercase tracking-widest">Asset</label>
              <button
                type="button"
                // Only interactive when more than one asset is offered. Under
                // USDT-only settlement there is a single asset, so this is a
                // static display (no dropdown).
                onClick={() => { if (!processing && currenciesList.length > 1) setShowCurrencyDropdown(!showCurrencyDropdown); }}
                className={`w-full bg-brand-void border border-brand-border-opacity-20 rounded-lg py-2.5 px-3 text-xs text-brand-primary font-black flex items-center justify-between transition-all ${currenciesList.length > 1 ? 'cursor-pointer hover:border-brand-primary' : 'cursor-default'}`}
              >
                <div className="flex items-center space-x-2">
                  <div className="w-3.5 h-3.5 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ backgroundColor: selectedCurrencyObj?.color + '20', color: selectedCurrencyObj?.color }}>
                    <FaCoins />
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
                        className={`w-full py-2.5 px-3.5 text-left text-xs font-bold hover:bg-brand-bg-opacity-5 flex items-center justify-between cursor-pointer ${currency === c.symbol ? 'text-brand-primary bg-brand-bg-opacity-10' : 'text-brand-muted'}`}
                      >
                        <div className="flex items-center space-x-2.5">
                          <div className="w-3.5 h-3.5 rounded-full flex items-center justify-center text-[10px]" style={{ backgroundColor: c.color + '20', color: c.color }}>
                            <FaCoins />
                          </div>
                          <span>{c.name}</span>
                        </div>
                        <span className="text-[10px] opacity-40">{c.symbol}</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Deposit Amount in USD */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col space-y-1.5">
                <label className="text-[10px] font-black text-brand-muted uppercase tracking-widest">Amount (USD)</label>
                <div className="relative">
                  <span className="absolute left-3 top-3.5 text-brand-muted text-[10px] font-black font-mono">$</span>
                  <input
                    type="number"
                    value={depositAmount}
                    disabled={processing}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    className="w-full bg-brand-void border border-brand-border-opacity-20 rounded-lg py-2.5 pl-7 pr-3 text-[16px] text-brand-primary font-black focus:outline-none focus:border-brand-primary"
                    placeholder="10.00"
                    min="1"
                  />
                </div>
              </div>

              {/* Converted Token Amount */}
              <div className="flex flex-col space-y-1.5">
                <label className="text-[10px] font-black text-brand-muted uppercase tracking-widest">Equivalent ({currency})</label>
                <div className="w-full bg-brand-void/50 border border-brand-border-opacity-10 rounded-lg py-2.5 px-3 text-xs text-brand-primary font-black flex items-center space-x-1 shadow-inner h-[40px]">
                  <span className="truncate">{tokenAmount}</span>
                  <span className="text-[10px] opacity-40 shrink-0">{currency}</span>
                </div>
              </div>
            </div>

            {/* Fee Breakdown Display */}
            {!isNaN(parseFloat(depositAmount)) && parseFloat(depositAmount) > 0 && (
              <div className="p-3 rounded-lg bg-brand-void border border-brand-border-opacity-10 space-y-1 text-[10px] font-bold uppercase tracking-wider text-brand-muted">
                <div className="flex justify-between">
                  <span>Credited to Balance:</span>
                  <span className="text-emerald-400 font-mono">${(parseFloat(depositAmount) * 0.95).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Platform Fee (5%):</span>
                  <span className="text-rose-400 font-mono">${(parseFloat(depositAmount) * 0.05).toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t border-brand-border-opacity-10 pt-1 font-black text-brand-primary">
                  <span>Total Charged:</span>
                  <span className="font-mono">${parseFloat(depositAmount).toFixed(2)}</span>
                </div>
              </div>
            )}

            {/* Web3 CTA Action */}
            {!wallet ? (
              <button
                type="button"
                onClick={() => tonConnectUI.openModal()}
                className="w-full py-3 rounded-xl border border-emerald-500/20 bg-emerald-500 text-brand-void text-[11px] font-black uppercase tracking-widest shadow-premium hover:brightness-110 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <FaWallet size={11} />
                <span>{walletAddress ? "Reconnect Wallet App" : "Connect Wallet to Top Up"}</span>
              </button>
            ) : (
              <button
                onClick={handleWeb3Deposit}
                disabled={processing}
                className="w-full py-3 rounded-xl border border-emerald-500/20 bg-emerald-500 text-brand-void text-[11px] font-black uppercase tracking-widest shadow-premium hover:brightness-110 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {processing ? (
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-brand-void border-t-transparent animate-spin" />
                ) : (
                  <FaWallet size={11} />
                )}
                <span>{processing ? "Waiting..." : `Top Up via Connected Wallet`}</span>
              </button>
            )}

            {/* Gas wall escape hatch */}
            {wallet && (
              <div className="flex flex-col items-center space-y-1.5">
                <button
                  type="button"
                  onClick={handleGasGrant}
                  disabled={gasGrantBusy}
                  className="text-[10px] font-black text-brand-primary/45 hover:text-brand-primary uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50"
                >
                  {gasGrantBusy ? tw('gas_requesting') : tw('gas_link')}
                </button>
                {gasGrantMsg && (
                  <p className="text-[10px] font-bold text-brand-muted leading-relaxed text-center px-2">{gasGrantMsg}</p>
                )}
              </div>
            )}

            {/* Direct manual transfer fallback */}
            <div className="border-t border-brand-border-opacity-10 pt-3.5 flex flex-col">
              <button
                type="button"
                onClick={() => { setShowManualFallback(!showManualFallback); setMemoConfirmed(false); }}
                className="w-full flex items-center justify-between py-1 text-[10px] font-black text-brand-muted hover:text-brand-primary uppercase tracking-wider transition-colors cursor-pointer"
              >
                <span>Or Pay Manually (Direct Transfer)</span>
                <span className="text-xs transition-transform duration-200" style={{ transform: showManualFallback ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
              </button>

              {showManualFallback && (
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
                  transferInstructionsText={tw('transfer_instructions', { currency, symbol: currency })}
                  commentMemoText={tw('comment_memo')}
                />
              )}
            </div>

            {/* Commission Alert */}
            <div className="p-3.5 rounded-lg border border-brand-border-opacity-10 bg-brand-bg-opacity-5 flex flex-col items-center justify-center text-[10px] font-bold text-brand-muted uppercase tracking-wider">
              <span>{tw('platform_fee')} <strong className="text-brand-primary">5%</strong></span>
            </div>
          </div>
          )}

          {activeTab === 'card' && (
            <CardDepositSection
              depositAmount={depositAmount}
              setDepositAmount={setDepositAmount}
              processing={processing}
              onCardTopUp={handleCardTopUp}
            />
          )}

          {/* Messages */}
          <div className="w-full pt-1">
            {successMessage && successMessage.trim() && <div className="p-2.5 mb-2 bg-brand-emerald-opacity-10 border border-brand-emerald-opacity-20 rounded-lg text-emerald-500 text-[10px] font-bold uppercase tracking-wider text-center">{successMessage}</div>}
            {errorMessage && <div className="p-2.5 mb-2 bg-brand-rose-opacity-10 border border-brand-rose-opacity-20 rounded-lg text-rose-400 text-[10px] font-bold uppercase tracking-wider text-center">{errorMessage}</div>}
            
            {chosenWager !== undefined && (
              <button
                onClick={closeDeposit}
                disabled={processing}
                className="w-full py-2.5 mt-2 rounded-xl border border-brand-border-opacity-10 bg-brand-surface text-brand-muted text-[10px] font-bold uppercase tracking-widest hover:border-brand-primary transition-all cursor-pointer"
              >
                Back
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>,
    document.body
  );
}
