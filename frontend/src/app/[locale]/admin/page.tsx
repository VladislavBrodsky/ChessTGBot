'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiFetch } from '@/lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Stats {
  total_users: number;
  premium_users: number;
  premium_conversion_rate: number;
  active_24h: number;
  active_7d: number;
  active_30d: number;
  engagement_rate_24h: number;
  total_games: number;
  games_today: number;
  total_deposits_cents: number;
  total_withdrawals_cents: number;
  total_fees_cents: number;
  platform_rake_cents: number;
  net_revenue_cents: number;
  total_referrals: number;
  referral_levels: { level_1: number };
  daily_activity: { date: string; count: number }[];
  daily_revenue: { date: string; total_cents: number }[];
}

interface UserSummary {
  id: number;
  telegram_id: number;
  username: string | null;
  first_name: string;
  last_name: string | null;
  elo: number;
  games_played: number;
  wins: number;
  losses: number;
  balance_cents: number;
  is_premium: boolean;
  premium_tier: string | null;
  level: number;
  xp: number;
  wallet_address: string | null;
  referral_code: string | null;
}

interface Transaction {
  id: number;
  user_id: number;
  type: string;
  amount_cents: number;
  fee_cents: number;
  status: string;
  reference_id: string | null;
  created_at: string | null;
}

interface Game {
  id: number;
  game_id: string;
  white_player_id: number;
  black_player_id: number;
  winner: string | null;
  result_type: string | null;
  white_elo_before: number;
  white_elo_after: number;
  black_elo_before: number;
  black_elo_after: number;
  bid_amount_cents: number;
  platform_rake_cents: number;
  total_moves: number;
  duration_seconds: number | null;
  created_at: string | null;
}

interface Broadcast {
  id: number;
  admin_id: number;
  audience: string;
  message_preview: string;
  total_count: number;
  sent_count: number;
  failed_count: number;
  status: string;
  progress_pct: number;
  created_at: string | null;
  completed_at: string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const cents = (c: number) => `$${(c / 100).toFixed(2)}`;
const pct = (n: number) => `${n.toFixed(1)}%`;
const fmt = (n: number) => n.toLocaleString();

const TX_COLORS: Record<string, string> = {
  deposit: '#22c55e',
  withdrawal: '#f97316',
  game_wager: '#a855f7',
  game_win: '#3b82f6',
  game_rake: '#ec4899',
  referral_commission: '#f59e0b',
  subscription: '#14b8a6',
  deposit_fee: '#6b7280',
};

const STATUS_COLORS: Record<string, string> = {
  completed: '#22c55e',
  pending: '#f59e0b',
  failed: '#ef4444',
  running: '#3b82f6',
  cancelled: '#6b7280',
};

function formatDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

// ─── Mini Bar Chart ───────────────────────────────────────────────────────────

function BarChart({
  data,
  valueKey,
  label,
  color = '#8b5cf6',
}: {
  data: { date: string; [k: string]: number | string }[];
  valueKey: string;
  label: string;
  color?: string;
}) {
  const values = data.map(d => Number(d[valueKey]));
  const maxVal = Math.max(...values, 1);

  return (
    <div style={{ width: '100%' }}>
      <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
        {label} — Last 14 Days
      </p>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 60 }}>
        {data.map((d, i) => {
          const h = Math.max(2, (values[i] / maxVal) * 60);
          return (
            <div
              key={i}
              title={`${d.date}: ${values[i]}`}
              style={{
                flex: 1,
                height: h,
                background: color,
                borderRadius: '2px 2px 0 0',
                opacity: 0.7 + (i / data.length) * 0.3,
                transition: 'height 0.3s ease',
                cursor: 'default',
              }}
            />
          );
        })}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
        <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>{data[0]?.date?.slice(5)}</span>
        <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>{data[data.length - 1]?.date?.slice(5)}</span>
      </div>
    </div>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({
  label,
  value,
  sub,
  color = '#8b5cf6',
  icon,
}: {
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
  icon: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-muted)',
        borderRadius: 16,
        padding: '16px 18px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div style={{
        position: 'absolute', top: -10, right: -10,
        fontSize: 48, opacity: 0.07, pointerEvents: 'none',
      }}>
        {icon}
      </div>
      <p style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 6 }}>
        {label}
      </p>
      <p style={{ fontSize: 24, fontWeight: 800, color, lineHeight: 1 }}>{value}</p>
      {sub && <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{sub}</p>}
    </motion.div>
  );
}

