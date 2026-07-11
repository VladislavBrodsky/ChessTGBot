'use client';

import { useState, useEffect, useRef } from "react";
import { toNano, Address } from "@ton/core";
import { useTonConnectUI } from "@tonconnect/ui-react";
import { apiFetch } from "@/lib/api";
import { telegramHaptic } from "@/lib/telegram";
import { useTranslations } from "next-intl";

/**
 * In-app TON → USDT swap (STON.fi), the "deposit whatever currency" unlock
 * for TON holders. The swap proceeds land in the USER'S OWN wallet — never
 * the platform's — so the only money entry point into the platform remains
 * the existing, battle-tested USDT deposit transfer. After the swap lands,
 * the parent deposit modal detects the arrived USDT and prompts the normal
 * deposit. Slippage is bounded by minAskUnits from STON.fi's own simulation.
 */

// Canonical STON.fi identifier for native TON (pTON v1 master).
const STONFI_TON_ADDRESS = "EQCM3B12QK1e4yZSf8GtBRT0aLMNyEsBc_DhVfRRtOEffLez";
const USDT_MASTER = "EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs";
const SLIPPAGE_TOLERANCE = "0.01"; // 1%
const MIN_SWAP_TON = 0.5;
const MAX_SWAP_TON = 100;
// Native TON to keep un-swapped so the user can still pay swap + deposit gas.
const GAS_HEADROOM_TON = 0.45;
const QUOTE_TTL_MS = 60_000;

interface Quote {
  askUnits: string;
  minAskUnits: string;
  priceImpact: string;
  swapRate: string;
  simulation: any; // full STON.fi simulation payload, needed to build the tx
  fetchedAt: number;
}

interface SwapToUsdtProps {
  /** Raw TonConnect account address of the connected wallet. */
  walletRawAddress: string;
  /** Called right after the swap tx is signed & sent — parent starts watching for USDT arrival. */
  onSwapSent: () => void;
}

