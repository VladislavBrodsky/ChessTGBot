'use client';

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaCheck, FaCopy, FaWallet, FaAngleDown, FaCoins } from "react-icons/fa";
import { useTranslations } from "next-intl";
import { apiFetch } from "@/lib/api";
import { telegramHaptic } from "@/lib/telegram";
import { useTonConnectUI, useTonWallet } from '@tonconnect/ui-react';
import { beginCell, Address, Cell } from '@ton/core';
import { useUser } from "@/context/UserContext";

interface LobbyDepositDrawerProps {
  chosenWager: number;
  walletBalance: number;
  tgUser: any;
  onClose: () => void;
  syncBalance: () => Promise<void>;
  onDepositSuccess: (newBalance: number) => void;
}

const currenciesList = [
  { symbol: 'USDT', name: 'Tether USDT', decimals: 6, master: 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs', color: '#26A17B' },
  { symbol: 'USDC', name: 'USD Coin', decimals: 6, master: 'EQB-MPwrd1G6WKNkLz_VnV6WqBDd142KMQv-g1O-8QUA3728', color: '#2775CA' },
  { symbol: 'GRAM', name: 'GRAM (TON)', decimals: 9, master: '', color: '#00C49A' },
  { symbol: 'BTC', name: 'Bitcoin (jWBTC)', decimals: 8, master: 'EQDcBkGHmC4pTf34x3Gm05XvepO5w60DNxZ-XT4I6-UGG5L5', color: '#F7931A' },
  { symbol: 'ETH', name: 'Ethereum (jETH)', decimals: 9, master: 'EQAvS52CoZckQWLNFa7_iZL3apL52yuTwa-hlgkdWkdYl7LA', color: '#627EEA' },
];

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

  const [tonConnectUI] = useTonConnectUI();
  const wallet = useTonWallet();
  const { stats } = useUser();

  const [depositAmount, setDepositAmount] = useState<string>("10.00");
  const [currency, setCurrency] = useState<'GRAM' | 'USDT' | 'USDC' | 'BTC' | 'ETH'>('USDT');
  const [tokenAmount, setTokenAmount] = useState<string>("10.00");
  const [prices, setPrices] = useState<{ [key: string]: number }>({
    TON: 5.40,
    USDT: 1.00,
    USDC: 1.00,
    BTC: 65000.00,
    ETH: 35000.00,
  });

  const [isDepositing, setIsDepositing] = useState<boolean>(false);
  const [depositSuccess, setDepositSuccess] = useState<string>(" ");
  const [depositError, setDepositError] = useState<string>("");
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState<boolean>(false);
  const [showManualFallback, setShowManualFallback] = useState<boolean>(false);
  const [copiedWallet, setCopiedWallet] = useState<boolean>(false);
  const [copiedMemo, setCopiedMemo] = useState<boolean>(false);
  const [masterWallet, setMasterWallet] = useState<string>("UQD_n02bdxQxFztKTXpWBaFDxo713qIuETyefIeK7wiUB0DN");
  const [manualTxHash, setManualTxHash] = useState<string>("");

  const tgId = tgUser?.id || stats?.telegram_id || 1029384;
  const memoComment = `ref_${tgId}`;

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
    }, 5000);
    return () => clearInterval(pollInterval);
  }, [syncBalance]);

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
        console.error("Failed to load prices/config in Lobby", err);
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
      setDepositError(tw('invalid_amount'));
      return;
    }

    if (!wallet) {
      setDepositError("Please connect your Web3 wallet first.");
      return;
    }

    setIsDepositing(true);
    setDepositError("");
    setDepositSuccess("");

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
      let attachedTon = "100000000"; // 0.1 TON gas fee attached for Jettons

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

      setDepositSuccess("Transaction signed. Verifying on the blockchain...");
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
        setDepositSuccess(tw('deposit_success_sim', {
          amount: `$${amt.toFixed(2)}`,
          credited: `$${(data.credited_amount / 100).toFixed(2)}`
        }));
        onDepositSuccess(data.new_balance);
        telegramHaptic('success');
        setTimeout(() => {
          onClose();
          setDepositSuccess("");
        }, 2500);
      } else {
        const errData = await verifyRes.json();
        setDepositSuccess("");
        setDepositError(errData.detail || "Transaction verification failed. Please check your transaction.");
      }

    } catch (err: any) {
      console.error(err);
      setDepositSuccess("");
      let msg = err.message || "Transaction cancelled or failed.";
      if (msg.toLowerCase().includes("enough funds") || msg.toLowerCase().includes("insufficient funds")) {
        msg = "Insufficient Gas: To complete this deposit, your wallet needs a tiny amount of native TON (or GRAM) to pay blockchain network gas fees. Alternatively, use the 'Pay Manually' option below.";
      }
      setDepositError(msg);
      telegramHaptic('error');
    } finally {
      setIsDepositing(false);
    }
  };

  const handleManualVerify = async () => {
    if (!manualTxHash.trim()) return;
    setIsDepositing(true);
    setDepositError("");
    setDepositSuccess("");
    try {
      setDepositSuccess("Verifying transaction on the blockchain...");
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
        setDepositSuccess(`Top-Up Confirmed! +$${(data.credited_amount / 100).toFixed(2)} USDT credited.`);
        onDepositSuccess(data.new_balance);
        telegramHaptic('success');
        setManualTxHash("");
        setTimeout(() => {
          onClose();
          setDepositSuccess("");
        }, 2500);
      } else {
        const errData = await verifyRes.json();
        setDepositSuccess("");
        setDepositError(errData.detail || "Transaction verification failed. Please check your transaction.");
      }
    } catch (err: any) {
      console.error(err);
      setDepositSuccess("");
      setDepositError(err.message || "Verification failed. Please check connection.");
      telegramHaptic('error');
    } finally {
      setIsDepositing(false);
    }
  };

  const selectedCurrencyObj = currenciesList.find(c => c.symbol === currency);

  return (
    <div className="bottom-drawer-backdrop z-[100]">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }} 
        onClick={() => { if (!isDepositing) onClose(); }}
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

        <div className="space-y-4 w-full">
          <p className="text-[10px] font-bold text-brand-primary opacity-60 uppercase tracking-wider text-center">
            Deposit instantly using your connected Web3 wallet.
          </p>

          {/* Currency Selector Dropdown */}
          <div className="flex flex-col space-y-1.5 relative">
            <label className="text-[9px] font-black text-brand-primary opacity-40 uppercase tracking-widest">Select Asset</label>
            <button
              type="button"
              onClick={() => { if (!isDepositing) setShowCurrencyDropdown(!showCurrencyDropdown); }}
              className="w-full bg-brand-void border border-brand-border-opacity-20 rounded-lg py-2.5 px-3 text-xs text-brand-primary font-black flex items-center justify-between cursor-pointer hover:border-brand-primary transition-all"
            >
              <div className="flex items-center space-x-2">
                <div className="w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] font-bold" style={{ backgroundColor: selectedCurrencyObj?.color + '20', color: selectedCurrencyObj?.color }}>
                  <FaCoins />
                </div>
                <span>{selectedCurrencyObj?.name} ({currency})</span>
              </div>
              <FaAngleDown className={`text-brand-primary opacity-40 transition-transform ${showCurrencyDropdown ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {showCurrencyDropdown && (
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
                  disabled={isDepositing}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="w-full bg-brand-void border border-brand-border-opacity-20 rounded-lg py-2.5 pl-7 pr-3 text-xs text-brand-primary font-black focus:outline-none focus:border-brand-primary"
                  placeholder="10.00"
                  min="0.01"
                  step="0.01"
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
            <div className="p-3 rounded-lg bg-brand-void border border-brand-border-opacity-10 space-y-1 text-[10px] font-bold uppercase tracking-wider text-brand-primary/60 mb-3.5">
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
              disabled={isDepositing}
              className="w-full py-3 rounded-xl border border-brand-border-opacity-20 bg-brand-primary text-brand-void text-[11px] font-black uppercase tracking-widest shadow-lg hover:bg-brand-primary-hover transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {isDepositing ? (
                <div className="w-3.5 h-3.5 rounded-full border-2 border-brand-void border-t-transparent animate-spin" />
              ) : (
                <FaWallet size={11} />
              )}
              <span>{isDepositing ? "Waiting..." : `Top Up via Connected Wallet`}</span>
            </button>
          )}

          {/* Direct manual transfer fallback */}
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
                    <div className="w-5 h-5 flex items-center justify-center shrink-0 ml-2">
                      {copiedWallet ? (
                        <FaCheck className="text-emerald-400 animate-pulse" />
                      ) : (
                        <FaCopy className="text-brand-primary opacity-40" />
                      )}
                    </div>
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
                    <div className="w-5 h-5 flex items-center justify-center shrink-0 ml-2">
                      {copiedMemo ? (
                        <FaCheck className="text-emerald-400 animate-pulse" />
                      ) : (
                        <FaCopy className="text-emerald-500 opacity-60" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Manual Hash Verification Form */}
                <div className="flex flex-col space-y-1.5 pt-2 border-t border-brand-border-opacity-10 mt-2">
                  <label className="text-[8px] font-black text-brand-primary opacity-40 uppercase tracking-widest">
                    Already paid? Paste transaction hash / event ID to verify:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={manualTxHash}
                      disabled={isDepositing}
                      onChange={(e) => setManualTxHash(e.target.value)}
                      placeholder="e.g. 0:abcd... or msg_hash..."
                      className="flex-1 bg-brand-void border border-brand-border-opacity-20 rounded-lg py-2 px-3 text-[10px] text-brand-primary font-mono focus:outline-none focus:border-brand-primary h-[34px]"
                    />
                    <button
                      type="button"
                      disabled={isDepositing || !manualTxHash.trim()}
                      onClick={handleManualVerify}
                      className="px-3 rounded-lg bg-brand-bg-opacity-10 border border-brand-border-opacity-20 text-[9px] font-black text-brand-primary hover:bg-brand-bg-opacity-20 transition-all uppercase tracking-wider disabled:opacity-40 disabled:cursor-not-allowed shrink-0 h-[34px]"
                    >
                      {isDepositing ? "Checking..." : "Verify"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Commission Alert */}
        <div className="p-3 rounded-lg border border-brand-border-opacity-10 bg-brand-bg-opacity-5 flex flex-col items-center justify-center text-[10px] font-bold text-brand-primary opacity-80 uppercase tracking-wider w-full mt-2">
          <span>{tw('platform_fee')} <strong className="text-brand-primary">5%</strong></span>
        </div>

        {/* Messages */}
        <div className="w-full pt-2">
          {depositSuccess && depositSuccess.trim() && <div className="p-2.5 mb-2 bg-brand-emerald-opacity-10 border border-brand-emerald-opacity-20 rounded-lg text-emerald-500 text-[10px] font-bold uppercase tracking-wider text-center">{depositSuccess}</div>}
          {depositError && <div className="p-2.5 mb-2 bg-brand-rose-opacity-10 border border-brand-rose-opacity-20 rounded-lg text-rose-400 text-[10px] font-bold uppercase tracking-wider text-center">{depositError}</div>}
          
          <button
            onClick={onClose}
            disabled={isDepositing}
            className="w-full py-2.5 mt-2 rounded-xl border border-brand-border-opacity-10 bg-brand-surface text-brand-primary/70 text-[10px] font-bold uppercase tracking-widest hover:border-brand-primary transition-all cursor-pointer"
          >
            {t('back')}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