// ─── Tab Navigation ───────────────────────────────────────────────────────────

const TABS = ['Dashboard', 'Users', 'Transactions', 'Games', 'Broadcasts'] as const;
type Tab = typeof TABS[number];

// ─── Access Denied ────────────────────────────────────────────────────────────

function AccessDenied() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-primary)',
      color: 'var(--text-primary)',
      fontFamily: 'Outfit, sans-serif',
    }}>
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        style={{ textAlign: 'center', padding: 32 }}
      >
        <div style={{ fontSize: 64, marginBottom: 16 }}>🚫</div>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Access Denied</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
          This panel is restricted to admin accounts only.
        </p>
      </motion.div>
    </div>
  );
}

// ─── Dashboard Tab ────────────────────────────────────────────────────────────

function DashboardTab({ stats }: { stats: Stats }) {
  return (
    <div>
      {/* KPI Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12, marginBottom: 24 }}>
        <KpiCard label="Total Users" value={fmt(stats.total_users)} icon="👥" color="#8b5cf6" />
        <KpiCard label="Premium" value={fmt(stats.premium_users)} sub={pct(stats.premium_conversion_rate) + ' conversion'} icon="⭐" color="#f59e0b" />
        <KpiCard label="Active 24h" value={fmt(stats.active_24h)} sub={pct(stats.engagement_rate_24h) + ' engagement'} icon="⚡" color="#22c55e" />
        <KpiCard label="Active 7d" value={fmt(stats.active_7d)} icon="📆" color="#3b82f6" />
        <KpiCard label="Active 30d" value={fmt(stats.active_30d)} icon="📅" color="#14b8a6" />
        <KpiCard label="Total Games" value={fmt(stats.total_games)} sub={`${fmt(stats.games_today)} today`} icon="♟️" color="#ec4899" />
        <KpiCard label="Deposits" value={cents(stats.total_deposits_cents)} icon="💰" color="#22c55e" />
        <KpiCard label="Withdrawals" value={cents(stats.total_withdrawals_cents)} icon="💸" color="#f97316" />
        <KpiCard label="Net Revenue" value={cents(stats.net_revenue_cents)} sub={`${cents(stats.total_fees_cents)} fees + ${cents(stats.platform_rake_cents)} rake`} icon="📈" color="#8b5cf6" />
        <KpiCard label="Referrals" value={fmt(stats.total_referrals)} sub={`${fmt(stats.referral_levels.level_1)} direct`} icon="🔗" color="#a855f7" />
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-muted)',
          borderRadius: 16,
          padding: '20px 20px 16px',
        }}>
          <BarChart data={stats.daily_activity} valueKey="count" label="Daily Activity" color="#8b5cf6" />
        </div>
        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-muted)',
          borderRadius: 16,
          padding: '20px 20px 16px',
        }}>
          <BarChart data={stats.daily_revenue} valueKey="total_cents" label="Daily Revenue (¢)" color="#22c55e" />
        </div>
      </div>
    </div>
  );
}

// ─── Users Tab ────────────────────────────────────────────────────────────────

function UsersTab() {
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserSummary | null>(null);
  const [userDetail, setUserDetail] = useState<{ referral_count: number; transactions: Transaction[] } | null>(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '20' });
    if (search) params.set('search', search);
    const res = await apiFetch(`/api/v1/admin/users?${params}`);
    if (res.ok) {
      const data = await res.json();
      setUsers(data.users);
      setTotal(data.total);
    }
    setLoading(false);
  }, [page, search]);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const openUser = async (u: UserSummary) => {
    setSelectedUser(u);
    const res = await apiFetch(`/api/v1/admin/users/${u.telegram_id}`);
    if (res.ok) {
      const data = await res.json();
      setUserDetail(data);
    }
  };

  const pages = Math.max(1, Math.ceil(total / 20));

  return (
    <div>
      {/* Search */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <input
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { setSearch(searchInput); setPage(1); } }}
          placeholder="Search by name, username or Telegram ID…"
          style={{
            flex: 1,
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-muted)',
            borderRadius: 12,
            padding: '10px 16px',
            color: 'var(--text-primary)',
            fontSize: 13,
            outline: 'none',
          }}
        />
        <button
          onClick={() => { setSearch(searchInput); setPage(1); }}
          style={{
            background: '#8b5cf6',
            color: '#fff',
            border: 'none',
            borderRadius: 12,
            padding: '10px 20px',
            fontWeight: 700,
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          Search
        </button>
        {search && (
          <button
            onClick={() => { setSearch(''); setSearchInput(''); setPage(1); }}
            style={{
              background: 'var(--bg-elevated)',
              color: 'var(--text-muted)',
              border: '1px solid var(--border-muted)',
              borderRadius: 12,
              padding: '10px 16px',
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            Clear
          </button>
        )}
      </div>

      <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 12 }}>
        {total > 0 ? `${fmt(total)} users found` : 'No results'}
      </p>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-muted)' }}>
              {['ID', 'Name', 'Username', 'ELO', 'Games', 'Balance', 'Level', 'Premium', ''].map(h => (
                <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', whiteSpace: 'nowrap' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>Loading…</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={9} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>No users found</td></tr>
            ) : users.map(u => (
              <tr
                key={u.telegram_id}
                style={{ borderBottom: '1px solid var(--border-muted)', cursor: 'pointer', transition: 'background 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-elevated)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <td style={{ padding: '10px 12px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{u.telegram_id}</td>
                <td style={{ padding: '10px 12px', fontWeight: 600 }}>{u.first_name} {u.last_name || ''}</td>
                <td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>{u.username ? `@${u.username}` : '—'}</td>
                <td style={{ padding: '10px 12px', fontWeight: 700, color: '#8b5cf6' }}>{u.elo}</td>
                <td style={{ padding: '10px 12px' }}>{fmt(u.games_played)}</td>
                <td style={{ padding: '10px 12px', color: u.balance_cents > 0 ? '#22c55e' : 'var(--text-muted)' }}>{cents(u.balance_cents)}</td>
                <td style={{ padding: '10px 12px' }}>
                  <span style={{ background: '#8b5cf620', color: '#8b5cf6', borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>
                    L{u.level}
                  </span>
                </td>
                <td style={{ padding: '10px 12px' }}>
                  {u.is_premium ? (
                    <span style={{ background: '#f59e0b20', color: '#f59e0b', borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>
                      ⭐ {u.premium_tier || 'PRO'}
                    </span>
                  ) : (
                    <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>—</span>
                  )}
                </td>
                <td style={{ padding: '10px 12px' }}>
                  <button
                    onClick={() => openUser(u)}
                    style={{
                      background: '#8b5cf620',
                      color: '#8b5cf6',
                      border: 'none',
                      borderRadius: 8,
                      padding: '4px 12px',
                      fontSize: 11,
                      cursor: 'pointer',
                      fontWeight: 600,
                    }}
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16 }}>
        <button
          disabled={page === 1}
          onClick={() => setPage(p => p - 1)}
          style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-muted)',
            borderRadius: 8,
            padding: '6px 16px',
            color: page === 1 ? 'var(--text-muted)' : 'var(--text-primary)',
            cursor: page === 1 ? 'not-allowed' : 'pointer',
            fontSize: 12,
          }}
        >
          ← Prev
        </button>
        <span style={{ padding: '6px 12px', fontSize: 12, color: 'var(--text-muted)' }}>
          {page} / {pages}
        </span>
        <button
          disabled={page >= pages}
          onClick={() => setPage(p => p + 1)}
          style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-muted)',
            borderRadius: 8,
            padding: '6px 16px',
            color: page >= pages ? 'var(--text-muted)' : 'var(--text-primary)',
            cursor: page >= pages ? 'not-allowed' : 'pointer',
            fontSize: 12,
          }}
        >
          Next →
        </button>
      </div>

      {/* User Detail Drawer */}
      <AnimatePresence>
        {selectedUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 1000, padding: 16,
            }}
            onClick={() => { setSelectedUser(null); setUserDetail(null); }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-muted)',
                borderRadius: 20,
                padding: 24,
                maxWidth: 560,
                width: '100%',
                maxHeight: '80vh',
                overflowY: 'auto',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                <div>
                  <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>
                    {selectedUser.first_name} {selectedUser.last_name || ''}
                  </h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                    {selectedUser.username ? `@${selectedUser.username} · ` : ''}{selectedUser.telegram_id}
                  </p>
                </div>
                <button
                  onClick={() => { setSelectedUser(null); setUserDetail(null); }}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 20, cursor: 'pointer' }}
                >
                  ✕
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
                {[
                  ['ELO', selectedUser.elo],
                  ['Level', `L${selectedUser.level} (${fmt(selectedUser.xp)} XP)`],
                  ['Games', `${fmt(selectedUser.games_played)} (${selectedUser.wins}W/${selectedUser.losses}L/${selectedUser.draws}D)`],
                  ['Balance', cents(selectedUser.balance_cents)],
                  ['Premium', selectedUser.is_premium ? `⭐ ${selectedUser.premium_tier || 'PRO'}` : 'Standard'],
                  ['Referrals', userDetail ? fmt(userDetail.referral_count) : '…'],
                  ['Wallet', selectedUser.wallet_address ? `${selectedUser.wallet_address.slice(0, 10)}…` : 'None'],
                  ['Referral Code', selectedUser.referral_code || '—'],
                ].map(([k, v]) => (
                  <div key={k as string} style={{ background: 'var(--bg-elevated)', borderRadius: 10, padding: '10px 14px' }}>
                    <p style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>{k}</p>
                    <p style={{ fontSize: 13, fontWeight: 600 }}>{v}</p>
                  </div>
                ))}
              </div>

              {userDetail && userDetail.transactions.length > 0 && (
                <div>
                  <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: 10 }}>
                    Recent Transactions
                  </p>
                  {userDetail.transactions.slice(0, 8).map(tx => (
                    <div key={tx.id} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '8px 0', borderBottom: '1px solid var(--border-muted)',
                    }}>
                      <div>
                        <span style={{
                          background: `${TX_COLORS[tx.type] || '#6b7280'}20`,
                          color: TX_COLORS[tx.type] || '#6b7280',
                          borderRadius: 6, padding: '2px 8px', fontSize: 10, fontWeight: 700,
                        }}>
                          {tx.type}
                        </span>
                        <span style={{ marginLeft: 8, fontSize: 11, color: 'var(--text-muted)' }}>{formatDate(tx.created_at)}</span>
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 700, color: tx.amount_cents >= 0 ? '#22c55e' : '#f97316' }}>
                        {tx.amount_cents >= 0 ? '+' : ''}{cents(tx.amount_cents)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Transactions Tab ─────────────────────────────────────────────────────────

function TransactionsTab() {
  const [txs, setTxs] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(false);

  const loadTxs = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '25' });
    if (typeFilter) params.set('type', typeFilter);
    if (statusFilter) params.set('status', statusFilter);
    const res = await apiFetch(`/api/v1/admin/transactions?${params}`);
    if (res.ok) {
      const data = await res.json();
      setTxs(data.transactions);
      setTotal(data.total);
    }
    setLoading(false);
  }, [page, typeFilter, statusFilter]);

  useEffect(() => { loadTxs(); }, [loadTxs]);

  const pages = Math.max(1, Math.ceil(total / 25));

  const TX_TYPES = ['', 'deposit', 'withdrawal', 'game_wager', 'game_win', 'game_rake', 'referral_commission', 'subscription', 'deposit_fee'];

  const selectStyle = {
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border-muted)',
    borderRadius: 10,
    padding: '8px 12px',
    color: 'var(--text-primary)',
    fontSize: 12,
    outline: 'none',
    cursor: 'pointer',
  };

  return (
    <div>
      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1); }} style={selectStyle as React.CSSProperties}>
          {TX_TYPES.map(t => <option key={t} value={t}>{t || 'All Types'}</option>)}
        </select>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} style={selectStyle as React.CSSProperties}>
          <option value="">All Statuses</option>
          <option value="completed">Completed</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
        </select>
        {(typeFilter || statusFilter) && (
          <button
            onClick={() => { setTypeFilter(''); setStatusFilter(''); setPage(1); }}
            style={{ background: 'none', border: '1px solid var(--border-muted)', borderRadius: 10, padding: '8px 14px', color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer' }}
          >
            Clear
          </button>
        )}
        <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-muted)', alignSelf: 'center' }}>
          {total > 0 ? `${fmt(total)} transactions` : ''}
        </span>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-muted)' }}>
              {['ID', 'User', 'Type', 'Amount', 'Fee', 'Status', 'Reference', 'Date'].map(h => (
                <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', whiteSpace: 'nowrap' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>Loading…</td></tr>
            ) : txs.length === 0 ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>No transactions</td></tr>
            ) : txs.map(tx => (
              <tr key={tx.id} style={{ borderBottom: '1px solid var(--border-muted)' }}>
                <td style={{ padding: '10px 12px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{tx.id}</td>
                <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontSize: 11 }}>{tx.user_id}</td>
                <td style={{ padding: '10px 12px' }}>
                  <span style={{
                    background: `${TX_COLORS[tx.type] || '#6b7280'}20`,
                    color: TX_COLORS[tx.type] || '#6b7280',
                    borderRadius: 6, padding: '2px 8px', fontSize: 10, fontWeight: 700,
                  }}>
                    {tx.type}
                  </span>
                </td>
                <td style={{ padding: '10px 12px', fontWeight: 700, color: tx.amount_cents >= 0 ? '#22c55e' : '#f97316' }}>
                  {tx.amount_cents >= 0 ? '+' : ''}{cents(tx.amount_cents)}
                </td>
                <td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>
                  {tx.fee_cents > 0 ? cents(tx.fee_cents) : '—'}
                </td>
                <td style={{ padding: '10px 12px' }}>
                  <span style={{
                    background: `${STATUS_COLORS[tx.status] || '#6b7280'}20`,
                    color: STATUS_COLORS[tx.status] || '#6b7280',
                    borderRadius: 6, padding: '2px 8px', fontSize: 10, fontWeight: 700,
                  }}>
                    {tx.status}
                  </span>
                </td>
                <td style={{ padding: '10px 12px', color: 'var(--text-muted)', fontFamily: 'monospace', fontSize: 10, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {tx.reference_id ? (
                    tx.reference_id.length > 20
                      ? <a href={`https://tonviewer.com/transaction/${tx.reference_id}`} target="_blank" rel="noreferrer" style={{ color: '#8b5cf6', textDecoration: 'none' }}>
                          {tx.reference_id.slice(0, 12)}…
                        </a>
                      : tx.reference_id
                  ) : '—'}
                </td>
                <td style={{ padding: '10px 12px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{formatDate(tx.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16 }}>
        <button disabled={page === 1} onClick={() => setPage(p => p - 1)} style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-muted)', borderRadius: 8, padding: '6px 16px', color: page === 1 ? 'var(--text-muted)' : 'var(--text-primary)', cursor: page === 1 ? 'not-allowed' : 'pointer', fontSize: 12 }}>← Prev</button>
        <span style={{ padding: '6px 12px', fontSize: 12, color: 'var(--text-muted)' }}>{page} / {pages}</span>
        <button disabled={page >= pages} onClick={() => setPage(p => p + 1)} style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-muted)', borderRadius: 8, padding: '6px 16px', color: page >= pages ? 'var(--text-muted)' : 'var(--text-primary)', cursor: page >= pages ? 'not-allowed' : 'pointer', fontSize: 12 }}>Next →</button>
      </div>
    </div>
  );
}

// ─── Games Tab ────────────────────────────────────────────────────────────────

function GamesTab() {
  const [games, setGames] = useState<Game[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const loadGames = useCallback(async () => {
    setLoading(true);
    const res = await apiFetch(`/api/v1/admin/games?page=${page}&limit=20`);
    if (res.ok) {
      const data = await res.json();
      setGames(data.games);
      setTotal(data.total);
    }
    setLoading(false);
  }, [page]);

  useEffect(() => { loadGames(); }, [loadGames]);

  const pages = Math.max(1, Math.ceil(total / 20));

  const resultIcon = (g: Game) => {
    if (!g.winner) return '🤝';
    return g.winner === 'w' ? '⬜' : '⬛';
  };

  return (
    <div>
      <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 12 }}>
        {total > 0 ? `${fmt(total)} online games total` : 'No games yet'}
      </p>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-muted)' }}>
              {['Game ID', 'White', 'Black', 'Result', 'Moves', 'Wager', 'Rake', 'Date'].map(h => (
                <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', whiteSpace: 'nowrap' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>Loading…</td></tr>
            ) : games.length === 0 ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>No games found</td></tr>
            ) : games.map(g => (
              <tr key={g.id} style={{ borderBottom: '1px solid var(--border-muted)' }}>
                <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontSize: 10, color: 'var(--text-muted)', maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {g.game_id?.slice(0, 12)}…
                </td>
                <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontSize: 11 }}>
                  {g.white_player_id}
                  <br />
                  <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>
                    {g.white_elo_before} → <span style={{ color: g.white_elo_after >= g.white_elo_before ? '#22c55e' : '#f97316' }}>{g.white_elo_after}</span>
                  </span>
                </td>
                <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontSize: 11 }}>
                  {g.black_player_id}
                  <br />
                  <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>
                    {g.black_elo_before} → <span style={{ color: g.black_elo_after >= g.black_elo_before ? '#22c55e' : '#f97316' }}>{g.black_elo_after}</span>
                  </span>
                </td>
                <td style={{ padding: '10px 12px' }}>
                  <span title={g.result_type || ''}>
                    {resultIcon(g)} {g.result_type || 'draw'}
                  </span>
                </td>
                <td style={{ padding: '10px 12px' }}>{g.total_moves}</td>
                <td style={{ padding: '10px 12px', color: g.bid_amount_cents > 0 ? '#22c55e' : 'var(--text-muted)' }}>
                  {g.bid_amount_cents > 0 ? cents(g.bid_amount_cents) : '—'}
                </td>
                <td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>
                  {g.platform_rake_cents > 0 ? cents(g.platform_rake_cents) : '—'}
                </td>
                <td style={{ padding: '10px 12px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{formatDate(g.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16 }}>
        <button disabled={page === 1} onClick={() => setPage(p => p - 1)} style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-muted)', borderRadius: 8, padding: '6px 16px', color: page === 1 ? 'var(--text-muted)' : 'var(--text-primary)', cursor: page === 1 ? 'not-allowed' : 'pointer', fontSize: 12 }}>← Prev</button>
        <span style={{ padding: '6px 12px', fontSize: 12, color: 'var(--text-muted)' }}>{page} / {pages}</span>
        <button disabled={page >= pages} onClick={() => setPage(p => p + 1)} style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-muted)', borderRadius: 8, padding: '6px 16px', color: page >= pages ? 'var(--text-muted)' : 'var(--text-primary)', cursor: page >= pages ? 'not-allowed' : 'pointer', fontSize: 12 }}>Next →</button>
      </div>
    </div>
  );
}

