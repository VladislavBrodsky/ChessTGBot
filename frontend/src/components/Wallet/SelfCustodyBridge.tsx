'use client';

import { useMemo, useState } from 'react';
import { Address } from '@ton/core';
import {
  FaAngleDown,
  FaBitcoin,
  FaCheck,
  FaCopy,
  FaEthereum,
  FaExternalLinkAlt,
  FaShieldAlt,
} from 'react-icons/fa';

import { copyToClipboard } from '@/lib/clipboard';
import { logTelemetryEvent } from '@/lib/telemetry';
import { telegramHaptic } from '@/lib/telegram';

interface SelfCustodyBridgeProps {
  walletRawAddress: string;
  onBridgeStarted: () => void | Promise<void>;
}

type Route = 'eth' | 'btc';

// These are intentionally fixed to the providers reviewed for this flow. Do
// not replace them with user-controlled URLs or remote configuration: a bridge
// link is a high-value phishing surface.
const STARGATE_BRIDGE_URL = 'https://stargate.finance/bridge';
const THORSWAP_BTC_TO_USDT_URL = 'https://app.thorswap.finance/swap/BTC.BTC_ETH.USDT';
const ALLOWED_EXTERNAL_HOSTS = new Set(['stargate.finance', 'app.thorswap.finance']);

function openTrustedExternal(url: string): void {
  const parsed = new URL(url);
  if (parsed.protocol !== 'https:' || !ALLOWED_EXTERNAL_HOSTS.has(parsed.hostname)) {
    throw new Error('Blocked an untrusted bridge link');
  }

  if (window.Telegram?.WebApp?.openLink) {
    window.Telegram.WebApp.openLink(parsed.toString());
    return;
  }
  window.open(parsed.toString(), '_blank', 'noopener,noreferrer');
}

