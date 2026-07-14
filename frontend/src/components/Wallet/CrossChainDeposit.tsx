'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { FaAngleDown, FaCheck, FaCopy, FaExchangeAlt } from 'react-icons/fa';

import { apiFetch } from '@/lib/api';
import { copyToClipboard } from '@/lib/clipboard';
import { logTelemetryEvent } from '@/lib/telemetry';
import { telegramHaptic } from '@/lib/telegram';

type Asset = {
  symbol: string;
  name: string;
  network: string;
};

type Quote = {
  rate_id: string;
  source_currency: string;
  amount_from: string;
  amount_to_usdt: string;
  estimated_credit_usdt: string;
  network_fee_usdt: string;
  min_from: string;
  max_from: string;
  expires_at: number;
  provider: string;
};

type Order = {
  id: number;
  provider: string;
  provider_order_id: string;
  source_currency: string;
  source_amount: string;
  expected_usdt: string;
  network_fee_usdt: string;
  payin_address: string;
  payin_extra_id?: string | null;
  status: string;
  payout_hash?: string | null;
  pay_till?: string | null;
  credited: boolean;
  credited_amount_cents?: number | null;
};

interface CrossChainDepositProps {
  onCredited: (creditedAmountCents: number) => void;
}

const STATUS_LABELS: Record<string, string> = {
  new: 'Awaiting payment',
  waiting: 'Awaiting payment',
  confirming: 'Confirming on source network',
  exchanging: 'Converting to USDT',
  sending: 'Sending USDT on TON',
  finished: 'USDT sent — confirming deposit',
  failed: 'Exchange failed',
  refunded: 'Refunded',
  expired: 'Order expired',
  overdue: 'Payment window expired',
  hold: 'Provider review required',
};

async function responseError(response: Response, fallback: string): Promise<string> {
  try {
    const data = await response.json();
    return typeof data?.detail === 'string' ? data.detail : fallback;
  } catch {
    return fallback;
  }
}

