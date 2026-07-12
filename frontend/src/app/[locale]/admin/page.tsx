'use client';

import { useEffect, useState, useCallback, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiFetch } from '@/lib/api';
import { useSWRFetch } from '@/hooks/useSWRFetch';
import { useRouter } from 'next/navigation';
import { 
  FaUsers, FaStar, FaBolt, FaCalendarWeek, FaCalendarDays, 
  FaChessKnight, FaArrowDown, FaArrowUp, FaChartLine, FaLink,
  FaChartPie, FaCreditCard, FaChess, FaBullhorn, FaServer,
  FaDatabase, FaMemory, FaTelegram, FaWallet, FaGear,
  FaBell, FaCircleCheck, FaCircleXmark, FaTriangleExclamation, FaArrowsRotate, FaScaleBalanced
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
  total_chargebacks_cents: number;
  total_refunds_cents: number;
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
  chargeback: '#ef4444',
  refund: '#f59e0b',
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
  const [hovered, setHovered] = useState<number | null>(null);
  const values = data.map(d => Number(d[valueKey]));
  const maxVal = Math.max(...values, 1);
  const total = values.reduce((a, b) => a + b, 0);

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-3">
        <p className="text-[11px] text-brand-muted uppercase tracking-widest font-bold">{label}</p>
        <p className="text-[11px] font-black" style={{ color }}>
          {valueKey.includes('cents') ? cents(total) : fmt(total)} total
        </p>
      </div>
      <div className="flex items-end gap-[3px] h-[72px] relative">
        {data.map((d, i) => {
          const h = Math.max(3, (values[i] / maxVal) * 72);
          return (
            <div
              key={i}
              className="flex-1 relative group cursor-default"
              style={{ height: 72, display: 'flex', alignItems: 'flex-end' }}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            >
              {hovered === i && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 bg-black/90 border border-white/10 rounded-lg px-2 py-1 text-[10px] text-white whitespace-nowrap z-10 pointer-events-none">
                  <div className="font-bold">{d.date.slice(5)}</div>
                  <div style={{ color }}>{valueKey.includes('cents') ? cents(values[i]) : fmt(values[i])}</div>
                </div>
              )}
              <div
                className="w-full rounded-t-[3px] transition-all duration-200"
                style={{
                  height: h,
                  background: hovered === i
                    ? color
                    : `linear-gradient(180deg, ${color}cc, ${color}55)`,
                  boxShadow: hovered === i ? `0 -4px 12px ${color}60` : 'none',
                }}
              />
            </div>
          );
        })}
      </div>
      <div className="flex justify-between mt-1.5 text-[10px] text-brand-muted">
        <span>{data[0]?.date?.slice(5)}</span>
        <span className="opacity-50">14 days</span>
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
      className="relative rounded-2xl p-3 sm:p-4 flex items-center gap-2.5 sm:gap-4 overflow-hidden w-full min-w-0"
      style={{
        backgroundColor: 'rgba(10, 10, 15, 0.6)',
        border: `1px solid ${color}40`,
        boxShadow: `0 8px 32px 0 rgba(0,0,0,0.3), inset 0 0 20px ${color}10`,
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* Top right glowing dot */}
      <div 
        className="absolute top-2 right-2 w-1 h-1 sm:top-2.5 sm:right-2.5 sm:w-1.5 sm:h-1.5 rounded-full"
        style={{ 
          backgroundColor: color,
          boxShadow: `0 0 8px ${color}, 0 0 12px ${color}`
        }}
      />
      
      {/* Icon Box */}
      <div 
        className="w-9 h-9 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0 text-base sm:text-xl"
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
        <p className="text-lg sm:text-2xl font-black leading-none text-white tracking-wide mb-1" style={{ textShadow: `0 0 10px ${color}50` }}>
          {value}
        </p>
        <p className="text-[10px] sm:text-[11px] text-brand-primary opacity-60 uppercase tracking-wider sm:tracking-[0.2em] font-black leading-tight break-words">
          {label}
        </p>
        {sub && <p className="text-[10px] sm:text-[11px] text-brand-muted mt-1 whitespace-normal break-words leading-tight">{sub}</p>}
      </div>
    </motion.div>
  );
}

// ─── Pagination ───────────────────────────────────────────────────────────────

