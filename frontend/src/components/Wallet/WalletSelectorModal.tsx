'use client';

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FaTimes, FaCheck, FaCopy } from "react-icons/fa";
import { useTonConnectUI, useTonWallet } from "@tonconnect/ui-react";
import { apiFetch } from "@/lib/api";
import { copyToClipboard } from "@/lib/clipboard";

interface WalletSelectorModalProps {
  onClose: () => void;
  onConnected?: () => void;
  tw: any;
}

/**
 * TON Connect compatible wallets — all transact in GRAM (the TON native coin).
 * Ordered: Gram Wallet first (GRAM native), then Telegram Wallet, Tonkeeper, MyTonWallet.
 */
const WALLETS = [
  {
    app_name: "gramwallet",
    name: "Gram Wallet",
    subtitle: "gramwallet.io · Official GRAM wallet",
    color: "#00C49A",
    featured: true,
    badge: "GRAM",
    // Use the official CDN icon
    iconUrl: "https://static.gramwallet.io/gramwallet/icon-288.png",
  },
  {
    app_name: "telegram-wallet",
    name: "Wallet",
    subtitle: "by Telegram · Built-in",
    color: "#2AABEE",
    featured: false,
    badge: null,
    iconUrl: "https://wallet.tg/images/logo-288.png",
  },
  {
    app_name: "tonkeeper",
    name: "Tonkeeper",
    subtitle: "tonkeeper.com",
    color: "#45AEF5",
    featured: false,
    badge: null,
    iconUrl: "https://tonkeeper.com/assets/tonconnect-icon.png",
  },
  {
    app_name: "mytonwallet",
    name: "My Wallet",
    subtitle: "mytonwallet.io",
    color: "#7B61FF",
    featured: false,
    badge: null,
    iconUrl: "https://static.mywallet.io/mywallet/icon-288.png",
  },
];

