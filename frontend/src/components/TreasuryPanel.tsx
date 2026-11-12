'use client';

import { useState } from 'react';
import { FaBuildingColumns, FaTriangleExclamation } from 'react-icons/fa6';
import { apiFetch } from '@/lib/api';
import { useSWRFetch } from '@/hooks/useSWRFetch';

interface TreasuryPosition {
  onchain_usdt_usd: number | null;
  player_balances_usd: number;
  unsent_withdrawals_usd: number;
  held_stakes_usd: number;
  open_pots_usd: number;
  recent_sweeps_usd: number;
  reserve_usd: number;
  total_owed_usd: number;
  available_profit_usd: number | null;
  swept_to_date_usd: number;
  company_wallet_address: string | null;
  sweep_blocked_reason: string | null;
  onchain_error: string | null;
  sweep_amount_usd?: number;
  sent?: boolean;
  status?: string;
  reference_id?: string | null;
}

const usd = (v: number | null | undefined) => (v == null ? '—' : `$${v.toFixed(2)}`);

/**
 * Platform profit = custody USDT minus everything still owed to players and a
 * reserve. Sweeping is two-step: preview, then confirm; the backend re-checks
 * the live position at confirm time and only pays the company wallet.
 */
export default function TreasuryPanel() {
  const { data, mutate, error } = useSWRFetch('/api/v1/admin/treasury');
  const pos = data as TreasuryPosition | undefined;
  const [preview, setPreview] = useState<TreasuryPosition | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);

  const call = async (confirm: boolean) => {
    setBusy(true);
    setMessage(null);
    try {
      const res = await apiFetch('/api/v1/admin/treasury/sweep', {
        method: 'POST',
        body: JSON.stringify({ confirm }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setPreview(null);
        setMessage({ kind: 'error', text: body?.detail || 'Sweep refused.' });
        return;
      }
      if (confirm) {
        setPreview(null);
        setMessage({ kind: 'ok', text: `Sent ${usd(body.sweep_amount_usd)} to the company wallet (${body.status}).` });
        await mutate();
      } else {
        setPreview(body as TreasuryPosition);
      }
    } catch {
      setMessage({ kind: 'error', text: 'Network error. Nothing was sent.' });
    } finally {
      setBusy(false);
    }
  };

  if (error && !pos) {
    return (
      <div role="alert" className="rounded-2xl border border-amber-500/30 bg-amber-950/10 p-4 text-caption text-amber-400">
        Couldn&apos;t load the treasury position.
      </div>
    );
  }
  if (!pos) return null;

  const rows: [string, number | null][] = [
    ['Custody USDT (on chain)', pos.onchain_usdt_usd],
    ['− Player balances', pos.player_balances_usd],
    ['− Withdrawals not yet sent', pos.unsent_withdrawals_usd],
    ['− Stakes in matchmaking', pos.held_stakes_usd],
    ['− Open game pots', pos.open_pots_usd],
    ['− Sweeps still settling', pos.recent_sweeps_usd],
    ['− Safety reserve', pos.reserve_usd],
  ];
  const available = pos.available_profit_usd;
  const canSweep = !pos.sweep_blocked_reason && available != null && available >= 1;

  return (
    <section aria-labelledby="treasury-title" className="rounded-2xl border border-emerald-500/25 bg-emerald-950/10 p-5">
      <div className="flex items-center justify-between gap-3 mb-3">
        <h3 id="treasury-title" className="flex items-center gap-2 text-sm font-semibold normal-case tracking-normal text-emerald-300">
          <FaBuildingColumns /> Treasury · Platform profit
        </h3>
        <span className="text-caption text-brand-muted normal-case tracking-normal">Swept to date {usd(pos.swept_to_date_usd)}</span>
      </div>

      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-sm">
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between gap-3">
            <dt className="text-brand-muted">{label}</dt>
            <dd className="font-mono text-brand-primary">{usd(value)}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-brand-border pt-3">
        <div>
          <div className="text-caption text-brand-muted">Profit available to sweep</div>
          <div className="text-xl font-bold font-mono text-emerald-400">{usd(available)}</div>
          <div className="text-caption text-brand-muted font-mono truncate max-w-xs sm:max-w-md">
            To: {pos.company_wallet_address || 'company wallet not set'}
          </div>
        </div>
        {!preview && (
          <button
            type="button"
            disabled={!canSweep || busy}
            onClick={() => { void call(false); }}
            className="ui-tap-target px-4 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-caption font-semibold normal-case tracking-normal disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
          >
            {busy ? 'Checking…' : 'Sweep profit…'}
          </button>
        )}
      </div>

      {(pos.sweep_blocked_reason || pos.onchain_error) && (
        <p className="mt-2 flex items-center gap-1.5 text-caption text-amber-400">
          <FaTriangleExclamation /> {pos.sweep_blocked_reason || `On-chain balance unavailable: ${pos.onchain_error}`}
        </p>
      )}

      {preview && (
        <div role="alertdialog" aria-label="Confirm profit sweep" className="mt-3 rounded-xl border border-emerald-500/40 bg-brand-surface p-3 text-sm">
          <p className="text-brand-primary">
            Send <b className="font-mono">{usd(preview.sweep_amount_usd)}</b> USDT to{' '}
            <span className="font-mono break-all">{preview.company_wallet_address}</span>? This can&apos;t be undone.
          </p>
          <div className="mt-2 flex gap-2">
            <button type="button" disabled={busy} onClick={() => { void call(true); }}
              className="ui-tap-target px-3 py-1.5 rounded-lg bg-emerald-500 text-black text-caption font-bold disabled:opacity-50 cursor-pointer">
              {busy ? 'Sending…' : 'Confirm sweep'}
            </button>
            <button type="button" disabled={busy} onClick={() => setPreview(null)}
              className="ui-tap-target px-3 py-1.5 rounded-lg bg-brand-elevated border border-brand-border text-brand-muted text-caption font-semibold cursor-pointer">
              Cancel
            </button>
          </div>
        </div>
      )}

      {message && (
        <p role="status" className={`mt-2 text-caption ${message.kind === 'ok' ? 'text-emerald-400' : 'text-rose-400'}`}>{message.text}</p>
      )}
    </section>
  );
}