// ─── Broadcasts Tab ───────────────────────────────────────────────────────────

function BroadcastsTab() {
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');
  const [audience, setAudience] = useState('all');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const loadBroadcasts = useCallback(async () => {
    setLoading(true);
    const res = await apiFetch('/api/v1/admin/broadcasts?limit=20');
    if (res.ok) {
      const data = await res.json();
      setBroadcasts(data.broadcasts);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadBroadcasts(); }, [loadBroadcasts]);

  const sendBroadcast = async () => {
    if (!message.trim()) { setErrorMsg('Message cannot be empty.'); return; }
    setSending(true);
    setErrorMsg('');
    setSuccessMsg('');
    const res = await apiFetch('/api/v1/admin/broadcasts', {
      method: 'POST',
      body: JSON.stringify({ message, audience }),
    });
    if (res.ok) {
      const data = await res.json();
      setSuccessMsg(`✅ Broadcast #${data.id} launched to ${fmt(data.total_count)} users!`);
      setMessage('');
      await loadBroadcasts();
    } else {
      const err = await res.json().catch(() => ({ detail: 'Unknown error' }));
      setErrorMsg(`❌ ${err.detail}`);
    }
    setSending(false);
  };

  const cancelBroadcast = async (id: number) => {
    const res = await apiFetch(`/api/v1/admin/broadcasts/${id}/cancel`, { method: 'POST' });
    if (res.ok) await loadBroadcasts();
  };

  const AUDIENCES = [
    { value: 'all', label: '👥 All Users' },
    { value: 'premium', label: '⭐ Premium Users' },
    { value: 'standard', label: '🔹 Standard Users' },
    { value: 'joined_24h', label: '⚡ Active Last 24h' },
    { value: 'joined_7d', label: '📆 Active Last 7 Days' },
    { value: 'joined_30d', label: '📅 Active Last 30 Days' },
  ];

  return (
    <div>
      {/* Composer */}
      <div style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-muted)',
        borderRadius: 20,
        padding: 24,
        marginBottom: 24,
      }}>
        <h3 style={{ fontSize: 14, fontWeight: 800, marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#8b5cf6' }}>
          📢 New Broadcast
        </h3>

        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Target Audience
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {AUDIENCES.map(a => (
              <button
                key={a.value}
                onClick={() => setAudience(a.value)}
                style={{
                  background: audience === a.value ? '#8b5cf6' : 'var(--bg-elevated)',
                  color: audience === a.value ? '#fff' : 'var(--text-primary)',
                  border: `1px solid ${audience === a.value ? '#8b5cf6' : 'var(--border-muted)'}`,
                  borderRadius: 10,
                  padding: '7px 14px',
                  fontSize: 12,
                  cursor: 'pointer',
                  fontWeight: audience === a.value ? 700 : 400,
                  transition: 'all 0.15s',
                }}
              >
                {a.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Message <span style={{ fontWeight: 400 }}>(HTML supported: &lt;b&gt;, &lt;i&gt;, &lt;a&gt;)</span>
          </label>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Write your broadcast message here…"
            rows={5}
            style={{
              width: '100%',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-muted)',
              borderRadius: 12,
              padding: '12px 16px',
              color: 'var(--text-primary)',
              fontSize: 13,
              resize: 'vertical',
              outline: 'none',
              fontFamily: 'inherit',
              boxSizing: 'border-box',
            }}
          />
          <p style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>{message.length} characters</p>
        </div>

        {successMsg && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ fontSize: 13, color: '#22c55e', marginBottom: 12 }}>
            {successMsg}
          </motion.p>
        )}
        {errorMsg && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ fontSize: 13, color: '#ef4444', marginBottom: 12 }}>
            {errorMsg}
          </motion.p>
        )}

        <button
          onClick={sendBroadcast}
          disabled={sending || !message.trim()}
          style={{
            background: sending || !message.trim() ? 'var(--bg-elevated)' : 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
            color: sending || !message.trim() ? 'var(--text-muted)' : '#fff',
            border: 'none',
            borderRadius: 12,
            padding: '12px 28px',
            fontWeight: 800,
            fontSize: 13,
            cursor: sending || !message.trim() ? 'not-allowed' : 'pointer',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            transition: 'all 0.2s',
          }}
        >
          {sending ? 'Launching…' : '🚀 Send Broadcast'}
        </button>
      </div>

      {/* Broadcast History */}
      <h3 style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: 12 }}>
        Campaign History
      </h3>

      {loading ? (
        <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Loading…</p>
      ) : broadcasts.length === 0 ? (
        <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No broadcasts yet.</p>
      ) : broadcasts.map(b => (
        <motion.div
          key={b.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-muted)',
            borderRadius: 16,
            padding: '16px 20px',
            marginBottom: 10,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
            <div>
              <span style={{
                background: `${STATUS_COLORS[b.status] || '#6b7280'}20`,
                color: STATUS_COLORS[b.status] || '#6b7280',
                borderRadius: 6, padding: '2px 8px', fontSize: 10, fontWeight: 700, marginRight: 8,
              }}>
                {b.status.toUpperCase()}
              </span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                #{b.id} · {b.audience} · {formatDate(b.created_at)}
              </span>
            </div>
            {(b.status === 'pending' || b.status === 'running') && (
              <button
                onClick={() => cancelBroadcast(b.id)}
                style={{ background: '#ef444420', color: '#ef4444', border: 'none', borderRadius: 8, padding: '4px 12px', fontSize: 11, cursor: 'pointer', fontWeight: 600 }}
              >
                Cancel
              </button>
            )}
          </div>

          <p style={{ fontSize: 12, color: 'var(--text-primary)', marginBottom: 10, lineHeight: 1.5 }}>{b.message_preview}</p>

          {/* Progress bar */}
          <div style={{ marginBottom: 6 }}>
            <div style={{ background: 'var(--bg-elevated)', borderRadius: 4, height: 6, overflow: 'hidden' }}>
              <div style={{
                width: `${b.progress_pct}%`,
                height: '100%',
                background: STATUS_COLORS[b.status] || '#6b7280',
                borderRadius: 4,
                transition: 'width 0.5s ease',
              }} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 16, fontSize: 11, color: 'var(--text-muted)' }}>
            <span>✅ {fmt(b.sent_count)} sent</span>
            <span>❌ {fmt(b.failed_count)} failed</span>
            <span>👥 {fmt(b.total_count)} total</span>
            <span style={{ marginLeft: 'auto', fontWeight: 700 }}>{b.progress_pct.toFixed(1)}%</span>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// ─── Main Admin Page ──────────────────────────────────────────────────────────

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<Tab>('Dashboard');
  const [stats, setStats] = useState<Stats | null>(null);
  const [accessDenied, setAccessDenied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch('/api/v1/admin/stats').then(async res => {
      if (res.status === 403) {
        setAccessDenied(true);
      } else if (res.ok) {
        setStats(await res.json());
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (accessDenied) return <AccessDenied />;

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-primary)',
      color: 'var(--text-primary)',
      fontFamily: 'Outfit, Plus Jakarta Sans, sans-serif',
      padding: '24px 16px 48px',
    }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <h1 style={{
              fontSize: 26,
              fontWeight: 900,
              background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '-0.02em',
              marginBottom: 4,
            }}>
              ♟ Admin Command Center
            </h1>
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              FinChess Arena · Restricted Access
            </p>
          </motion.div>
        </div>

        {/* Tab Navigation */}
        <div style={{
          display: 'flex',
          gap: 4,
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-muted)',
          borderRadius: 14,
          padding: 4,
          marginBottom: 24,
          overflowX: 'auto',
        }}>
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                flex: '0 0 auto',
                background: activeTab === tab ? '#8b5cf6' : 'transparent',
                color: activeTab === tab ? '#fff' : 'var(--text-muted)',
                border: 'none',
                borderRadius: 10,
                padding: '9px 20px',
                fontWeight: activeTab === tab ? 700 : 500,
                fontSize: 13,
                cursor: 'pointer',
                transition: 'all 0.15s',
                whiteSpace: 'nowrap',
              }}
            >
              {tab === 'Dashboard' ? '📊' : tab === 'Users' ? '👥' : tab === 'Transactions' ? '💳' : tab === 'Games' ? '♟' : '📢'} {tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
          >
            {loading && activeTab === 'Dashboard' ? (
              <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
                <p>Loading dashboard…</p>
              </div>
            ) : activeTab === 'Dashboard' && stats ? (
              <DashboardTab stats={stats} />
            ) : activeTab === 'Users' ? (
              <UsersTab />
            ) : activeTab === 'Transactions' ? (
              <TransactionsTab />
            ) : activeTab === 'Games' ? (
              <GamesTab />
            ) : activeTab === 'Broadcasts' ? (
              <BroadcastsTab />
            ) : null}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
