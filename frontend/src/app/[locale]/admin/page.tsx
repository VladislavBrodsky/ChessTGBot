'use client';

import { useEffect, useState, useCallback, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiFetch } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { 
  FaUsers, FaStar, FaBolt, FaCalendarWeek, FaCalendarDays, 
  FaChessKnight, FaArrowDown, FaArrowUp, FaChartLine, FaLink,
  FaChartPie, FaCreditCard, FaChess, FaBullhorn, FaServer,
  FaDatabase, FaMemory, FaTelegram, FaWallet, FaGear,
  FaBell, FaCircleCheck, FaCircleXmark, FaTriangleExclamation, FaArrowsRotate
} from 'react-icons/fa6';
import LayoutWrapper from '@/components/LayoutWrapper';

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
  draws: number;
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
    <div className="w-full">
      <p className="text-[11px] text-brand-muted mb-2 uppercase tracking-widest">
        {label} — Last 14 Days
      </p>
      <div className="flex items-end gap-[3px] h-[60px]">
        {data.map((d, i) => {
          const h = Math.max(2, (values[i] / maxVal) * 60);
          return (
            <div
              key={i}
              title={`${d.date}: ${values[i]}`}
              className="flex-1 rounded-t-[2px] transition-all duration-300 cursor-default"
              style={{
                height: h,
                background: color,
                opacity: 0.7 + (i / data.length) * 0.3,
              }}
            />
          );
        })}
      </div>
      <div className="flex justify-between mt-1 text-[9px] text-brand-muted">
        <span>{data[0]?.date?.slice(5)}</span>
        <span>{data[data.length - 1]?.date?.slice(5)}</span>
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
  icon: ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative rounded-2xl p-4 flex items-center gap-4 overflow-hidden"
      style={{
        backgroundColor: 'rgba(10, 10, 15, 0.6)',
        border: `1px solid ${color}40`,
        boxShadow: `0 8px 32px 0 rgba(0,0,0,0.3), inset 0 0 20px ${color}10`,
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* Top right glowing dot */}
      <div 
        className="absolute top-2.5 right-2.5 w-1.5 h-1.5 rounded-full"
        style={{ 
          backgroundColor: color,
          boxShadow: `0 0 8px ${color}, 0 0 12px ${color}`
        }}
      />
      
      {/* Icon Box */}
      <div 
        className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 text-xl"
        style={{
          backgroundColor: `${color}15`,
          color: color,
          border: `1px solid ${color}30`,
          boxShadow: `0 0 15px ${color}20`
        }}
      >
        {icon}
      </div>

      {/* Content */}
      <div className="flex flex-col min-w-0 flex-1">
        <p className="text-xl sm:text-2xl font-black leading-none text-white tracking-wide mb-1" style={{ textShadow: `0 0 10px ${color}50` }}>
          {value}
        </p>
        <p className="text-[10px] sm:text-[11px] text-brand-primary opacity-60 uppercase tracking-widest sm:tracking-[0.2em] font-black leading-tight break-words">
          {label}
        </p>
        {sub && <p className="text-[10px] sm:text-[11px] text-brand-muted mt-1 whitespace-normal break-words leading-tight">{sub}</p>}
      </div>
    </motion.div>
  );
}

// ─── Tab Navigation ───────────────────────────────────────────────────────────

const TABS = ['Dashboard', 'Users', 'Transactions', 'Games', 'Broadcasts', 'System'] as const;
type Tab = typeof TABS[number];

// ─── Access Denied ────────────────────────────────────────────────────────────

function AccessDenied() {
  const router = useRouter();
  return (
    <div className="premium-liquid-mesh-container min-h-screen flex flex-col items-center justify-center text-brand-primary font-sans p-4">
      <div className="premium-liquid-mesh-blob1" />
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="premium-neon-card p-8 text-center max-w-sm w-full"
      >
        <div className="text-6xl mb-4">🚫</div>
        <h1 className="text-2xl font-black mb-2 text-rose-500 shadow-neon">Access Denied</h1>
        <p className="text-brand-muted text-sm mb-6">
          This panel is restricted to admin accounts only.
        </p>
        <button 
          onClick={() => router.back()}
          className="glass-button w-full py-3 text-sm font-bold uppercase tracking-widest"
        >
          Go Back
        </button>
      </motion.div>
    </div>
  );
}

