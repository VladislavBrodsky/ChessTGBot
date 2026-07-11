'use client';

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaTimes, FaCopy, FaCheck, FaWallet, FaAngleDown, FaCoins, FaCreditCard } from "react-icons/fa";
import { apiFetch } from "@/lib/api";
import { telegramHaptic } from "@/lib/telegram";
import { copyToClipboard } from "@/lib/clipboard";
import { useTonConnectUI, useTonWallet } from '@tonconnect/ui-react';
import { beginCell, Address, Cell } from '@ton/core';
import { useNavbarHideWhileMounted } from "@/context/NavbarContext";
import { useUser } from "@/context/UserContext";

interface DepositModalProps {
  onClose: () => void;
  onSuccess: () => void;
  walletAddress?: string;
  tgUser: any;
  tw: any;
  chosenWager?: number;
  walletBalance?: number;
}

// Transak fiat on-ramp config. Card tab is only shown when an API key is provided.
// Funds are delivered to the user's OWN wallet as USDT; the platform
// balance is then credited via the on-chain deposit flow (ref_ comment + 5% fee).
const TRANSAK_API_KEY = process.env.NEXT_PUBLIC_TRANSAK_API_KEY || "";
const TRANSAK_ENVIRONMENT = (process.env.NEXT_PUBLIC_TRANSAK_ENVIRONMENT || "STAGING").toUpperCase();
const TRANSAK_MIN_USD = 15;

