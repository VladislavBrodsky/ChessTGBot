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
        <div className="pt-4 space-y-4">
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-[10px] font-bold text-emerald-400 leading-relaxed shadow-[0_0_15px_rgba(16,185,129,0.1)]">
            Your assets stay under your wallet control. Bridge into your connected TON wallet first, then deposit the resulting USDT using the normal verified transfer above.
          </div>

          <div className="space-y-4 relative">
            {/* Step 1 */}
            <div className="relative pl-8">
              <div className="absolute left-0 top-0 w-5 h-5 rounded-full bg-brand-primary/20 text-brand-primary flex items-center justify-center text-[10px] font-black border border-brand-primary/40 shadow-[0_0_10px_rgba(255,215,0,0.2)]">1</div>
              <div className="absolute left-2.5 top-6 bottom-[-16px] w-px bg-brand-border-opacity-20"></div>
              
              <h4 className="text-[10px] font-black uppercase tracking-wider text-brand-primary mb-2">Select Source Asset</h4>
              <div className="grid grid-cols-2 gap-3" role="group" aria-label="Source asset">
                <button
                  type="button"
                  onClick={() => setRoute('eth')}
                  aria-pressed={route === 'eth'}
                  className={`rounded-xl border p-3 text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                    route === 'eth'
                      ? 'border-brand-primary bg-brand-primary/10 text-brand-primary shadow-[0_0_12px_rgba(255,215,0,0.15)]'
                      : 'border-brand-border-opacity-10 text-brand-primary/45 hover:border-brand-primary/50'
                  }`}
                >
                  <FaEthereum className="text-sm" /> Ethereum
                </button>
                <button
                  type="button"
                  onClick={() => setRoute('btc')}
                  aria-pressed={route === 'btc'}
                  className={`rounded-xl border p-3 text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                    route === 'btc'
                      ? 'border-brand-primary bg-brand-primary/10 text-brand-primary shadow-[0_0_12px_rgba(255,215,0,0.15)]'
                      : 'border-brand-border-opacity-10 text-brand-primary/45 hover:border-brand-primary/50'
                  }`}
                >
                  <FaBitcoin className="text-sm" /> Bitcoin
                </button>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative pl-8">
              <div className="absolute left-0 top-0 w-5 h-5 rounded-full bg-brand-primary/20 text-brand-primary flex items-center justify-center text-[10px] font-black border border-brand-primary/40 shadow-[0_0_10px_rgba(255,215,0,0.2)]">2</div>
              <div className="absolute left-2.5 top-6 bottom-[-16px] w-px bg-brand-border-opacity-20"></div>
              
              <h4 className="text-[10px] font-black uppercase tracking-wider text-brand-primary mb-2">Copy Destination Address</h4>
              <div className="space-y-2">
                <span className="block text-[9px] font-black uppercase tracking-wider text-brand-primary/45">
                  TON destination — your connected wallet
                </span>
                <button
                  type="button"
                  onClick={copyDestination}
                  className="w-full flex items-center justify-between gap-3 rounded-xl border border-brand-primary/30 bg-brand-void p-3.5 text-left text-[11px] font-mono text-brand-primary hover:bg-brand-primary/5 transition-colors shadow-inner"
                >
                  <span className="break-all">{tonDestination}</span>
                  {copied
                    ? <FaCheck className="shrink-0 text-emerald-400 text-sm" />
                    : <FaCopy className="shrink-0 opacity-50 text-sm" />}
                </button>
                <p className="text-[9px] font-bold text-brand-primary/45 leading-relaxed">
                  Verify this exact address in every bridge confirmation. Never use the ChessTGBot master wallet as the bridge destination.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative pl-8 pb-2">
              <div className="absolute left-0 top-0 w-5 h-5 rounded-full bg-brand-primary/20 text-brand-primary flex items-center justify-center text-[10px] font-black border border-brand-primary/40 shadow-[0_0_10px_rgba(255,215,0,0.2)]">3</div>
              
              <h4 className="text-[10px] font-black uppercase tracking-wider text-brand-primary mb-2">Execute Bridge</h4>
              
              {route === 'eth' ? (
                <div className="space-y-3">
                  <div className="rounded-xl border border-brand-primary/20 bg-brand-primary/5 p-3.5 text-[10px] font-bold text-brand-primary/80 leading-relaxed shadow-inner">
                    Open Stargate, connect your Ethereum wallet, choose USDT as the output asset and TON as the destination network, then paste your TON address above.
                  </div>
                  <button
                    type="button"
                    disabled={openingBridge}
                    onClick={() => launch(STARGATE_BRIDGE_URL, 'ethereum_to_ton_usdt', true)}
                    className="w-full rounded-xl bg-brand-primary py-3.5 text-[11px] font-black uppercase tracking-widest text-brand-void disabled:opacity-45 flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all shadow-[0_0_20px_rgba(255,215,0,0.3)]"
                  >
                    Open non-custodial bridge <FaExternalLinkAlt />
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="rounded-xl border border-brand-primary/20 bg-brand-primary/5 p-3.5 text-[10px] font-bold text-brand-primary/80 leading-relaxed shadow-inner">
                    <div className="mb-2"><span className="font-black text-brand-primary mr-1">A.</span> Use THORSwap to exchange native BTC for USDT in your own Ethereum wallet.</div>
                    <button
                      type="button"
                      disabled={openingBridge}
                      onClick={() => launch(THORSWAP_BTC_TO_USDT_URL, 'btc_to_ethereum_usdt', false)}
                      className="w-full rounded-lg border border-brand-primary/50 bg-brand-void py-2.5 text-[10px] font-black uppercase tracking-widest text-brand-primary flex items-center justify-center gap-2 hover:bg-brand-primary/10 transition-colors mt-2"
                    >
                      Open BTC swap <FaExternalLinkAlt />
                    </button>
                  </div>
                  <div className="rounded-xl border border-brand-primary/20 bg-brand-primary/5 p-3.5 text-[10px] font-bold text-brand-primary/80 leading-relaxed shadow-inner">
                    <div className="mb-2"><span className="font-black text-brand-primary mr-1">B.</span> Use Stargate to bridge that USDT from Ethereum to the TON address above.</div>
                    <button
                      type="button"
                      disabled={openingBridge}
                      onClick={() => launch(STARGATE_BRIDGE_URL, 'ethereum_to_ton_usdt', true)}
                      className="w-full rounded-xl bg-brand-primary py-3 text-[11px] font-black uppercase tracking-widest text-brand-void disabled:opacity-45 flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all shadow-[0_0_20px_rgba(255,215,0,0.3)] mt-2"
                    >
                      Open TON bridge <FaExternalLinkAlt />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-[9px] font-bold text-amber-300/80 leading-relaxed text-center mt-4">
            <FaShieldAlt className="inline mr-1" /> Check the route, destination, minimum received and network fees in your wallet before signing. Smart-contract and bridge risks still apply.
          </div>

          {error && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-center text-[10px] font-bold text-rose-400">
              {error}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