// ─── Dashboard Tab ────────────────────────────────────────────────────────────

function DashboardTab({ stats }: { stats: Stats }) {
  return (
    <div className="w-full">
      {/* KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 mb-8 w-full">
        <KpiCard label="Total Users" value={fmt(stats.total_users)} icon={<FaUsers />} color="#8b5cf6" />
        <KpiCard label="Premium" value={fmt(stats.premium_users)} sub={pct(stats.premium_conversion_rate) + ' conversion'} icon={<FaStar />} color="#f59e0b" />
        <KpiCard label="Active 24h" value={fmt(stats.active_24h)} sub={pct(stats.engagement_rate_24h) + ' engagement'} icon={<FaBolt />} color="#22c55e" />
        <KpiCard label="Active 7d" value={fmt(stats.active_7d)} icon={<FaCalendarWeek />} color="#3b82f6" />
        <KpiCard label="Active 30d" value={fmt(stats.active_30d)} icon={<FaCalendarDays />} color="#14b8a6" />
        <KpiCard label="Total Games" value={fmt(stats.total_games)} sub={`${fmt(stats.games_today)} today`} icon={<FaChessKnight />} color="#ec4899" />
        <KpiCard label="Deposits" value={cents(stats.total_deposits_cents)} icon={<FaArrowDown />} color="#22c55e" />
        <KpiCard label="Withdrawals" value={cents(stats.total_withdrawals_cents)} icon={<FaArrowUp />} color="#f97316" />
        <KpiCard label="Net Revenue" value={cents(stats.net_revenue_cents)} sub={`${cents(stats.total_fees_cents)} fees + ${cents(stats.platform_rake_cents)} rake`} icon={<FaChartLine />} color="#8b5cf6" />
        <KpiCard label="Referrals" value={fmt(stats.total_referrals)} sub={`${fmt(stats.referral_levels.level_1)} direct`} icon={<FaLink />} color="#a855f7" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        <div className="premium-neon-card p-5">
          <BarChart data={stats.daily_activity} valueKey="count" label="Daily Activity" color="#8b5cf6" />
        </div>
        <div className="premium-neon-card p-5">
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
      <div className="flex gap-2 mb-4">
        <input
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { setSearch(searchInput); setPage(1); } }}
          placeholder="Search by name, username or Telegram ID…"
          className="flex-1 bg-[#0A0A0A]/60 backdrop-blur-xl border border-purple-500/30 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-purple-500 focus:shadow-[0_0_15px_rgba(168,85,247,0.4)] transition-all"
        />
        <button
          onClick={() => { setSearch(searchInput); setPage(1); }}
          className="action-button px-6 py-2.5 text-xs"
        >
          Search
        </button>
        {search && (
          <button
            onClick={() => { setSearch(''); setSearchInput(''); setPage(1); }}
            className="glass-button px-4 py-2.5 text-xs font-bold uppercase tracking-wider"
          >
            Clear
          </button>
        )}
      </div>

      <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 12 }}>
        {total > 0 ? `${fmt(total)} users found` : 'No results'}
      </p>

      {/* Table */}
      <div className="premium-neon-card overflow-x-auto p-1 mt-2">
        <table className="w-full text-xs text-left border-collapse">
          <thead>
            <tr className="border-b border-white/10">
              {['ID', 'Name', 'Username', 'ELO', 'Games', 'Balance', 'Level', 'Premium', ''].map(h => (
                <th key={h} className="px-4 py-3 text-brand-muted font-bold text-[10px] uppercase tracking-wider whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} className="text-center py-8 text-brand-muted">Loading…</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={9} className="text-center py-8 text-brand-muted">No users found</td></tr>
            ) : users.map(u => (
              <tr
                key={u.telegram_id}
                className="border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer"
              >
                <td className="px-4 py-2.5 text-brand-muted font-mono">{u.telegram_id}</td>
                <td className="px-4 py-2.5 font-bold">{u.first_name} {u.last_name || ''}</td>
                <td className="px-4 py-2.5 text-brand-muted">{u.username ? `@${u.username}` : '—'}</td>
                <td className="px-4 py-2.5 font-black text-purple-400">{u.elo}</td>
                <td className="px-4 py-2.5">{fmt(u.games_played)}</td>
                <td className={`px-4 py-2.5 ${u.balance_cents > 0 ? 'text-green-400 font-bold' : 'text-brand-muted'}`}>{cents(u.balance_cents)}</td>
                <td className="px-4 py-2.5">
                  <span className="bg-purple-500/20 text-purple-400 rounded-md px-2 py-1 text-[10px] font-bold">
                    L{u.level}
                  </span>
                </td>
                <td className="px-4 py-2.5">
                  {u.is_premium ? (
                    <span className="bg-amber-500/20 text-amber-400 rounded-md px-2 py-1 text-[10px] font-bold">
                      ⭐ {u.premium_tier || 'PRO'}
                    </span>
                  ) : (
                    <span className="text-brand-muted text-[10px]">—</span>
                  )}
                </td>
                <td className="px-4 py-2.5">
                  <button
                    onClick={() => openUser(u)}
                    className="bg-purple-500/20 hover:bg-purple-500/40 text-purple-400 rounded-lg px-3 py-1 text-[10px] font-bold transition-colors"
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
      <div className="flex justify-center items-center gap-2 mt-4">
        <button
          disabled={page === 1}
          onClick={() => setPage(p => p - 1)}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            page === 1 ? 'text-brand-muted bg-white/5 cursor-not-allowed' : 'glass-button'
          }`}
        >
          ← Prev
        </button>
        <span className="px-3 text-xs text-brand-muted">
          {page} / {pages}
        </span>
        <button
          disabled={page >= pages}
          onClick={() => setPage(p => p + 1)}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            page >= pages ? 'text-brand-muted bg-white/5 cursor-not-allowed' : 'glass-button'
          }`}
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
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => { setSelectedUser(null); setUserDetail(null); }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="premium-neon-card p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto relative"
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-xl font-black mb-1 text-purple-400">
                    {selectedUser.first_name} {selectedUser.last_name || ''}
                  </h2>
                  <p className="text-xs text-brand-muted">
                    {selectedUser.username ? `@${selectedUser.username} · ` : ''}{selectedUser.telegram_id}
                  </p>
                </div>
                <button
                  onClick={() => { setSelectedUser(null); setUserDetail(null); }}
                  className="text-brand-muted hover:text-white transition-colors text-2xl leading-none -mt-1"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
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
                  <div key={k as string} className="bg-[#0A0A0A]/60 backdrop-blur-xl border border-purple-500/20 rounded-xl p-3 hover:border-purple-500/40 hover:shadow-[0_0_15px_rgba(168,85,247,0.2)] transition-all">
                    <p className="text-[10px] text-purple-400 opacity-80 uppercase tracking-[0.08em] mb-1 font-bold">{k}</p>
                    <p className="text-xs font-black truncate text-white" title={v as string}>{v}</p>
                  </div>
                ))}
              </div>

              {userDetail && userDetail.transactions.length > 0 && (
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-brand-muted mb-3">
                    Recent Transactions
                  </p>
                  {userDetail.transactions.slice(0, 8).map(tx => (
                    <div key={tx.id} className="flex justify-between items-center py-2.5 border-b border-white/5">
                      <div className="flex items-center gap-2">
                        <span style={{
                          background: `${TX_COLORS[tx.type] || '#6b7280'}20`,
                          color: TX_COLORS[tx.type] || '#6b7280',
                        }} className="rounded-md px-2 py-1 text-[10px] font-bold">
                          {tx.type}
                        </span>
                        <span className="text-[11px] text-brand-muted">{formatDate(tx.created_at)}</span>
                      </div>
                      <span className="text-xs font-bold" style={{ color: tx.amount_cents >= 0 ? '#22c55e' : '#f97316' }}>
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

  const selectClass = "flex-1 bg-[#0A0A0A]/60 backdrop-blur-xl border border-purple-500/30 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-purple-500 focus:shadow-[0_0_15px_rgba(168,85,247,0.4)] transition-all";

  return (
    <div>
      {/* Filters */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1); }} className={selectClass}>
          {TX_TYPES.map(t => <option key={t} value={t} className="bg-gray-900">{t || 'All Types'}</option>)}
        </select>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} className={selectClass}>
          <option value="" className="bg-gray-900">All Statuses</option>
          <option value="completed" className="bg-gray-900">Completed</option>
          <option value="pending" className="bg-gray-900">Pending</option>
          <option value="failed" className="bg-gray-900">Failed</option>
        </select>
        {(typeFilter || statusFilter) && (
          <button
            onClick={() => { setTypeFilter(''); setStatusFilter(''); setPage(1); }}
            className="glass-button px-4 py-2 text-xs font-bold uppercase tracking-wider"
          >
            Clear
          </button>
        )}
        <span className="ml-auto text-[11px] text-brand-muted self-center">
          {total > 0 ? `${fmt(total)} transactions` : ''}
        </span>
      </div>

      {/* Table */}
      <div className="premium-neon-card overflow-x-auto p-1 mt-2">
        <table className="w-full text-xs text-left border-collapse">
          <thead>
            <tr className="border-b border-white/10">
              {['ID', 'User', 'Type', 'Amount', 'Fee', 'Status', 'Reference', 'Date'].map(h => (
                <th key={h} className="px-4 py-3 text-brand-muted font-bold text-[10px] uppercase tracking-wider whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="text-center py-8 text-brand-muted">Loading…</td></tr>
            ) : txs.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-8 text-brand-muted">No transactions</td></tr>
            ) : txs.map(tx => (
              <tr key={tx.id} className="border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer">
                <td className="px-4 py-2.5 text-brand-muted font-mono">{tx.id}</td>
                <td className="px-4 py-2.5 font-mono text-[11px]">{tx.user_id}</td>
                <td className="px-4 py-2.5">
                  <span style={{
                    background: `${TX_COLORS[tx.type] || '#6b7280'}20`,
                    color: TX_COLORS[tx.type] || '#6b7280',
                  }} className="rounded-md px-2 py-1 text-[10px] font-bold">
                    {tx.type}
                  </span>
                </td>
                <td className={`px-4 py-2.5 font-bold ${tx.amount_cents >= 0 ? 'text-green-500' : 'text-orange-500'}`}>
                  {tx.amount_cents >= 0 ? '+' : ''}{cents(tx.amount_cents)}
                </td>
                <td className="px-4 py-2.5 text-brand-muted">
                  {tx.fee_cents > 0 ? cents(tx.fee_cents) : '—'}
                </td>
                <td className="px-4 py-2.5">
                  <span style={{
                    background: `${STATUS_COLORS[tx.status] || '#6b7280'}20`,
                    color: STATUS_COLORS[tx.status] || '#6b7280',
                  }} className="rounded-md px-2 py-1 text-[10px] font-bold">
                    {tx.status}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-brand-muted font-mono text-[10px] max-w-[120px] truncate">
                  {tx.reference_id ? (
                    tx.reference_id.length > 20
                      ? <a href={`https://tonviewer.com/transaction/${tx.reference_id}`} target="_blank" rel="noreferrer" className="text-purple-500 hover:text-purple-400 no-underline transition-colors">
                          {tx.reference_id.slice(0, 12)}…
                        </a>
                      : tx.reference_id
                  ) : '—'}
                </td>
                <td className="px-4 py-2.5 text-brand-muted whitespace-nowrap">{formatDate(tx.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-center items-center gap-2 mt-4">
        <button
          disabled={page === 1}
          onClick={() => setPage(p => p - 1)}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            page === 1 ? 'text-brand-muted bg-white/5 cursor-not-allowed' : 'glass-button'
          }`}
        >
          ← Prev
        </button>
        <span className="px-3 text-xs text-brand-muted">
          {page} / {pages}
        </span>
        <button
          disabled={page >= pages}
          onClick={() => setPage(p => p + 1)}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            page >= pages ? 'text-brand-muted bg-white/5 cursor-not-allowed' : 'glass-button'
          }`}
        >
          Next →
        </button>
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
      <p className="text-[11px] text-brand-muted mb-3">
        {total > 0 ? `${fmt(total)} online games total` : 'No games yet'}
      </p>
      <div className="premium-neon-card overflow-x-auto p-1 mt-2">
        <table className="w-full text-xs text-left border-collapse">
          <thead>
            <tr className="border-b border-white/10">
              {['Game ID', 'White', 'Black', 'Result', 'Moves', 'Wager', 'Rake', 'Date'].map(h => (
                <th key={h} className="px-4 py-3 text-brand-muted font-bold text-[10px] uppercase tracking-wider whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="text-center py-8 text-brand-muted">Loading…</td></tr>
            ) : games.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-8 text-brand-muted">No games found</td></tr>
            ) : games.map(g => (
              <tr key={g.id} className="border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer">
                <td className="px-4 py-2.5 text-brand-muted font-mono text-[10px] max-w-[100px] truncate">
                  {g.game_id?.slice(0, 12)}…
                </td>
                <td className="px-4 py-2.5 font-mono text-[11px]">
                  {g.white_player_id}
                  <br />
                  <span className="text-[9px] text-brand-muted">
                    {g.white_elo_before} → <span className={g.white_elo_after >= g.white_elo_before ? 'text-green-500' : 'text-orange-500'}>{g.white_elo_after}</span>
                  </span>
                </td>
                <td className="px-4 py-2.5 font-mono text-[11px]">
                  {g.black_player_id}
                  <br />
                  <span className="text-[9px] text-brand-muted">
                    {g.black_elo_before} → <span className={g.black_elo_after >= g.black_elo_before ? 'text-green-500' : 'text-orange-500'}>{g.black_elo_after}</span>
                  </span>
                </td>
                <td className="px-4 py-2.5">
                  <span title={g.result_type || ''}>
                    {resultIcon(g)} {g.result_type || 'draw'}
                  </span>
                </td>
                <td className="px-4 py-2.5">{g.total_moves}</td>
                <td className={`px-4 py-2.5 ${g.bid_amount_cents > 0 ? 'text-green-400 font-bold' : 'text-brand-muted'}`}>
                  {g.bid_amount_cents > 0 ? cents(g.bid_amount_cents) : '—'}
                </td>
                <td className="px-4 py-2.5 text-brand-muted">
                  {g.platform_rake_cents > 0 ? cents(g.platform_rake_cents) : '—'}
                </td>
                <td className="px-4 py-2.5 text-brand-muted whitespace-nowrap">{formatDate(g.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-center items-center gap-2 mt-4">
        <button
          disabled={page === 1}
          onClick={() => setPage(p => p - 1)}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            page === 1 ? 'text-brand-muted bg-white/5 cursor-not-allowed' : 'glass-button'
          }`}
        >
          ← Prev
        </button>
        <span className="px-3 text-xs text-brand-muted">
          {page} / {pages}
        </span>
        <button
          disabled={page >= pages}
          onClick={() => setPage(p => p + 1)}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            page >= pages ? 'text-brand-muted bg-white/5 cursor-not-allowed' : 'glass-button'
          }`}
        >
          Next →
        </button>
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
      <div className="premium-neon-card p-6 mb-6">
        <h3 className="text-sm font-black mb-4 uppercase tracking-widest text-purple-400">
          📢 New Broadcast
        </h3>

        <div className="mb-4">
          <label className="text-[11px] text-brand-muted block mb-2 uppercase tracking-[0.08em]">
            Target Audience
          </label>
          <div className="flex flex-wrap gap-2">
            {AUDIENCES.map(a => (
              <button
                key={a.value}
                onClick={() => setAudience(a.value)}
                className={`px-4 py-2 rounded-xl text-xs transition-all ${
                  audience === a.value 
                    ? 'bg-purple-600 text-white shadow-neon font-bold' 
                    : 'bg-white/5 border border-white/10 text-brand-primary hover:bg-white/10'
                }`}
              >
                {a.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <label className="text-[11px] text-brand-muted block mb-2 uppercase tracking-[0.08em]">
            Message <span className="font-normal">(HTML supported: &lt;b&gt;, &lt;i&gt;, &lt;a&gt;)</span>
          </label>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Write your broadcast message here…"
            rows={5}
            className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-brand-primary text-sm resize-y outline-none focus:border-purple-500 transition-colors"
          />
          <p className="text-[10px] text-brand-muted mt-1">{message.length} characters</p>
        </div>

        {successMsg && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-green-500 mb-3">
            {successMsg}
          </motion.p>
        )}
        {errorMsg && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-red-500 mb-3">
            {errorMsg}
          </motion.p>
        )}

        <button
          onClick={sendBroadcast}
          disabled={sending || !message.trim()}
          className={`w-full md:w-auto px-8 py-3 rounded-xl text-sm font-black uppercase tracking-widest transition-all ${
            sending || !message.trim() 
              ? 'bg-white/5 text-brand-muted cursor-not-allowed' 
              : 'action-button'
          }`}
        >
          {sending ? 'Launching…' : '🚀 Send Broadcast'}
        </button>
      </div>

      {/* Broadcast History */}
      <h3 className="text-xs font-bold uppercase tracking-widest text-brand-muted mb-3">
        Campaign History
      </h3>

      {loading ? (
        <p className="text-brand-muted text-sm">Loading…</p>
      ) : broadcasts.length === 0 ? (
        <p className="text-brand-muted text-sm">No broadcasts yet.</p>
      ) : broadcasts.map(b => (
        <motion.div
          key={b.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="premium-neon-card p-5 mb-3"
        >
          <div className="flex justify-between items-start mb-2">
            <div>
              <span style={{
                background: `${STATUS_COLORS[b.status] || '#6b7280'}20`,
                color: STATUS_COLORS[b.status] || '#6b7280',
              }} className="rounded-md px-2 py-1 text-[10px] font-bold mr-2">
                {b.status.toUpperCase()}
              </span>
              <span className="text-[11px] text-brand-muted">
                #{b.id} · {b.audience} · {formatDate(b.created_at)}
              </span>
            </div>
            {(b.status === 'pending' || b.status === 'running') && (
              <button
                onClick={() => cancelBroadcast(b.id)}
                className="bg-rose-500/20 hover:bg-rose-500/40 text-rose-500 rounded-lg px-3 py-1 text-xs font-bold transition-colors"
              >
                Cancel
              </button>
            )}
          </div>

          <p className="text-sm mb-3 leading-relaxed">{b.message_preview}</p>

          {/* Progress bar */}
          <div className="mb-2">
            <div className="bg-white/5 rounded h-1.5 overflow-hidden">
              <div style={{
                width: `${b.progress_pct}%`,
                background: STATUS_COLORS[b.status] || '#6b7280',
              }} className="h-full rounded transition-all duration-500" />
            </div>
          </div>
          <div className="flex gap-4 text-[11px] text-brand-muted">
            <span>✅ {fmt(b.sent_count)} sent</span>
            <span>❌ {fmt(b.failed_count)} failed</span>
            <span>👥 {fmt(b.total_count)} total</span>
            <span className="ml-auto font-bold">{b.progress_pct.toFixed(1)}%</span>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// ─── System Status Tab ────────────────────────────────────────────────────────

interface SystemStatus {
  overall: string;
  checked_at: string;
  systems: {
    database?: { status: string; latency_ms: number | null; detail: string };
    redis?: { status: string; latency_ms: number | null; detail: string };
    telegram_bot?: { status: string; latency_ms: number | null; bot_username: string; is_leader: boolean; receiver_active: boolean; receiver_type: string | null; detail: string };
    web3?: { status: string; ton_api_configured: boolean; payout_mnemonic_configured: boolean; master_wallet_address: string; company_wallet_address: string; master_wallet_balance_ton: number | null; detail: string };
    xp_engine?: { status: string; total_xp_transactions: number | null; xp_per_level: number; detail: string };
    notifications?: { status: string; active_broadcasts: number; completed_broadcasts: number; detail: string };
  };
}

function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
    online: { color: '#22c55e', icon: <FaCircleCheck />, label: 'Online' },
    offline: { color: '#ef4444', icon: <FaCircleXmark />, label: 'Offline' },
    memory_fallback: { color: '#f59e0b', icon: <FaTriangleExclamation />, label: 'Memory Fallback' },
    initializing: { color: '#3b82f6', icon: <FaGear className="animate-spin" />, label: 'Initializing' },
    unconfigured: { color: '#6b7280', icon: <FaCircleXmark />, label: 'Not Configured' },
    all_systems_operational: { color: '#22c55e', icon: <FaCircleCheck />, label: 'All Systems Operational' },
    degraded: { color: '#ef4444', icon: <FaCircleXmark />, label: 'Degraded' },
    partial: { color: '#f59e0b', icon: <FaTriangleExclamation />, label: 'Partial' },
  };
  const c = cfg[status] ?? { color: '#6b7280', icon: <FaGear />, label: status };
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider" style={{ color: c.color, background: `${c.color}18`, border: `1px solid ${c.color}40` }}>
      {c.icon} {c.label}
    </span>
  );
}

function SysCard({ icon, title, status, latency, rows }: {
  icon: React.ReactNode;
  title: string;
  status: string;
  latency?: number | null;
  rows: { label: string; value: React.ReactNode }[];
}) {
  const statusColor = status === 'online' ? '#22c55e' : status === 'offline' ? '#ef4444' : status === 'memory_fallback' || status === 'partial' ? '#f59e0b' : '#6b7280';
  return (
    <div className="premium-neon-card p-5 flex flex-col gap-4" style={{ borderColor: `${statusColor}30` }}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg" style={{ background: `${statusColor}18`, color: statusColor }}>
            {icon}
          </div>
          <div>
            <div className="text-white font-black text-sm">{title}</div>
            {latency != null && <div className="text-[10px] text-brand-muted">{latency}ms latency</div>}
          </div>
        </div>
        <StatusBadge status={status} />
      </div>
      <div className="space-y-2">
        {rows.map((r, i) => (
          <div key={i} className="flex justify-between items-start gap-2 text-[11px]">
            <span className="text-brand-muted font-medium shrink-0">{r.label}</span>
            <span className="text-white/80 font-semibold text-right break-all">{r.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SystemTab() {
  const [data, setData] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch('/api/v1/admin/system/status');
      if (res.ok) {
        setData(await res.json());
      } else {
        setError(`Server returned ${res.status}`);
      }
    } catch (e) {
      setError('Network error — could not reach backend');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  const sys = data?.systems;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-white font-black text-xl">System Status</h2>
          <p className="text-brand-muted text-[11px] mt-0.5">
            {data ? `Last checked: ${new Date(data.checked_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })}` : 'Checking systems…'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {data && <StatusBadge status={data.overall} />}
          <button
            onClick={fetchStatus}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest bg-purple-500/20 border border-purple-500/40 text-purple-300 hover:bg-purple-500/30 transition-all disabled:opacity-50"
          >
            <FaArrowsRotate className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="premium-neon-card p-4 border-red-500/30 text-red-400 text-sm flex items-center gap-2">
          <FaCircleXmark /> {error}
        </div>
      )}

      {loading && !data && (
        <div className="text-center py-16 text-brand-muted">
          <FaServer className="text-4xl mx-auto mb-4 animate-pulse text-purple-400" />
          <p>Running system diagnostics…</p>
        </div>
      )}

      {sys && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Database */}
          <SysCard
            icon={<FaDatabase />}
            title="Database"
            status={sys.database?.status ?? 'unknown'}
            latency={sys.database?.latency_ms}
            rows={[
              { label: 'Type', value: 'PostgreSQL (asyncpg)' },
              { label: 'Detail', value: sys.database?.detail ?? '—' },
            ]}
          />

          {/* Redis */}
          <SysCard
            icon={<FaMemory />}
            title="Redis Cache"
            status={sys.redis?.status ?? 'unknown'}
            latency={sys.redis?.latency_ms}
            rows={[
              { label: 'Mode', value: sys.redis?.status === 'memory_fallback' ? 'In-Process Memory' : 'Redis Server' },
              { label: 'Detail', value: sys.redis?.detail ?? '—' },
            ]}
          />

          {/* Telegram Bot */}
          <SysCard
            icon={<FaTelegram />}
            title="Telegram Bot"
            status={sys.telegram_bot?.status ?? 'unknown'}
            latency={sys.telegram_bot?.latency_ms}
            rows={[
              { label: 'Bot', value: sys.telegram_bot?.bot_username ?? '—' },
              { label: 'Leader Instance', value: sys.telegram_bot?.is_leader ? '✅ Yes' : '⬜ No (Passive)' },
              { label: 'Receiver', value: sys.telegram_bot?.receiver_active ? `Active (${sys.telegram_bot.receiver_type ?? 'polling'})` : 'Inactive' },
              { label: 'Detail', value: sys.telegram_bot?.detail ?? '—' },
            ]}
          />

          {/* Web3 */}
          <SysCard
            icon={<FaWallet />}
            title="Web3 / Payments"
            status={sys.web3?.status ?? 'unknown'}
            rows={[
              { label: 'TON API', value: sys.web3?.ton_api_configured ? '✅ Configured' : '❌ Missing' },
              { label: 'Payout Mnemonic', value: sys.web3?.payout_mnemonic_configured ? '✅ Configured' : '❌ Missing' },
              { label: 'Deposit Pool Balance', value: sys.web3?.master_wallet_balance_ton != null ? `${sys.web3.master_wallet_balance_ton} TON` : 'N/A' },
              { label: 'Master Wallet', value: sys.web3?.master_wallet_address ? `${sys.web3.master_wallet_address.slice(0, 12)}…` : '—' },
            ]}
          />

          {/* XP Engine */}
          <SysCard
            icon={<FaStar />}
            title="XP / Gamification"
            status={sys.xp_engine?.status ?? 'unknown'}
            rows={[
              { label: 'Total XP Events', value: sys.xp_engine?.total_xp_transactions?.toLocaleString() ?? '—' },
              { label: 'XP per Level', value: `${sys.xp_engine?.xp_per_level ?? 200} XP` },
              { label: 'Detail', value: sys.xp_engine?.detail ?? '—' },
            ]}
          />

          {/* Notifications */}
          <SysCard
            icon={<FaBell />}
            title="Notifications"
            status={sys.notifications?.status ?? 'unknown'}
            rows={[
              { label: 'Active Broadcasts', value: sys.notifications?.active_broadcasts?.toString() ?? '0' },
              { label: 'Completed Broadcasts', value: sys.notifications?.completed_broadcasts?.toLocaleString() ?? '0' },
              { label: 'Detail', value: sys.notifications?.detail ?? '—' },
            ]}
          />
        </div>
      )}
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
    <LayoutWrapper className="justify-start pt-6 pb-32">
    <div className="relative min-h-screen overflow-hidden text-brand-primary font-sans pb-[120px]"
      style={{
        backgroundColor: '#050505',
        backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px)',
        backgroundSize: '24px 24px'
      }}
    >
      {/* Ambient background glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[80%] h-[60%] bg-purple-900/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[50%] bg-amber-900/10 blur-[100px] rounded-full pointer-events-none" />
      
      <div className="relative z-10 max-w-[1100px] mx-auto px-4 pt-8">

        {/* Header & Back Button */}
        <div className="mb-10 flex flex-col items-center text-center">

          
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mt-4 flex flex-col items-center">
            
            <h1 className="text-3xl font-black text-white tracking-wide mb-2 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
              ADMIN COMMAND
            </h1>
            <p className="text-[10px] text-brand-muted uppercase tracking-[0.2em] font-black">
              FinChess Arena · Restricted Access
            </p>
          </motion.div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 justify-center mb-10 overflow-x-auto scrollbar-none w-full max-w-3xl mx-auto px-4">
          {TABS.map(tab => {
            const Icon = tab === 'Dashboard' ? FaChartPie : tab === 'Users' ? FaUsers : tab === 'Transactions' ? FaCreditCard : tab === 'Games' ? FaChess : tab === 'Broadcasts' ? FaBullhorn : FaServer;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-none px-5 md:px-6 py-3 rounded-xl text-[10px] md:text-[11px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                  activeTab === tab 
                    ? 'bg-white/10 border border-white/20 text-white shadow-[0_0_20px_rgba(255,255,255,0.1)]' 
                    : 'text-brand-muted hover:text-white border border-transparent hover:border-white/5 hover:bg-white/5'
                }`}
              >
                <Icon className="text-sm opacity-80" /> {tab}
              </button>
            );
          })}
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
              <div className="text-center py-16 text-brand-muted">
                <div className="text-[32px] mb-3">⏳</div>
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
            ) : activeTab === 'System' ? (
              <SystemTab />
            ) : null}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
    </LayoutWrapper>
  );
}