// USDT-only settlement: the platform credits deposits solely in USDT (1:1 USD).
// The backend rejects any other asset (see wallet.py _is_usdt_master), so the UI
// must only ever let a user deposit USDT. Users holding TON/BTC/etc. use the
// Card tab's on-ramp to acquire USDT first. Do NOT re-add other assets here
// without also re-enabling them in the backend credit paths.
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
  const cardEnabled = !!TRANSAK_API_KEY && chosenWager === undefined;

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

  const tgId = tgUser?.id || stats?.telegram_id || 1029384;
  const memoComment = `ref_${tgId}`;

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
    const chargedUsd = usd * 1.05;
    const tokens = chargedUsd / price;

    if (currency === 'BTC') {
      setTokenAmount(tokens.toFixed(6));
    } else {
      setTokenAmount(tokens.toFixed(4));
    }
  }, [depositAmount, currency, prices]);

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

    setProcessing(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const selectedCurrencyObj = currenciesList.find(c => c.symbol === currency);
      if (!selectedCurrencyObj) throw new Error("Invalid currency selection");

      const price = prices[currency] || 1.0;
      const chargedAmt = amt * 1.05;
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
        // Resolve Jetton wallet address from backend
        const jettonWalletRes = await apiFetch(`/api/v1/wallet/jetton-wallet?user_address=${wallet.account.address}&jetton_master=${selectedCurrencyObj.master}`);
        if (!jettonWalletRes.ok) {
          throw new Error("Failed to resolve Jetton Wallet address. Do you have enough gas or tokens?");
        }
        const jettonWalletData = await jettonWalletRes.json();
        targetAddress = jettonWalletData.jetton_wallet_address;

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
        setSuccessMessage(tw('deposit_success_sim', {
          amount: `$${amt.toFixed(2)}`,
          credited: `$${(data.credited_amount / 100).toFixed(2)}`
        }));
        onSuccess();
        telegramHaptic('success');
        setTimeout(() => {
          onClose();
          setSuccessMessage("");
        }, 3000);
      } else {
        // The transaction was already signed and broadcast on-chain above, so the
        // funds are on their way even though immediate verification didn't catch
        // them yet (TonAPI indexing lag). The background deposit crawler credits
        // any confirmed transfer within ~2 minutes, so show a reassuring pending
        // state instead of an alarming "verification failed".
        setErrorMessage("");
        setSuccessMessage("Deposit sent! ✅ It will be credited automatically within a couple of minutes — you can safely close this window.");
        telegramHaptic('success');
        setTimeout(() => { onClose(); setSuccessMessage(""); }, 6000);
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
        setSuccessMessage(`Top-Up Confirmed! +$${(data.credited_amount / 100).toFixed(2)} USDT credited.`);
        onSuccess();
        telegramHaptic('success');
        setManualTxHash("");
        setTimeout(() => {
          onClose();
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

  // Launch the Transak on-ramp to buy USDT-on-TON into the user's OWN connected wallet.
  // No platform balance is credited here; the user later deposits via the Crypto tab.
  const handleCardTopUp = () => {
    const amt = parseFloat(depositAmount);
    if (isNaN(amt) || amt < TRANSAK_MIN_USD) {
      setErrorMessage(tw('card_min_notice', { min: TRANSAK_MIN_USD }));
      return;
    }
    if (!wallet) {
      setErrorMessage(tw('connect_wallet_cta'));
      return;
    }
    if (!TRANSAK_API_KEY) {
      setErrorMessage("Card payments are not configured.");
      return;
    }

    // Transak expects a user-friendly (non-bounceable) TON address as destination.
    let destAddress = wallet.account.address;
    try {
      destAddress = Address.parse(wallet.account.address).toString({ urlSafe: true, bounceable: false });
    } catch { /* fall back to raw address */ }

    const base = TRANSAK_ENVIRONMENT === "PRODUCTION"
      ? "https://global.transak.com"
      : "https://global-stg.transak.com";
    const params = new URLSearchParams({
      apiKey: TRANSAK_API_KEY,
      environment: TRANSAK_ENVIRONMENT,
      productsAvailed: "BUY",
      cryptoCurrencyList: "USDT",
      defaultCryptoCurrency: "USDT",
      network: "ton",
      walletAddress: destAddress,
      disableWalletAddressForm: "true",
      defaultFiatAmount: String(Math.floor(amt)),
      fiatCurrency: "USD",
    });
    const url = `${base}/?${params.toString()}`;

    setErrorMessage("");
    telegramHaptic('medium');
    try {
      if (typeof window !== 'undefined' && window.Telegram?.WebApp?.openLink) {
        window.Telegram.WebApp.openLink(url);
      } else {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    } catch {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const selectedCurrencyObj = currenciesList.find(c => c.symbol === currency);

  return (
    <div className="bottom-drawer-backdrop z-[100]">
       <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => { if (!processing && canClose) onClose(); }}
        className="absolute inset-0 bg-[rgba(0,0,0,0.4)]" style={{ touchAction: 'none' }}
      />

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
          className="absolute top-4 right-4 text-brand-primary opacity-40 hover:text-brand-primary cursor-pointer"
        >
          <FaTimes />
        </button>

        <div className="space-y-4">
          <div className="flex flex-col">
            <h3 className="text-base font-black uppercase tracking-widest text-brand-primary leading-tight">{tw('deposit_invoice')}</h3>
            {chosenWager !== undefined && walletBalance !== undefined && (
              <p className="text-[10px] font-bold text-brand-primary opacity-60 uppercase tracking-[0.2em] mt-0.5">
                Quick Top Up & Play
              </p>
            )}
          </div>

          {chosenWager !== undefined && walletBalance !== undefined && (
            <div className="w-full bg-brand-void/50 rounded-2xl p-4 border border-brand-border-opacity-5 text-xs font-bold text-brand-primary/80 leading-relaxed space-y-2.5 shadow-inner">
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
          )}

          {cardEnabled && (
            <div className="flex p-1 rounded-xl bg-brand-void border border-brand-border-opacity-10 gap-1">
              {(['crypto', 'card'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  disabled={processing}
                  onClick={() => { setActiveTab(tab); setErrorMessage(""); }}
                  className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${activeTab === tab ? 'bg-brand-primary text-brand-void shadow-lg' : 'text-brand-primary/50 hover:text-brand-primary'}`}
                >
                  {tab === 'crypto' ? tw('tab_crypto') : tw('tab_card')}
                </button>
              ))}
            </div>
          )}

          {activeTab === 'crypto' && (
          <div className="space-y-4">
            <p className="text-[10px] font-bold text-brand-primary opacity-60 uppercase tracking-wider text-center">
              Deposit instantly using your connected Web3 wallet.
            </p>

            {/* Currency Selector Dropdown */}
            <div className="flex flex-col space-y-1.5 relative">
              <label className="text-[9px] font-black text-brand-primary opacity-40 uppercase tracking-widest">Asset</label>
              <button
                type="button"
                // Only interactive when more than one asset is offered. Under
                // USDT-only settlement there is a single asset, so this is a
                // static display (no dropdown).
                onClick={() => { if (!processing && currenciesList.length > 1) setShowCurrencyDropdown(!showCurrencyDropdown); }}
                className={`w-full bg-brand-void border border-brand-border-opacity-20 rounded-lg py-2.5 px-3 text-xs text-brand-primary font-black flex items-center justify-between transition-all ${currenciesList.length > 1 ? 'cursor-pointer hover:border-brand-primary' : 'cursor-default'}`}
              >
                <div className="flex items-center space-x-2">
                  <div className="w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] font-bold" style={{ backgroundColor: selectedCurrencyObj?.color + '20', color: selectedCurrencyObj?.color }}>
                    <FaCoins />
                  </div>
                  <span>{selectedCurrencyObj?.name} ({currency})</span>
                </div>
                {currenciesList.length > 1 && (
                  <FaAngleDown className={`text-brand-primary opacity-40 transition-transform ${showCurrencyDropdown ? 'rotate-180' : ''}`} />
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
                        className={`w-full py-2.5 px-3.5 text-left text-xs font-bold hover:bg-brand-bg-opacity-5 flex items-center justify-between cursor-pointer ${currency === c.symbol ? 'text-brand-primary bg-brand-bg-opacity-10' : 'text-brand-primary/60'}`}
                      >
                        <div className="flex items-center space-x-2.5">
                          <div className="w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px]" style={{ backgroundColor: c.color + '20', color: c.color }}>
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
                <label className="text-[9px] font-black text-brand-primary opacity-40 uppercase tracking-widest">Amount (USD)</label>
                <div className="relative">
                  <span className="absolute left-3 top-3.5 text-brand-primary opacity-40 text-[10px] font-black font-mono">$</span>
                  <input
                    type="number"
                    value={depositAmount}
                    disabled={processing}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    className="w-full bg-brand-void border border-brand-border-opacity-20 rounded-lg py-2.5 pl-7 pr-3 text-xs text-brand-primary font-black focus:outline-none focus:border-brand-primary"
                    placeholder="10.00"
                    min="1"
                  />
                </div>
              </div>

              {/* Converted Token Amount */}
              <div className="flex flex-col space-y-1.5">
                <label className="text-[9px] font-black text-brand-primary opacity-40 uppercase tracking-widest">Equivalent ({currency})</label>
                <div className="w-full bg-brand-void/50 border border-brand-border-opacity-10 rounded-lg py-2.5 px-3 text-xs text-brand-primary font-black flex items-center space-x-1 shadow-inner h-[40px]">
                  <span className="truncate">{tokenAmount}</span>
                  <span className="text-[9px] opacity-40 shrink-0">{currency}</span>
                </div>
              </div>
            </div>

            {/* Fee Breakdown Display */}
            {!isNaN(parseFloat(depositAmount)) && parseFloat(depositAmount) > 0 && (
              <div className="p-3 rounded-lg bg-brand-void border border-brand-border-opacity-10 space-y-1 text-[10px] font-bold uppercase tracking-wider text-brand-primary/60">
                <div className="flex justify-between">
                  <span>Credited to Balance:</span>
                  <span className="text-emerald-400 font-mono">${parseFloat(depositAmount).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Platform Fee (5%):</span>
                  <span className="text-rose-400 font-mono">${(parseFloat(depositAmount) * 0.05).toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t border-brand-border-opacity-10 pt-1 font-black text-brand-primary">
                  <span>Total Charged:</span>
                  <span className="font-mono">${(parseFloat(depositAmount) * 1.05).toFixed(2)}</span>
                </div>
              </div>
            )}

            {/* Web3 CTA Action */}
            {!wallet ? (
              <button
                type="button"
                onClick={() => tonConnectUI.openModal()}
                className="w-full py-3 rounded-xl border border-brand-border-opacity-20 bg-brand-primary text-brand-void text-[11px] font-black uppercase tracking-widest shadow-lg hover:bg-brand-primary-hover transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <FaWallet size={11} />
                <span>Connect Wallet to Top Up</span>
              </button>
            ) : (
              <button
                onClick={handleWeb3Deposit}
                disabled={processing}
                className="w-full py-3 rounded-xl border border-brand-border-opacity-20 bg-brand-primary text-brand-void text-[11px] font-black uppercase tracking-widest shadow-lg hover:bg-brand-primary-hover transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {processing ? (
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-brand-void border-t-transparent animate-spin" />
                ) : (
                  <FaWallet size={11} />
                )}
                <span>{processing ? "Waiting..." : `Top Up via Connected Wallet`}</span>
              </button>
            )}

            {/* Direct manual transfer fallback */}
            <div className="border-t border-brand-border-opacity-10 pt-3.5 flex flex-col">
              <button
                type="button"
                onClick={() => { setShowManualFallback(!showManualFallback); setMemoConfirmed(false); }}
                className="w-full flex items-center justify-between py-1 text-[10px] font-black text-brand-primary/60 hover:text-brand-primary uppercase tracking-wider transition-colors cursor-pointer"
              >
                <span>Or Pay Manually (Direct Transfer)</span>
                <span className="text-xs transition-transform duration-200" style={{ transform: showManualFallback ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
              </button>

              {showManualFallback && (
                <div className="space-y-3 pt-3">

                  {/* ── Critical memo warning banner ── */}
                  <div className="p-3.5 rounded-xl border-2 border-rose-500/60 bg-rose-500/10 flex flex-col gap-2 animate-pulse-slow">
                    <div className="flex items-start gap-2">
                      <span className="text-rose-400 text-base leading-none shrink-0 mt-0.5">🚨</span>
                      <p className="text-[10px] font-black text-rose-300 uppercase tracking-wider leading-snug">
                        YOU MUST INCLUDE THE MEMO COMMENT BELOW IN YOUR TRANSFER.
                      </p>
                    </div>
                    <p className="text-[9px] font-bold text-rose-300/70 leading-snug pl-6">
                      Transfers sent WITHOUT the exact comment <span className="font-black text-rose-300">({memoComment})</span> cannot be attributed to your account and will be permanently lost. No refunds are possible.
                    </p>
                  </div>

                  {/* ── Step 1: Copy destination address ── */}
                  <div className="flex flex-col space-y-1">
                    <label className="text-[8px] font-black text-brand-primary opacity-40 uppercase tracking-widest">
                      Step 1 — {tw('destination')}
                    </label>
                    <div
                      className="cyber-input w-full p-2.5 rounded-xl border border-brand-border-opacity-10 bg-brand-void text-brand-primary text-[10px] font-bold font-mono truncate flex justify-between items-center cursor-pointer hover:border-brand-primary transition-all"
                      onClick={() => {
                        copyToClipboard(masterWallet).then((ok) => {
                          if (!ok) return;
                          setCopiedWallet(true);
                          telegramHaptic('light');
                          setTimeout(() => setCopiedWallet(false), 2000);
                        });
                      }}
                    >
                      <span className="truncate">{masterWallet}</span>
                      <div className="w-5 h-5 flex items-center justify-center shrink-0 ml-2">
                        {copiedWallet ? (
                          <FaCheck className="text-emerald-400 animate-pulse" />
                        ) : (
                          <FaCopy className="text-brand-primary opacity-40" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* ── Step 2: Copy memo comment — highlighted ── */}
                  <div className="flex flex-col space-y-1">
                    <label className="text-[8px] font-black text-rose-400 uppercase tracking-widest">
                      Step 2 — {tw('comment_memo')} &nbsp;<span className="text-rose-500">★ REQUIRED ★</span>
                    </label>
                    <div
                      className="cyber-input w-full p-3 rounded-xl border-2 border-rose-500/50 bg-rose-500/5 text-rose-300 text-[11px] font-black font-mono flex justify-between items-center cursor-pointer hover:border-rose-400 transition-all shadow-[0_0_12px_rgba(244,63,94,0.15)]"
                      onClick={() => {
                        copyToClipboard(memoComment).then((ok) => {
                          if (!ok) return;
                          setCopiedMemo(true);
                          setMemoConfirmed(true);
                          telegramHaptic('medium');
                          setTimeout(() => setCopiedMemo(false), 2500);
                        });
                      }}
                    >
                      <span className="tracking-widest">{memoComment}</span>
                      <div className="flex items-center gap-1.5 shrink-0 ml-2">
                        {copiedMemo ? (
                          <><FaCheck className="text-emerald-400 animate-pulse" /><span className="text-[8px] font-black text-emerald-400 uppercase tracking-wider">Copied!</span></>
                        ) : (
                          <><FaCopy className="text-rose-400 opacity-70" /><span className="text-[8px] font-black text-rose-400/70 uppercase tracking-wider">Tap to copy</span></>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* ── Step 3: Memo confirmation checkbox ── */}
                  <label className="flex items-start gap-2.5 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={memoConfirmed}
                      onChange={(e) => setMemoConfirmed(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded accent-emerald-500 cursor-pointer shrink-0"
                    />
                    <span className="text-[10px] font-bold text-brand-primary/70 group-hover:text-brand-primary leading-snug transition-colors">
                      I have copied the exact memo comment <span className="font-black text-brand-primary">({memoComment})</span> and will include it in my transfer.
                    </span>
                  </label>

                  {/* ── Step 4: Verify hash — only enabled after checkbox ── */}
                  <div className={`flex flex-col space-y-1.5 pt-2 border-t border-brand-border-opacity-10 mt-1 transition-opacity ${memoConfirmed ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                    <label className="text-[8px] font-black text-brand-primary opacity-40 uppercase tracking-widest">
                      Step 3 — Already paid? Paste transaction hash / event ID to verify:
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={manualTxHash}
                        disabled={processing || !memoConfirmed}
                        onChange={(e) => setManualTxHash(e.target.value)}
                        placeholder="e.g. 0:abcd... or msg_hash..."
                        className="flex-1 bg-brand-void border border-brand-border-opacity-20 rounded-lg py-2 px-3 text-[10px] text-brand-primary font-mono focus:outline-none focus:border-brand-primary h-[34px]"
                      />
                      <button
                        type="button"
                        disabled={processing || !manualTxHash.trim() || !memoConfirmed}
                        onClick={handleManualVerify}
                        className="px-3 rounded-lg bg-brand-bg-opacity-10 border border-brand-border-opacity-20 text-[9px] font-black text-brand-primary hover:bg-brand-bg-opacity-20 transition-all uppercase tracking-wider disabled:opacity-40 disabled:cursor-not-allowed shrink-0 h-[34px]"
                      >
                        {processing ? "Checking..." : "Verify"}
                      </button>
                    </div>
                  </div>

                </div>
              )}
            </div>

            {/* Commission Alert */}
            <div className="p-3.5 rounded-lg border border-brand-border-opacity-10 bg-brand-bg-opacity-5 flex flex-col items-center justify-center text-[10px] font-bold text-brand-primary opacity-80 uppercase tracking-wider">
              <span>{tw('platform_fee')} <strong className="text-brand-primary">5%</strong></span>
            </div>
          </div>
          )}

          {activeTab === 'card' && (
          <div className="space-y-4">
            <p className="text-[10px] font-bold text-brand-primary opacity-60 uppercase tracking-wider text-center">
              {tw('card_desc')}
            </p>

            {/* Amount (USD) */}
            <div className="flex flex-col space-y-1.5">
              <label className="text-[9px] font-black text-brand-primary opacity-40 uppercase tracking-widest">Amount (USD)</label>
              <div className="relative">
                <span className="absolute left-3 top-3.5 text-brand-primary opacity-40 text-[10px] font-black font-mono">$</span>
                <input
                  type="number"
                  value={depositAmount}
                  disabled={processing}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="w-full bg-brand-void border border-brand-border-opacity-20 rounded-lg py-2.5 pl-7 pr-3 text-xs text-brand-primary font-black focus:outline-none focus:border-brand-primary"
                  placeholder={`${TRANSAK_MIN_USD}.00`}
                  min={TRANSAK_MIN_USD}
                />
              </div>
              <span className="text-[9px] font-bold text-brand-primary/40 uppercase tracking-wider">{tw('card_min_notice', { min: TRANSAK_MIN_USD })}</span>
            </div>

            {/* Destination + CTA */}
            {!wallet ? (
              <button
                type="button"
                onClick={() => tonConnectUI.openModal()}
                className="w-full py-3 rounded-xl border border-brand-border-opacity-20 bg-brand-primary text-brand-void text-[11px] font-black uppercase tracking-widest shadow-lg hover:bg-brand-primary-hover transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <FaWallet size={11} />
                <span>{tw('connect_wallet_cta')}</span>
              </button>
            ) : (
              <>
                <div className="flex flex-col space-y-1">
                  <label className="text-[8px] font-black text-brand-primary opacity-40 uppercase tracking-widest">{tw('card_destination_label')}</label>
                  <div className="w-full p-2.5 rounded-xl border border-brand-border-opacity-10 bg-brand-void text-brand-primary text-[10px] font-bold font-mono truncate">
                    {wallet.account.address.slice(0, 6)}...{wallet.account.address.slice(-4)}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleCardTopUp}
                  className="w-full py-3 rounded-xl border border-brand-border-opacity-20 bg-brand-primary text-brand-void text-[11px] font-black uppercase tracking-widest shadow-lg hover:bg-brand-primary-hover transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <FaCreditCard size={11} />
                  <span>{tw('buy_with_card_cta')}</span>
                </button>
              </>
            )}

            <div className="p-3 rounded-xl border border-amber-500/20 bg-amber-500/5 text-[9px] font-bold text-amber-300/80 leading-normal uppercase tracking-wider text-center">
              {tw('card_await_funds_notice')}
            </div>
          </div>
          )}

          {/* Messages */}
          <div className="w-full pt-1">
            {successMessage && successMessage.trim() && <div className="p-2.5 mb-2 bg-brand-emerald-opacity-10 border border-brand-emerald-opacity-20 rounded-lg text-emerald-500 text-[10px] font-bold uppercase tracking-wider text-center">{successMessage}</div>}
            {errorMessage && <div className="p-2.5 mb-2 bg-brand-rose-opacity-10 border border-brand-rose-opacity-20 rounded-lg text-rose-400 text-[10px] font-bold uppercase tracking-wider text-center">{errorMessage}</div>}
            
            {chosenWager !== undefined && (
              <button
                onClick={onClose}
                disabled={processing}
                className="w-full py-2.5 mt-2 rounded-xl border border-brand-border-opacity-10 bg-brand-surface text-brand-primary/70 text-[10px] font-bold uppercase tracking-widest hover:border-brand-primary transition-all cursor-pointer"
              >
                Back
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