export default function WalletSelectorModal({
  onClose,
  onConnected,
  tw,
}: WalletSelectorModalProps) {
  const [tonConnectUI] = useTonConnectUI();
  const wallet = useTonWallet();
  const [connecting, setConnecting] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [canClose, setCanClose] = useState(false);

  // Cooldown to prevent double-clicks/mouseup race conditions on desktop from closing drawer instantly on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setCanClose(true);
    }, 250);
    return () => clearTimeout(timer);
  }, []);

  // When wallet connects — sync with backend and close
  useEffect(() => {
    if (wallet) {
      let telegramId: number | null = null;
      if (typeof window !== "undefined" && (window as any).Telegram?.WebApp) {
        telegramId = (window as any).Telegram.WebApp.initDataUnsafe?.user?.id;
      }
      if (!telegramId) telegramId = 123456789; // dev fallback
      apiFetch("/api/v1/users/wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          telegram_id: telegramId,
          wallet_address: wallet.account.address,
        }),
      }).catch(() => {});
      setConnecting(null);
      if (onConnected) onConnected();
    }
  }, [wallet, onConnected]);

  const handleSelectWallet = async (appName: string) => {
    setConnecting(appName);
    try {
      // Open the specific wallet modal directly
      await tonConnectUI.openSingleWalletModal(appName);
    } catch {
      // Fallback to general modal if single modal fails
      try {
        await tonConnectUI.openModal();
      } catch {
        // ignore
      }
    } finally {
      setConnecting(null);
    }
  };

  const handleDisconnect = async () => {
    await tonConnectUI.disconnect();
  };

  const getShortAddress = (addr: string) =>
    `${addr.slice(0, 6)}...${addr.slice(-6)}`;

  const copyAddress = () => {
    if (wallet?.account.address) {
      copyToClipboard(wallet.account.address).then((ok) => {
        if (!ok) return;
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  return (
    <div className="bottom-drawer-backdrop z-[100]">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => { if (canClose) onClose(); }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        style={{ touchAction: "none" }}
      />

      {/* Sheet */}
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 32, stiffness: 380 }}
        className="bottom-drawer-sheet relative z-10 overflow-hidden"
      >
        {/* Ambient glow — GRAM green */}
        <div
          className="absolute -top-20 left-1/2 -translate-x-1/2 w-72 h-36 rounded-full pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse, rgba(0,196,154,0.18) 0%, transparent 70%)",
          }}
        />

        <div className="bottom-drawer-handle" />

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-7 h-7 rounded-full flex items-center justify-center opacity-40 hover:opacity-80 transition-opacity text-brand-primary cursor-pointer"
        >
          <FaTimes size={12} />
        </button>

        <div className="px-5 pb-8 space-y-5 relative z-10">
          {/* Header */}
          <div className="text-center pt-1">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <span
                className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40 text-brand-primary"
              >
                Web3 · TON Connect
              </span>
            </div>
            <h3 className="text-[15px] font-black uppercase tracking-tight text-brand-primary">
              {wallet ? "Wallet Connected" : tw("connect_title")}
            </h3>
          </div>

          {/* ── CONNECTED STATE ── */}
          {wallet ? (
            <div className="space-y-3">
              <motion.div
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative rounded-2xl overflow-hidden p-4"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(0,196,154,0.12), rgba(0,196,154,0.03))",
                  border: "1px solid rgba(0,196,154,0.25)",
                  boxShadow: "0 4px 32px rgba(0,196,154,0.08)",
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="relative shrink-0">
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center"
                      style={{
                        background: "rgba(0,196,154,0.15)",
                        border: "1px solid rgba(0,196,154,0.3)",
                      }}
                    >
                      <FaCheck size={15} style={{ color: "#00C49A" }} />
                    </div>
                    <motion.div
                      animate={{ scale: [1, 1.6, 1], opacity: [0.7, 0, 0.7] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full"
                      style={{ background: "#00C49A" }}
                    />
                  </div>

                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="text-[10px] font-black uppercase tracking-[0.25em] opacity-40 text-brand-primary">
                      Connected · GRAM Network
                    </span>
                    <span className="text-[13px] font-black font-mono truncate text-brand-primary">
                      {getShortAddress(wallet.account.address)}
                    </span>
                  </div>

                  <button
                    onClick={copyAddress}
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all cursor-pointer"
                    style={{
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.1)",
                    }}
                  >
                    {copied ? (
                      <FaCheck size={11} style={{ color: "#00C49A" }} />
                    ) : (
                      <FaCopy
                        size={11}
                        className="text-brand-primary opacity-40"
                      />
                    )}
                  </button>
                </div>
              </motion.div>

              <button
                onClick={handleDisconnect}
                className="w-full py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer"
                style={{
                  background: "rgba(239,68,68,0.07)",
                  border: "1px solid rgba(239,68,68,0.18)",
                  color: "rgba(239,68,68,0.75)",
                }}
              >
                Disconnect Wallet
              </button>
            </div>
          ) : (
            /* ── WALLET PICKER ── */
            <div className="space-y-3">
              {/* Subtitle */}
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-35 text-center text-brand-primary">
                {tw("connect_desc")}
              </p>

              {/* Wallet list */}
              {WALLETS.map((w, idx) => (
                <motion.button
                  key={w.app_name}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.06 }}
                  onClick={() => handleSelectWallet(w.app_name)}
                  disabled={connecting !== null}
                  className="w-full relative overflow-hidden rounded-2xl flex items-center gap-4 p-3.5 transition-all cursor-pointer group"
                  style={{
                    background: w.featured
                      ? `linear-gradient(135deg, ${w.color}14, ${w.color}05)`
                      : "rgba(255,255,255,0.025)",
                    border: w.featured
                      ? `1px solid ${w.color}30`
                      : "1px solid rgba(255,255,255,0.06)",
                    boxShadow: w.featured
                      ? `0 4px 24px ${w.color}10`
                      : "none",
                  }}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {/* Icon — loaded from CDN */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={w.iconUrl}
                    alt={w.name}
                    className="w-11 h-11 rounded-xl shrink-0 shadow-md object-cover"
                    onError={(e) => {
                      // Fallback colored square
                      (e.currentTarget as HTMLImageElement).style.display = "none";
                    }}
                  />

                  {/* Info */}
                  <div className="flex flex-col items-start flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[13px] font-black uppercase tracking-wide text-brand-primary">
                        {w.name}
                      </span>
                      {w.badge && (
                        <span
                          className="text-[10px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full"
                          style={{
                            background: `${w.color}20`,
                            color: w.color,
                            border: `1px solid ${w.color}35`,
                          }}
                        >
                          {w.badge}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] font-bold opacity-35 text-brand-primary truncate w-full text-left">
                      {w.subtitle}
                    </span>
                  </div>

                  {/* Loading spinner or chevron */}
                  <div className="shrink-0 w-5 flex items-center justify-center">
                    {connecting !== null ? (
                      <div
                        className="w-3.5 h-3.5 rounded-full border-2 border-t-transparent animate-spin"
                        style={{
                          borderColor: `${w.color}50`,
                          borderTopColor: "transparent",
                        }}
                      />
                    ) : (
                      <svg
                        viewBox="0 0 6 10"
                        fill="none"
                        className="w-1.5 opacity-25 group-hover:opacity-50 transition-opacity text-brand-primary"
                      >
                        <path
                          d="M1 1L5 5L1 9"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </div>

                  {/* Featured shimmer sweep */}
                  {w.featured && (
                    <motion.div
                      animate={{ x: ["-100%", "200%"] }}
                      transition={{
                        duration: 3.5,
                        repeat: Infinity,
                        ease: "linear",
                        delay: 0.8,
                      }}
                      className="absolute inset-0 w-1/3 pointer-events-none"
                      style={{
                        background: `linear-gradient(90deg, transparent, ${w.color}14, transparent)`,
                      }}
                    />
                  )}
                </motion.button>
              ))}

              {/* TON Connect compliance footer */}
              <div className="flex items-center justify-center gap-1.5 pt-1">
                <svg
                  viewBox="0 0 16 16"
                  fill="none"
                  className="w-3 h-3"
                >
                  <rect width="16" height="16" rx="4" fill="#0098EA" />
                  <path
                    d="M8 3L12 7H9.5V13H6.5V7H4L8 3Z"
                    fill="white"
                  />
                </svg>
                <span className="text-[10px] font-bold uppercase tracking-widest opacity-25 text-brand-primary">
                  Powered by TON Connect · GRAM Blockchain
                </span>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