export default function CrossChainDeposit({ onCredited }: CrossChainDepositProps) {
  const [enabled, setEnabled] = useState(false);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [open, setOpen] = useState(false);
  const [source, setSource] = useState('btc');
  const [amount, setAmount] = useState('0.001');
  const [refundAddress, setRefundAddress] = useState('');
  const [quote, setQuote] = useState<Quote | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState<'address' | 'memo' | null>(null);
  const creditedOrderRef = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiFetch('/api/v1/wallet/cross-chain/assets')
      .then(async (response) => {
        if (!response.ok) return;
        const data = await response.json();
        if (!cancelled) {
          setEnabled(Boolean(data.enabled));
          setAssets(Array.isArray(data.assets) ? data.assets : []);
        }
      })
      .catch(() => undefined);
    return () => { cancelled = true; };
  }, []);

  const refreshOrder = useCallback(async (id: number) => {
    const response = await apiFetch(`/api/v1/wallet/cross-chain/orders/${id}`);
    if (!response.ok) return;
    const updated: Order = await response.json();
    setOrder(updated);
    if (
      updated.credited
      && updated.credited_amount_cents != null
      && creditedOrderRef.current !== updated.id
    ) {
      creditedOrderRef.current = updated.id;
      logTelemetryEvent('deposit_completed', {
        method: 'cross_chain',
        credited_amount_cents: updated.credited_amount_cents,
        source_currency: updated.source_currency,
      });
      onCredited(updated.credited_amount_cents);
    }
  }, [onCredited]);

  useEffect(() => {
    if (!order || order.credited || ['failed', 'refunded', 'expired', 'overdue'].includes(order.status)) {
      return;
    }
    const timer = window.setInterval(() => {
      refreshOrder(order.id).catch(() => undefined);
    }, 10_000);
    return () => window.clearInterval(timer);
  }, [order, refreshOrder]);

  if (!enabled || assets.length === 0) return null;

  const selectedAsset = assets.find((asset) => asset.symbol.toLowerCase() === source) || assets[0];

  const requestQuote = async () => {
    setBusy(true);
    setError('');
    setQuote(null);
    try {
      const response = await apiFetch('/api/v1/wallet/cross-chain/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source_currency: source, amount }),
      });
      if (!response.ok) throw new Error(await responseError(response, 'Could not get an exchange quote'));
      const nextQuote: Quote = await response.json();
      setQuote(nextQuote);
      logTelemetryEvent('cross_chain_quote_created', {
        source_currency: source,
        amount_from: amount,
        estimated_credit_usdt: nextQuote.estimated_credit_usdt,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not get an exchange quote');
    } finally {
      setBusy(false);
    }
  };

  const createOrder = async () => {
    if (!quote || !refundAddress.trim()) {
      setError(`Enter a valid ${selectedAsset.symbol} refund address first.`);
      return;
    }
    setBusy(true);
    setError('');
    try {
      const response = await apiFetch('/api/v1/wallet/cross-chain/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source_currency: source,
          amount,
          rate_id: quote.rate_id,
          refund_address: refundAddress.trim(),
        }),
      });
      if (!response.ok) throw new Error(await responseError(response, 'Could not create the exchange order'));
      const nextOrder: Order = await response.json();
      setOrder(nextOrder);
      logTelemetryEvent('deposit_submitted', {
        method: 'cross_chain',
        source_currency: source,
        provider_order_id: nextOrder.provider_order_id,
      });
      telegramHaptic('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create the exchange order');
    } finally {
      setBusy(false);
    }
  };

  const copyField = async (value: string, field: 'address' | 'memo') => {
    if (!(await copyToClipboard(value))) return;
    setCopied(field);
    telegramHaptic('light');
    window.setTimeout(() => setCopied(null), 1800);
  };

  return (
    <div className="border-t border-brand-border-opacity-10 pt-3.5">
      <button
        type="button"
        onClick={() => { setOpen((value) => !value); telegramHaptic('light'); }}
        className="w-full flex items-center justify-between py-1 text-[10px] font-black text-brand-primary/60 hover:text-brand-primary uppercase tracking-wider transition-colors cursor-pointer"
      >
        <span className="flex items-center gap-2"><FaExchangeAlt /> Deposit BTC or ETH</span>
        <FaAngleDown className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="pt-3 space-y-3">
          <div className="rounded-xl border border-brand-gold/20 bg-brand-gold/5 p-3 text-[10px] font-bold text-brand-primary/70 leading-relaxed">
            Your crypto is converted by Changelly to USDT on TON. Only the verified USDT payout is credited. Provider and network fees apply.
          </div>

          {!order && (
            <>
              <div className="grid grid-cols-2 gap-2">
                <label className="space-y-1">
                  <span className="block text-[9px] font-black uppercase tracking-wider text-brand-primary/45">You send</span>
                  <select
                    value={source}
                    disabled={busy}
                    onChange={(event) => {
                      const value = event.target.value;
                      setSource(value);
                      setAmount(value === 'btc' ? '0.001' : '0.02');
                      setQuote(null);
                      setError('');
                    }}
                    className="w-full rounded-lg border border-brand-border-opacity-20 bg-brand-void px-2.5 py-2 text-[11px] font-black text-brand-primary"
                  >
                    {assets.map((asset) => (
                      <option key={asset.symbol} value={asset.symbol.toLowerCase()}>{asset.symbol} — {asset.network}</option>
                    ))}
                  </select>
                </label>
                <label className="space-y-1">
                  <span className="block text-[9px] font-black uppercase tracking-wider text-brand-primary/45">Exact amount</span>
                  <input
                    type="number"
                    value={amount}
                    disabled={busy}
                    min="0"
                    step="any"
                    onChange={(event) => { setAmount(event.target.value); setQuote(null); }}
                    className="w-full rounded-lg border border-brand-border-opacity-20 bg-brand-void px-2.5 py-2 text-[11px] font-black text-brand-primary"
                  />
                </label>
              </div>

              <label className="space-y-1 block">
                <span className="block text-[9px] font-black uppercase tracking-wider text-brand-primary/45">
                  {selectedAsset.symbol} refund address
                </span>
                <input
                  type="text"
                  value={refundAddress}
                  disabled={busy}
                  onChange={(event) => setRefundAddress(event.target.value)}
                  placeholder={`Your ${selectedAsset.network} wallet address`}
                  className="w-full rounded-lg border border-brand-border-opacity-20 bg-brand-void px-3 py-2.5 text-[10px] font-mono text-brand-primary"
                />
                <span className="block text-[9px] font-bold text-brand-primary/40">Refunds can only return to this source-network address.</span>
              </label>

              {quote && (
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 space-y-1.5 text-[10px] font-bold">
                  <div className="flex justify-between text-brand-primary/60"><span>Provider estimates</span><span>{Number(quote.amount_to_usdt).toFixed(2)} USDT</span></div>
                  <div className="flex justify-between text-brand-primary/60"><span>Provider network fee</span><span>{Number(quote.network_fee_usdt).toFixed(2)} USDT</span></div>
                  <div className="flex justify-between border-t border-emerald-500/15 pt-1.5 text-emerald-400 font-black"><span>Estimated balance credit</span><span>{Number(quote.estimated_credit_usdt).toFixed(2)} USDT</span></div>
                  <p className="pt-1 text-[9px] text-brand-primary/40">Quote expires quickly. Final credit is based on USDT actually received on TON.</p>
                </div>
              )}

              <button
                type="button"
                disabled={busy || !amount || Number(amount) <= 0}
                onClick={quote ? createOrder : requestQuote}
                className="w-full rounded-xl bg-brand-primary py-3 text-[10px] font-black uppercase tracking-widest text-brand-void disabled:opacity-45"
              >
                {busy ? 'Working…' : quote ? 'Create deposit order' : 'Get live quote'}
              </button>
            </>
          )}

          {order && (
            <div className="space-y-3">
              <div className={`rounded-xl border p-3 text-center ${order.credited ? 'border-emerald-500/25 bg-emerald-500/10' : 'border-brand-gold/20 bg-brand-gold/5'}`}>
                <p className="text-[9px] font-black uppercase tracking-widest text-brand-primary/45">Status</p>
                <p className={`mt-1 text-[11px] font-black uppercase tracking-wider ${order.credited ? 'text-emerald-400' : 'text-brand-gold'}`}>
                  {order.credited ? 'Deposit credited' : (STATUS_LABELS[order.status] || order.status)}
                </p>
              </div>

              <div className="space-y-1">
                <span className="block text-[9px] font-black uppercase tracking-wider text-rose-400">Send exactly {order.source_amount} {selectedAsset.symbol}</span>
                <button
                  type="button"
                  onClick={() => copyField(order.payin_address, 'address')}
                  className="w-full flex items-center justify-between gap-2 rounded-lg border border-brand-border-opacity-20 bg-brand-void p-3 text-left text-[10px] font-mono text-brand-primary"
                >
                  <span className="break-all">{order.payin_address}</span>
                  {copied === 'address' ? <FaCheck className="shrink-0 text-emerald-400" /> : <FaCopy className="shrink-0 opacity-50" />}
                </button>
                <span className="block text-[9px] font-bold text-brand-primary/45">Network: {selectedAsset.network}. Sending another asset or network can permanently lose funds.</span>
              </div>

              {order.payin_extra_id && (
                <div className="space-y-1">
                  <span className="block text-[9px] font-black uppercase tracking-wider text-rose-400">Required provider memo / destination tag</span>
                  <button
                    type="button"
                    onClick={() => copyField(order.payin_extra_id || '', 'memo')}
                    className="w-full flex items-center justify-between rounded-lg border border-rose-500/30 bg-rose-500/5 p-2.5 text-[10px] font-mono font-black text-rose-300"
                  >
                    <span>{order.payin_extra_id}</span>
                    {copied === 'memo' ? <FaCheck /> : <FaCopy />}
                  </button>
                </div>
              )}

              {order.pay_till && (
                <p className="text-center text-[9px] font-bold text-brand-primary/45">
                  Payment window ends {new Date(order.pay_till).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              )}

              <button
                type="button"
                onClick={() => refreshOrder(order.id)}
                className="w-full rounded-lg border border-brand-border-opacity-20 py-2.5 text-[9px] font-black uppercase tracking-widest text-brand-primary/70"
              >
                Refresh status
              </button>
            </div>
          )}

          {error && <div className="rounded-lg border border-rose-500/25 bg-rose-500/10 p-2.5 text-center text-[10px] font-bold text-rose-400">{error}</div>}
        </div>
      )}
    </div>
  );
}