export default function SwapToUsdt({ walletRawAddress, onSwapSent }: SwapToUsdtProps) {
  const t = useTranslations("Wallet");
  const [tonConnectUI] = useTonConnectUI();
  const [tonBalanceNano, setTonBalanceNano] = useState<bigint | null>(null);
  const [amount, setAmount] = useState<string>("1");
  const [quote, setQuote] = useState<Quote | null>(null);
  const [quoting, setQuoting] = useState(false);
  const [swapping, setSwapping] = useState(false);
  const [error, setError] = useState<string>("");
  const [sent, setSent] = useState(false);
  const [quoteNonce, setQuoteNonce] = useState(0);   // bump to force a re-quote
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // On-chain TON balance so the user knows what they can swap.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiFetch(`/api/v1/wallet/onchain-balances?user_address=${encodeURIComponent(walletRawAddress)}`);
        if (res.ok && !cancelled) {
          const data = await res.json();
          setTonBalanceNano(BigInt(data.ton_nanoton ?? 0));
        }
      } catch { /* balance display is optional */ }
    })();
    return () => { cancelled = true; };
  }, [walletRawAddress]);

  // Debounced quote via STON.fi simulation API.
  useEffect(() => {
    setQuote(null);
    setError("");
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt < MIN_SWAP_TON || amt > MAX_SWAP_TON) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setQuoting(true);
      try {
        const { StonApiClient } = await import("@ston-fi/api");
        const client = new StonApiClient();
        const simulation = await client.simulateSwap({
          offerAddress: STONFI_TON_ADDRESS,
          offerUnits: toNano(amt.toFixed(4)).toString(),
          askAddress: USDT_MASTER,
          slippageTolerance: SLIPPAGE_TOLERANCE,
          dexV2: true,
        });
        setQuote({
          askUnits: simulation.askUnits,
          minAskUnits: simulation.minAskUnits,
          priceImpact: simulation.priceImpact,
          swapRate: simulation.swapRate,
          simulation,
          fetchedAt: Date.now(),
        });
      } catch (err: any) {
        console.error("Swap quote failed", err);
        setError(t("swap_quote_failed"));
      } finally {
        setQuoting(false);
      }
    }, 600);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [amount, quoteNonce]);

  const handleSwap = async () => {
    if (!quote || swapping) return;
    if (Date.now() - quote.fetchedAt > QUOTE_TTL_MS) {
      setQuote(null);
      setError(t("swap_quote_expired"));
      setQuoteNonce(n => n + 1);   // re-runs the quote effect
      return;
    }
    const amt = parseFloat(amount);
    if (tonBalanceNano !== null && toNano((amt + GAS_HEADROOM_TON).toFixed(4)) > tonBalanceNano) {
      setError(t("swap_gas_headroom", { amount: GAS_HEADROOM_TON }));
      return;
    }

    setSwapping(true);
    setError("");
    try {
      const [{ dexFactory }, { TonClient }] = await Promise.all([
        import("@ston-fi/sdk"),
        import("@ton/ton"),
      ]);
      const sim = quote.simulation;
      const tonClient = new TonClient({ endpoint: "https://toncenter.com/api/v2/jsonRPC" });
      const dexContracts = dexFactory(sim.router) as any;
      const router = tonClient.open(dexContracts.Router.create(sim.routerAddress));
      const proxyTon = dexContracts.pTON.create(sim.router.ptonMasterAddress);

      const txParams = await (router as any).getSwapTonToJettonTxParams({
        userWalletAddress: Address.parse(walletRawAddress),
        proxyTon,
        askJettonAddress: sim.askAddress,
        offerAmount: BigInt(sim.offerUnits),
        minAskAmount: BigInt(sim.minAskUnits),
        // Provided from the simulation so the SDK can skip on-chain lookups.
        offerJettonWalletAddress: sim.router.ptonWalletAddress,
      });

      await tonConnectUI.sendTransaction({
        validUntil: Math.floor(Date.now() / 1000) + 300,
        messages: [{
          address: txParams.to.toString(),
          amount: txParams.value.toString(),
          payload: txParams.body ? txParams.body.toBoc().toString("base64") : undefined,
        }],
      });

      telegramHaptic('success');
      setSent(true);
      onSwapSent();
    } catch (err: any) {
      console.error("Swap failed", err);
      telegramHaptic('error');
      setError(err?.message?.includes("Reject") || err?.message?.includes("cancel")
        ? t("swap_cancelled")
        : t("swap_failed"));
    } finally {
      setSwapping(false);
    }
  };

  const estUsdt = quote ? (Number(quote.askUnits) / 1e6).toFixed(2) : null;
  const minUsdt = quote ? (Number(quote.minAskUnits) / 1e6).toFixed(2) : null;
  const impactPct = quote ? (Number(quote.priceImpact) * 100).toFixed(2) : null;
  const highImpact = quote ? Number(quote.priceImpact) > 0.03 : false;

  if (sent) {
    return (
      <div className="p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-[10px] font-bold text-emerald-400 leading-relaxed text-center uppercase tracking-wider">
        {t("swap_sent")}
      </div>
    );
  }

  return (
    <div className="space-y-3 p-3.5 rounded-2xl border border-brand-border-opacity-10 bg-brand-void/40">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-black uppercase tracking-widest text-brand-primary opacity-70">
          {t("swap_title")}
        </span>
        <span className="text-[10px] font-bold text-brand-primary opacity-40">
          {tonBalanceNano !== null ? t("swap_balance", { amount: (Number(tonBalanceNano) / 1e9).toFixed(2) }) : ""}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="number"
          inputMode="decimal"
          min={MIN_SWAP_TON}
          max={MAX_SWAP_TON}
          step="0.1"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          disabled={swapping}
          className="cyber-input flex-1 p-2.5 rounded-xl border border-brand-border-opacity-10 bg-brand-void text-brand-primary text-xs font-black font-mono"
          placeholder={t("swap_min_placeholder", { min: MIN_SWAP_TON })}
        />
        <span className="text-[10px] font-black uppercase text-brand-primary opacity-60 shrink-0">TON</span>
      </div>

      <div className="text-[10px] font-bold text-brand-primary opacity-60 leading-relaxed min-h-[1.5em]">
        {quoting && t("swap_quoting")}
        {!quoting && quote && (
          <>
            ≈ <span className="text-emerald-400 font-black">{estUsdt} USDT</span>
            {"  "}({t("swap_quote_min", { min: minUsdt ?? "", pct: Number(SLIPPAGE_TOLERANCE) * 100 })})
          </>
        )}
      </div>

      {highImpact && (
        <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
          ⚠️ {t("swap_high_impact", { pct: impactPct ?? "" })}
        </div>
      )}

      {error && (
        <div className="text-[10px] font-bold text-red-400 leading-relaxed">{error}</div>
      )}

      <button
        onClick={handleSwap}
        disabled={!quote || quoting || swapping}
        className={`w-full py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${
          !quote || quoting || swapping
            ? 'bg-brand-surface text-brand-primary/40 cursor-not-allowed'
            : 'bg-emerald-500 text-brand-void hover:opacity-90 active:scale-[0.98] cursor-pointer'
        }`}
      >
        {swapping ? t("swap_btn_confirming") : t("swap_btn")}
      </button>

      <p className="text-[9px] font-bold text-brand-primary opacity-35 leading-relaxed text-center">
        {t("swap_footer", { amount: GAS_HEADROOM_TON })}
      </p>
    </div>
  );
}