export default function SelfCustodyBridge({
  walletRawAddress,
  onBridgeStarted,
}: SelfCustodyBridgeProps) {
  const [open, setOpen] = useState(false);
  const [route, setRoute] = useState<Route>('eth');
  const [copied, setCopied] = useState(false);
  const [openingBridge, setOpeningBridge] = useState(false);
  const [error, setError] = useState('');

  const tonDestination = useMemo(
    () => Address.parse(walletRawAddress).toString({ bounceable: false, urlSafe: true }),
    [walletRawAddress],
  );

  const copyDestination = async () => {
    if (!(await copyToClipboard(tonDestination))) return;
    setCopied(true);
    telegramHaptic('light');
    window.setTimeout(() => setCopied(false), 1800);
  };

  const launch = async (
    url: string,
    stage: 'btc_to_ethereum_usdt' | 'ethereum_to_ton_usdt',
    watchForArrival: boolean,
  ) => {
    if (openingBridge) return;
    setOpeningBridge(true);
    setError('');
    try {
      // Snapshot the user's current USDT balance before leaving the Mini App so
      // the parent can detect only newly bridged funds when the user returns.
      if (watchForArrival) await onBridgeStarted();
      logTelemetryEvent('self_custody_bridge_opened', {
        source_currency: route,
        stage,
        destination_network: 'ton',
      });
      openTrustedExternal(url);
      telegramHaptic('light');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not open the bridge');
      telegramHaptic('error');
    } finally {
      setOpeningBridge(false);
    }
  };

  return (
    <div className="border-t border-brand-border-opacity-10 pt-3.5">
      <button
        type="button"
        onClick={() => {
          setOpen((value) => !value);
          telegramHaptic('light');
        }}
        className="w-full flex items-center justify-between py-1 text-[10px] font-black text-brand-primary/60 hover:text-brand-primary uppercase tracking-wider transition-colors cursor-pointer"
      >
        <span className="flex items-center gap-2"><FaShieldAlt /> Bridge BTC or ETH without an exchange account</span>
        <FaAngleDown className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="pt-3 space-y-3">
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-[10px] font-bold text-brand-primary/70 leading-relaxed">
            Your assets stay under your wallet control. Bridge into your connected TON wallet first, then deposit the resulting USDT using the normal verified transfer above.
          </div>

          <div className="grid grid-cols-2 gap-2" role="group" aria-label="Source asset">
            <button
              type="button"
              onClick={() => setRoute('eth')}
              aria-pressed={route === 'eth'}
              className={`rounded-xl border p-2.5 text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-2 ${
                route === 'eth'
                  ? 'border-brand-primary/35 bg-brand-primary/10 text-brand-primary'
                  : 'border-brand-border-opacity-10 text-brand-primary/45'
              }`}
            >
              <FaEthereum /> Ethereum
            </button>
            <button
              type="button"
              onClick={() => setRoute('btc')}
              aria-pressed={route === 'btc'}
              className={`rounded-xl border p-2.5 text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-2 ${
                route === 'btc'
                  ? 'border-brand-primary/35 bg-brand-primary/10 text-brand-primary'
                  : 'border-brand-border-opacity-10 text-brand-primary/45'
              }`}
            >
              <FaBitcoin /> Bitcoin
            </button>
          </div>

          <div className="space-y-1.5">
            <span className="block text-[9px] font-black uppercase tracking-wider text-brand-primary/45">
              TON destination — your connected wallet
            </span>
            <button
              type="button"
              onClick={copyDestination}
              className="w-full flex items-center justify-between gap-2 rounded-lg border border-brand-border-opacity-20 bg-brand-void p-3 text-left text-[10px] font-mono text-brand-primary"
            >
              <span className="break-all">{tonDestination}</span>
              {copied
                ? <FaCheck className="shrink-0 text-emerald-400" />
                : <FaCopy className="shrink-0 opacity-50" />}
            </button>
            <p className="text-[9px] font-bold text-brand-primary/45 leading-relaxed">
              Verify this exact address in every bridge confirmation. Never use the ChessTGBot master wallet as the bridge destination.
            </p>
          </div>

          {route === 'eth' ? (
            <div className="space-y-2">
              <div className="rounded-xl border border-brand-border-opacity-10 bg-brand-void/40 p-3 text-[10px] font-bold text-brand-primary/65 leading-relaxed">
                <span className="font-black text-brand-primary">1.</span> Open Stargate, connect your Ethereum wallet, choose USDT as the output asset and TON as the destination network, then paste your TON address above.
              </div>
              <button
                type="button"
                disabled={openingBridge}
                onClick={() => launch(STARGATE_BRIDGE_URL, 'ethereum_to_ton_usdt', true)}
                className="w-full rounded-xl bg-brand-primary py-3 text-[10px] font-black uppercase tracking-widest text-brand-void disabled:opacity-45 flex items-center justify-center gap-2"
              >
                Open non-custodial bridge <FaExternalLinkAlt />
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="rounded-xl border border-brand-border-opacity-10 bg-brand-void/40 p-3 text-[10px] font-bold text-brand-primary/65 leading-relaxed space-y-2">
                <p><span className="font-black text-brand-primary">1.</span> Use THORSwap to exchange native BTC for USDT in your own Ethereum wallet.</p>
                <button
                  type="button"
                  disabled={openingBridge}
                  onClick={() => launch(THORSWAP_BTC_TO_USDT_URL, 'btc_to_ethereum_usdt', false)}
                  className="w-full rounded-lg border border-brand-border-opacity-20 py-2.5 text-[9px] font-black uppercase tracking-widest text-brand-primary/75 flex items-center justify-center gap-2"
                >
                  Open BTC swap <FaExternalLinkAlt />
                </button>
              </div>
              <div className="rounded-xl border border-brand-border-opacity-10 bg-brand-void/40 p-3 text-[10px] font-bold text-brand-primary/65 leading-relaxed space-y-2">
                <p><span className="font-black text-brand-primary">2.</span> Use Stargate to bridge that USDT from Ethereum to the TON address above.</p>
                <button
                  type="button"
                  disabled={openingBridge}
                  onClick={() => launch(STARGATE_BRIDGE_URL, 'ethereum_to_ton_usdt', true)}
                  className="w-full rounded-xl bg-brand-primary py-3 text-[10px] font-black uppercase tracking-widest text-brand-void disabled:opacity-45 flex items-center justify-center gap-2"
                >
                  Open TON bridge <FaExternalLinkAlt />
                </button>
              </div>
            </div>
          )}

          <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-2.5 text-[9px] font-bold text-amber-300/80 leading-relaxed">
            Check the route, destination, minimum received and network fees in your wallet before signing. Smart-contract and bridge risks still apply. A provider frontend may restrict access in some regions.
          </div>

          {error && (
            <div className="rounded-lg border border-rose-500/25 bg-rose-500/10 p-2.5 text-center text-[10px] font-bold text-rose-400">
              {error}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