function Pagination({ page, pages, onPage }: { page: number; pages: number; onPage: (p: number) => void }) {
  if (pages <= 1) return null;
  const visiblePages = Array.from({ length: Math.min(5, pages) }, (_, i) => {
    const start = Math.max(1, Math.min(page - 2, pages - 4));
    return start + i;
  }).filter(p => p >= 1 && p <= pages);

  return (
    <div className="flex justify-center items-center gap-1.5 mt-5">
      <button
        disabled={page === 1}
        onClick={() => onPage(page - 1)}
        className="w-8 h-8 rounded-lg text-xs font-black flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed bg-white/5 hover:bg-white/10 border border-white/5"
      >‹</button>
      {visiblePages.map(p => (
        <button
          key={p}
          onClick={() => onPage(p)}
          className={`w-8 h-8 rounded-lg text-xs font-black flex items-center justify-center transition-all ${
            p === page
              ? 'bg-purple-600 text-white shadow-[0_0_12px_rgba(147,51,234,0.5)]'
              : 'bg-white/5 hover:bg-white/10 border border-white/5 text-brand-muted'
          }`}
        >{p}</button>
      ))}
      <button
        disabled={page >= pages}
        onClick={() => onPage(page + 1)}
        className="w-8 h-8 rounded-lg text-xs font-black flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed bg-white/5 hover:bg-white/10 border border-white/5"
      >›</button>
      <span className="text-[10px] text-brand-muted ml-1">{page}/{pages}</span>
    </div>
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
        className="premium-neon-card p-8 text-center max-w-sm md:max-w-xl lg:max-w-3xl w-full"
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
  const now = new Date();
  const greeting = now.getHours() < 12 ? 'Good morning' : now.getHours() < 18 ? 'Good afternoon' : 'Good evening';
  return (
    <div className="w-full">
      {/* Greeting Banner */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-black text-white">{greeting}, Admin 👋</h2>
          <p className="text-[11px] text-brand-muted mt-0.5">{now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
        </div>
        <div className="px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest bg-green-500/10 border border-green-500/20 text-green-400">
          ● Live
        </div>
      </div>

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
        <KpiCard label="Chargebacks" value={cents(stats.total_chargebacks_cents)} icon={<FaCircleXmark />} color="#ef4444" />
        <KpiCard label="Refunds" value={cents(stats.total_refunds_cents)} icon={<FaArrowsRotate />} color="#f59e0b" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        <div className="premium-neon-card p-5">
          <BarChart data={stats.daily_activity} valueKey="count" label="Daily Activity" color="#8b5cf6" />
        </div>
        <div className="premium-neon-card p-5">
          <BarChart data={stats.daily_revenue} valueKey="total_cents" label="Daily Revenue" color="#22c55e" />
        </div>
      </div>
    </div>
  );
}

// ─── Users Tab ────────────────────────────────────────────────────────────────



function UsersTab() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserSummary | null>(null);
  const [userDetail, setUserDetail] = useState<{ referral_count: number; transactions: Transaction[] } | null>(null);

  const params = new URLSearchParams({ page: String(page), limit: '20' });
  if (search) params.set('search', search);

  const { data, isLoading: loading } = useSWRFetch(`/api/v1/admin/users?${params}`);
  const users: UserSummary[] = data?.users || [];
  const total = data?.total || 0;

  const openUser = async (u: UserSummary) => {
    setSelectedUser(u);
    setUserDetail(null);
    const res = await apiFetch(`/api/v1/admin/users/${u.telegram_id}`);
    if (res.ok) {
      const data = await res.json();
      setUserDetail(data);
    }
  };

  const pages = Math.max(1, Math.ceil(total / 20));

  return (
    <div>
      {/* Search Bar */}
      <div className="flex gap-2 mb-5">
        <div className="flex-1 relative">
          <FaUsers className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-muted text-xs" />
          <input
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { setSearch(searchInput); setPage(1); } }}
            placeholder="Search name, username or Telegram ID…"
            className="w-full pl-9 pr-4 bg-[#0A0A0A]/60 backdrop-blur-xl border border-purple-500/30 rounded-xl py-2.5 text-white text-sm outline-none focus:border-purple-500 focus:shadow-[0_0_15px_rgba(168,85,247,0.3)] transition-all"
          />
        </div>
        <button
          onClick={() => { setSearch(searchInput); setPage(1); }}
          className="action-button px-5 py-2.5 text-xs"
        >Search</button>
        {search && (
          <button
            onClick={() => { setSearch(''); setSearchInput(''); setPage(1); }}
            className="glass-button px-4 py-2.5 text-xs font-bold"
          >✕ Clear</button>
        )}
      </div>

      {/* Count + Loading indicator */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] text-brand-muted">
          {loading ? 'Loading…' : total > 0 ? `${fmt(total)} users found` : 'No results'}
        </p>
        {loading && <div className="w-3.5 h-3.5 rounded-full border-2 border-purple-500/30 border-t-purple-500 animate-spin" />}
      </div>

      {/* Table */}
      <div className="premium-neon-card overflow-x-auto p-1">
        <table className="w-full text-xs text-left border-collapse">
          <thead>
            <tr className="border-b border-white/10">
              {['User', 'ELO', 'W/L/D', 'Balance', 'Level', 'Status', ''].map(h => (
                <th key={h} className="px-4 py-3 text-brand-muted font-bold text-[10px] uppercase tracking-wider whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && users.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-12 text-brand-muted">
                <div className="w-6 h-6 rounded-full border-2 border-purple-500/30 border-t-purple-500 animate-spin mx-auto mb-2" />
                Loading users…
              </td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-12 text-brand-muted">No users found</td></tr>
            ) : users.map(u => (
              <tr
                key={u.telegram_id}
                className="border-b border-white/5 hover:bg-purple-500/5 transition-colors cursor-pointer group"
                onClick={() => openUser(u)}
              >
                <td className="px-4 py-3">
                  <div className="font-bold text-white group-hover:text-purple-300 transition-colors">{u.first_name} {u.last_name || ''}</div>
                  <div className="text-[10px] text-brand-muted mt-0.5">{u.username ? `@${u.username}` : `#${u.telegram_id}`}</div>
                </td>
                <td className="px-4 py-3">
                  <span className="font-black text-purple-400 text-sm">{u.elo}</span>
                </td>
                <td className="px-4 py-3 text-brand-muted">
                  <span className="text-green-500">{u.wins}</span>/<span className="text-red-500">{u.losses}</span>/<span className="text-blue-400">{u.draws}</span>
                </td>
                <td className={`px-4 py-3 font-bold ${u.balance_cents > 0 ? 'text-green-400' : 'text-brand-muted'}`}>
                  {cents(u.balance_cents)}
                </td>
                <td className="px-4 py-3">
                  <span className="bg-purple-500/15 text-purple-400 rounded-lg px-2.5 py-1 text-[10px] font-black border border-purple-500/20">L{u.level}</span>
                </td>
                <td className="px-4 py-3">
                  {u.is_premium ? (
                    <span className="bg-amber-500/15 text-amber-400 rounded-lg px-2.5 py-1 text-[10px] font-black border border-amber-500/20">⭐ {u.premium_tier || 'PRO'}</span>
                  ) : (
                    <span className="text-brand-muted text-[10px]">Standard</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className="text-purple-400/60 group-hover:text-purple-400 text-[11px] font-bold transition-colors">→</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination page={page} pages={pages} onPage={setPage} />

      {/* User Detail Modal */}
      <AnimatePresence>
        {selectedUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-4"
            onClick={() => { setSelectedUser(null); setUserDetail(null); }}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={e => e.stopPropagation()}
              className="premium-neon-card p-6 w-full max-w-2xl max-h-[85vh] overflow-y-auto relative"
            >
              {/* Modal Header */}
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-xl font-black text-purple-400">
                    {selectedUser.first_name[0]}
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-white">{selectedUser.first_name} {selectedUser.last_name || ''}</h2>
                    <p className="text-[11px] text-brand-muted">
                      {selectedUser.username ? `@${selectedUser.username} · ` : ''}{selectedUser.telegram_id}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => { setSelectedUser(null); setUserDetail(null); }}
                  className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-brand-muted hover:text-white transition-all text-lg leading-none"
                >
                  ✕
                </button>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                {[
                  { k: 'ELO', v: selectedUser.elo, color: '#8b5cf6' },
                  { k: 'Level', v: `L${selectedUser.level}`, color: '#a855f7' },
                  { k: 'XP', v: fmt(selectedUser.xp), color: '#f59e0b' },
                  { k: 'Balance', v: cents(selectedUser.balance_cents), color: '#22c55e' },
                  { k: 'Games', v: fmt(selectedUser.games_played), color: '#3b82f6' },
                  { k: 'Record', v: `${selectedUser.wins}W/${selectedUser.losses}L/${selectedUser.draws}D`, color: '#ec4899' },
                  { k: 'Status', v: selectedUser.is_premium ? `⭐ ${selectedUser.premium_tier || 'PRO'}` : 'Standard', color: '#f59e0b' },
                  { k: 'Referrals', v: userDetail ? fmt(userDetail.referral_count) : '…', color: '#14b8a6' },
                ].map(({ k, v, color }) => (
                  <div key={k} className="rounded-xl p-3 border border-white/5 bg-white/3 hover:border-white/10 transition-all" style={{ background: `${color}08` }}>
                    <p className="text-[10px] uppercase tracking-[0.08em] mb-1 font-bold" style={{ color }}>{k}</p>
                    <p className="text-sm font-black text-white truncate" title={String(v)}>{v}</p>
                  </div>
                ))}
              </div>

              {/* Wallet & Referral */}
              {(selectedUser.wallet_address || selectedUser.referral_code) && (
                <div className="flex gap-3 mb-5 flex-wrap">
                  {selectedUser.wallet_address && (
                    <div className="flex-1 min-w-[180px] bg-white/3 border border-white/5 rounded-xl p-3">
                      <p className="text-[10px] text-brand-muted uppercase tracking-wider mb-1">Wallet</p>
                      <p className="text-[11px] font-mono text-white/80 truncate">{selectedUser.wallet_address}</p>
                    </div>
                  )}
                  {selectedUser.referral_code && (
                    <div className="bg-white/3 border border-white/5 rounded-xl p-3">
                      <p className="text-[10px] text-brand-muted uppercase tracking-wider mb-1">Referral Code</p>
                      <p className="text-[11px] font-mono text-purple-400 font-bold">{selectedUser.referral_code}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Recent Transactions */}
              {userDetail && userDetail.transactions.length > 0 && (
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.1em] text-brand-muted mb-3">Recent Transactions</p>
                  <div className="space-y-1">
                    {userDetail.transactions.slice(0, 8).map(tx => (
                      <div key={tx.id} className="flex justify-between items-center py-2 px-3 rounded-lg bg-white/3 hover:bg-white/5 transition-colors">
                        <div className="flex items-center gap-2.5">
                          <span style={{
                            background: `${TX_COLORS[tx.type] || '#6b7280'}15`,
                            color: TX_COLORS[tx.type] || '#6b7280',
                            borderColor: `${TX_COLORS[tx.type] || '#6b7280'}30`,
                          }} className="rounded-lg px-2.5 py-1 text-[10px] font-bold border">
                            {tx.type.replace('_', ' ')}
                          </span>
                          <span className="text-[10px] text-brand-muted">{formatDate(tx.created_at)}</span>
                        </div>
                        <span className="text-xs font-bold" style={{ color: tx.amount_cents >= 0 ? '#22c55e' : '#f97316' }}>
                          {tx.amount_cents >= 0 ? '+' : ''}{cents(tx.amount_cents)}
                        </span>
                      </div>
                    ))}
                  </div>
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
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const params = new URLSearchParams({ page: String(page), limit: '25' });
  if (typeFilter) params.set('type', typeFilter);
  if (statusFilter) params.set('status', statusFilter);

  const { data, isLoading: loading } = useSWRFetch(`/api/v1/admin/transactions?${params}`);
  const txs: Transaction[] = data?.transactions || [];
  const total = data?.total || 0;

  const pages = Math.max(1, Math.ceil(total / 25));
  const TX_TYPES = ['deposit', 'withdrawal', 'game_wager', 'game_win', 'game_rake', 'referral_commission', 'subscription', 'deposit_fee', 'chargeback', 'refund'];
  const STATUSES = ['completed', 'pending', 'failed'];

  return (
    <div>
      {/* Filter Pills */}
      <div className="flex flex-wrap gap-2 mb-5">
        <button
          onClick={() => { setTypeFilter(''); setPage(1); }}
          className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all border ${
            !typeFilter ? 'bg-purple-600 text-white border-purple-500' : 'bg-white/5 text-brand-muted border-white/10 hover:border-white/20'
          }`}
        >All Types</button>
        {TX_TYPES.map(t => (
          <button
            key={t}
            onClick={() => { setTypeFilter(typeFilter === t ? '' : t); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all border ${
              typeFilter === t
                ? 'text-white border-transparent'
                : 'bg-white/5 text-brand-muted border-white/10 hover:border-white/20'
            }`}
            style={typeFilter === t ? { background: TX_COLORS[t] || '#6b7280', borderColor: TX_COLORS[t] } : {}}
          >{t.replace('_', ' ')}</button>
        ))}
        <div className="w-px bg-white/10 self-stretch mx-1" />
        {STATUSES.map(s => (
          <button
            key={s}
            onClick={() => { setStatusFilter(statusFilter === s ? '' : s); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all border ${
              statusFilter === s
                ? 'text-white border-transparent'
                : 'bg-white/5 text-brand-muted border-white/10 hover:border-white/20'
            }`}
            style={statusFilter === s ? { background: STATUS_COLORS[s] || '#6b7280', borderColor: STATUS_COLORS[s] } : {}}
          >{s}</button>
        ))}
        <span className="ml-auto text-[11px] text-brand-muted self-center">
          {total > 0 ? `${fmt(total)} records` : ''}
        </span>
      </div>

      {/* Table */}
      <div className="premium-neon-card overflow-x-auto p-1">
        <table className="w-full text-xs text-left border-collapse">
          <thead>
            <tr className="border-b border-white/10">
              {['#', 'User', 'Type', 'Amount', 'Fee', 'Status', 'Reference', 'Date'].map(h => (
                <th key={h} className="px-4 py-3 text-brand-muted font-bold text-[10px] uppercase tracking-wider whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && txs.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-12 text-brand-muted">
                <div className="w-6 h-6 rounded-full border-2 border-purple-500/30 border-t-purple-500 animate-spin mx-auto mb-2" />
                Loading…
              </td></tr>
            ) : txs.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-12 text-brand-muted">No transactions</td></tr>
            ) : txs.map(tx => (
              <tr key={tx.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                <td className="px-4 py-2.5 text-brand-muted font-mono text-[10px]">{tx.id}</td>
                <td className="px-4 py-2.5 font-mono text-[10px] text-brand-muted">{tx.user_id}</td>
                <td className="px-4 py-2.5">
                  <span style={{
                    background: `${TX_COLORS[tx.type] || '#6b7280'}18`,
                    color: TX_COLORS[tx.type] || '#6b7280',
                    borderColor: `${TX_COLORS[tx.type] || '#6b7280'}30`,
                  }} className="rounded-lg px-2.5 py-1 text-[10px] font-bold border">
                    {tx.type.replace('_', ' ')}
                  </span>
                </td>
                <td className={`px-4 py-2.5 font-bold tabular-nums ${tx.amount_cents >= 0 ? 'text-green-400' : 'text-orange-400'}`}>
                  {tx.amount_cents >= 0 ? '+' : ''}{cents(tx.amount_cents)}
                </td>
                <td className="px-4 py-2.5 text-brand-muted tabular-nums">{tx.fee_cents > 0 ? cents(tx.fee_cents) : '—'}</td>
                <td className="px-4 py-2.5">
                  <span style={{
                    background: `${STATUS_COLORS[tx.status] || '#6b7280'}18`,
                    color: STATUS_COLORS[tx.status] || '#6b7280',
                    borderColor: `${STATUS_COLORS[tx.status] || '#6b7280'}30`,
                  }} className="rounded-lg px-2.5 py-1 text-[10px] font-black border">
                    {tx.status}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-brand-muted font-mono text-[10px] max-w-[100px] truncate">
                  {tx.reference_id ? (
                    tx.reference_id.length > 20
                      ? <a href={`https://tonviewer.com/transaction/${tx.reference_id}`} target="_blank" rel="noreferrer" className="text-purple-400 hover:text-purple-300 transition-colors" onClick={e => e.stopPropagation()}>
                          {tx.reference_id.slice(0, 10)}…
                        </a>
                      : tx.reference_id
                  ) : '—'}
                </td>
                <td className="px-4 py-2.5 text-brand-muted whitespace-nowrap text-[10px]">{formatDate(tx.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination page={page} pages={pages} onPage={setPage} />
    </div>
  );
}

// ─── Games Tab ────────────────────────────────────────────────────────────────

function GamesTab() {
  const [page, setPage] = useState(1);
  const { data, isLoading: loading } = useSWRFetch(`/api/v1/admin/games?page=${page}&limit=20`);
  const games: Game[] = data?.games || [];
  const total = data?.total || 0;

  const pages = Math.max(1, Math.ceil(total / 20));

  const EloDelta = ({ before, after }: { before: number; after: number }) => {
    const delta = after - before;
    return (
      <span className={`text-[10px] font-bold ${ delta > 0 ? 'text-green-400' : delta < 0 ? 'text-red-400' : 'text-brand-muted' }`}>
        {delta > 0 ? '+' : ''}{delta}
      </span>
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-[11px] text-brand-muted">
          {total > 0 ? `${fmt(total)} online games total` : 'No games yet'}
        </p>
        {loading && <div className="w-3.5 h-3.5 rounded-full border-2 border-purple-500/30 border-t-purple-500 animate-spin" />}
      </div>
      <div className="premium-neon-card overflow-x-auto p-1">
        <table className="w-full text-xs text-left border-collapse">
          <thead>
            <tr className="border-b border-white/10">
              {['Game', 'White', 'Black', 'Result', 'Moves', 'Duration', 'Wager', 'Date'].map(h => (
                <th key={h} className="px-4 py-3 text-brand-muted font-bold text-[10px] uppercase tracking-wider whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && games.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-12 text-brand-muted">
                <div className="w-6 h-6 rounded-full border-2 border-purple-500/30 border-t-purple-500 animate-spin mx-auto mb-2" />
                Loading games…
              </td></tr>
            ) : games.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-12 text-brand-muted">No games found</td></tr>
            ) : games.map(g => (
              <tr key={g.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                <td className="px-4 py-2.5 text-brand-muted font-mono text-[10px]">{g.game_id?.slice(0, 8)}…</td>
                <td className="px-4 py-2.5">
                  <div className="font-mono text-[11px]">{g.white_player_id}</div>
                  <div className="text-[10px] text-brand-muted mt-0.5">
                    {g.white_elo_before} → {g.white_elo_after} <EloDelta before={g.white_elo_before} after={g.white_elo_after} />
                  </div>
                </td>
                <td className="px-4 py-2.5">
                  <div className="font-mono text-[11px]">{g.black_player_id}</div>
                  <div className="text-[10px] text-brand-muted mt-0.5">
                    {g.black_elo_before} → {g.black_elo_after} <EloDelta before={g.black_elo_before} after={g.black_elo_after} />
                  </div>
                </td>
                <td className="px-4 py-2.5">
                  <span className={`text-[11px] font-bold ${
                    !g.winner ? 'text-blue-400' : g.winner === 'w' ? 'text-white' : 'text-brand-muted'
                  }`}>
                    {!g.winner ? '🤝 Draw' : g.winner === 'w' ? '⬜ White' : '⬛ Black'}
                  </span>
                  {g.result_type && <div className="text-[10px] text-brand-muted capitalize mt-0.5">{g.result_type.replace('_', ' ')}</div>}
                </td>
                <td className="px-4 py-2.5 tabular-nums">{g.total_moves}</td>
                <td className="px-4 py-2.5 text-brand-muted tabular-nums">
                  {g.duration_seconds ? `${Math.floor(g.duration_seconds / 60)}m ${g.duration_seconds % 60}s` : '—'}
                </td>
                <td className={`px-4 py-2.5 tabular-nums ${g.bid_amount_cents > 0 ? 'text-green-400 font-bold' : 'text-brand-muted'}`}>
                  {g.bid_amount_cents > 0 ? cents(g.bid_amount_cents) : '—'}
                </td>
                <td className="px-4 py-2.5 text-brand-muted whitespace-nowrap text-[10px]">{formatDate(g.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination page={page} pages={pages} onPage={setPage} />
    </div>
  );
}

// ─── Broadcasts Tab ───────────────────────────────────────────────────────────

function BroadcastsTab() {
  const { data, isLoading: loading, mutate: loadBroadcasts } = useSWRFetch('/api/v1/admin/broadcasts?limit=20');
  const broadcasts: Broadcast[] = data?.broadcasts || [];

  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');
  const [audience, setAudience] = useState('all');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

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
    ledger_audit?: { 
      status: string; 
      mismatches_count: number | null; 
      detail: string;
      mismatches?: { telegram_id: number; first_name: string; balance: number; ledger_sum: number }[];
    };
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
  const { data, isLoading: loading, mutate: fetchStatus } = useSWRFetch('/api/v1/admin/system/status', {
    refreshInterval: 60000 
  });
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
            onClick={() => fetchStatus()}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest bg-purple-500/20 border border-purple-500/40 text-purple-300 hover:bg-purple-500/30 transition-all disabled:opacity-50"
          >
            <FaArrowsRotate className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
      </div>

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

          {/* Ledger Reconciliation */}
          <SysCard
            icon={<FaScaleBalanced />}
            title="Ledger Reconciliation"
            status={sys.ledger_audit?.status ?? 'unknown'}
            rows={[
              { label: 'Audit Status', value: sys.ledger_audit?.status === 'online' ? '✅ Healthy (0 Mismatches)' : '⚠️ Anomaly Detected' },
              { label: 'Mismatches Count', value: sys.ledger_audit?.mismatches_count != null ? sys.ledger_audit.mismatches_count.toString() : '—' },
              { label: 'Detail', value: sys.ledger_audit?.detail ?? '—' },
            ]}
          />
        </div>
      )}

      {sys?.ledger_audit?.mismatches && sys.ledger_audit.mismatches.length > 0 && (
        <div className="premium-neon-card p-6 border-amber-500/30 bg-amber-950/5 mt-6">
          <h3 className="text-sm font-black mb-4 uppercase tracking-widest text-amber-500 flex items-center gap-2">
            ⚠️ Ledger Anomalies Details
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="px-4 py-2 text-brand-muted uppercase tracking-wider font-bold">User</th>
                  <th className="px-4 py-2 text-brand-muted uppercase tracking-wider font-bold">Telegram ID</th>
                  <th className="px-4 py-2 text-brand-muted uppercase tracking-wider font-bold text-right">Profile Balance</th>
                  <th className="px-4 py-2 text-brand-muted uppercase tracking-wider font-bold text-right">Ledger Sum</th>
                  <th className="px-4 py-2 text-brand-muted uppercase tracking-wider font-bold text-right">Difference</th>
                </tr>
              </thead>
              <tbody>
                {sys.ledger_audit.mismatches.map((m: any, i: number) => {
                  const diff = m.balance - m.ledger_sum;
                  return (
                    <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="px-4 py-2.5 font-bold text-white">{m.first_name}</td>
                      <td className="px-4 py-2.5 font-mono text-[11px] text-brand-muted">{m.telegram_id}</td>
                      <td className="px-4 py-2.5 font-mono text-right tabular-nums text-white">{cents(m.balance)}</td>
                      <td className="px-4 py-2.5 font-mono text-right tabular-nums text-white">{cents(m.ledger_sum)}</td>
                      <td className="px-4 py-2.5 font-mono text-right tabular-nums text-amber-400 font-bold">
                        {diff > 0 ? '+' : ''}{cents(diff)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Admin Page ──────────────────────────────────────────────────────────

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<Tab>('Dashboard');
  const { data: stats, isLoading: loading, error } = useSWRFetch('/api/v1/admin/stats');
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    if (error && error.status === 403) {
      setAccessDenied(true);
    }
  }, [error]);

  if (accessDenied) return <AccessDenied />;

  return (
    <LayoutWrapper className="justify-start pt-6 pb-32 w-full">
    <div className="relative w-full min-h-screen overflow-hidden text-brand-primary font-sans pb-[120px]"
      style={{
        backgroundColor: '#050505',
        backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px)',
        backgroundSize: '24px 24px'
      }}
    >
      {/* Ambient background glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[80%] h-[60%] bg-purple-900/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[50%] bg-amber-900/10 blur-[100px] rounded-full pointer-events-none" />
      
      <div className="relative z-10 w-full max-w-[1100px] mx-auto px-4 pt-8">

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
        <div className="flex gap-2 justify-start md:justify-center mb-10 overflow-x-auto scrollbar-none w-full max-w-3xl mx-auto px-4">
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
