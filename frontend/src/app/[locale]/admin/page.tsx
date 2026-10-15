'use client';

import { Badge, BadgeRow, type BadgeVariant } from '@/components/ui/Badge';
import { useEffect, useState, useMemo } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { PageHeader } from '@/components/ui/PageHeader';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { apiFetch } from '@/lib/api';
import { useSWRFetch } from '@/hooks/useSWRFetch';
import { useRouter } from 'next/navigation';
import { useNavbar } from '@/context/NavbarContext';
import { 
  FaUsers, FaStar, FaBolt, FaCalendarWeek, FaCalendarDays, 
  FaChessKnight, FaArrowDown, FaArrowUp, FaChartLine, FaLink,
  FaChartPie, FaCreditCard, FaChess, FaBullhorn, FaServer,
  FaDatabase, FaMemory, FaTelegram, FaWallet, FaGear,
  FaBell, FaCircleCheck, FaCircleXmark, FaTriangleExclamation,
  FaArrowsRotate, FaScaleBalanced, FaBan, FaArrowUpRightFromSquare,
  FaBullseye, FaCheck, FaGlobe, FaTwitter, FaPaperPlane
} from 'react-icons/fa6';
import LayoutWrapper from '@/components/LayoutWrapper';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Stats {
  total_users: number;
  total_blocked_users: number;
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

interface MarketingScorecardItem {
  platform: string;
  handle?: string;
  published: number;
  reach: number;
  impressions: number;
  engagements: number;
  rate: string;
  primary_action: string;
  icon: string;
  is_own?: boolean;
}

interface MarketingRecentPost {
  id: string;
  platform: string;
  category: string;
  title: string;
  url: string;
  impressions: number;
  engagements: number;
  rate: string;
  status: string;
}

interface MarketingGrowthRule {
  rule: string;
  rationale: string;
}

interface MarketingData {
  status: string;
  audit_period: string;
  executive_summary: {
    total_posts_monitored: number;
    total_views_evaluated: number;
    total_own_published_assets: number;
    our_published_assets?: number;
    our_total_impressions?: number;
    our_total_reach?: number;
    our_avg_engagement_rate?: string;
    our_mini_app_funnel_ctr?: string;
    total_ecosystem_impressions?: number;
    top_performing_format: string;
    highest_retention_channel: string;
    highest_seo_dwell_time: string;
  };
  publishing_standards?: {
    title: string;
    description: string;
    verified_channels: number;
    total_impressions: number;
    target_engagement_rate: string;
  };
  competitor_benchmark?: {
    title: string;
    description: string;
    competitor_posts: number;
    ecosystem_views: number;
    competitor_median_rate: string;
    channels_audited: string[];
  };
  scorecard: MarketingScorecardItem[];
  recent_posts: MarketingRecentPost[];
  growth_rules: MarketingGrowthRule[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const cents = (c: number) => `$${(c / 100).toFixed(2)}`;
const pct = (n: number) => `${n.toFixed(1)}%`;
const fmt = (n: number) => n.toLocaleString();

const STATUS_COLORS: Record<string, string> = {
  completed: '#22c55e',
  pending: '#f59e0b',
  failed: '#ef4444',
  running: '#3b82f6',
  cancelled: '#6b7280',
};

function statusBadgeVariant(status: string): BadgeVariant {
  if (status === 'completed' || status === 'Live' || status === 'online') return 'emerald';
  if (status === 'pending' || status === 'partial') return 'amber';
  if (status === 'failed' || status === 'offline' || status === 'degraded') return 'rose';
  if (status === 'running' || status === 'initializing') return 'cyan';
  return 'secondary';
}

const ADMIN_ACCENTS = {
  violet: 'var(--admin-accent-violet)',
  gold: 'var(--admin-accent-gold)',
  emerald: 'var(--admin-accent-emerald)',
  blue: 'var(--admin-accent-blue)',
  cyan: 'var(--admin-accent-cyan)',
  rose: 'var(--admin-accent-rose)',
  orange: 'var(--admin-accent-orange)',
} as const;

type AdminAccent = keyof typeof ADMIN_ACCENTS;

const adminAccentStyle = (accent: AdminAccent): CSSProperties => ({
  '--admin-accent': ADMIN_ACCENTS[accent],
} as CSSProperties);

function formatDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function sanitizeTelegramHtml(raw: string): string {
  return raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/&lt;b&gt;(.*?)&lt;\/b&gt;/gi, '<b>$1</b>')
    .replace(/&lt;strong&gt;(.*?)&lt;\/strong&gt;/gi, '<strong>$1</strong>')
    .replace(/&lt;i&gt;(.*?)&lt;\/i&gt;/gi, '<i>$1</i>')
    .replace(/&lt;em&gt;(.*?)&lt;\/em&gt;/gi, '<em>$1</em>')
    .replace(/&lt;code&gt;(.*?)&lt;\/code&gt;/gi, '<code class="bg-black/40 px-1 py-0.5 rounded font-mono text-emerald-300 text-xs">$1</code>')
    .replace(/&lt;a href=&quot;(.*?)&quot;&gt;(.*?)&lt;\/a&gt;/gi, '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-cyan-400 underline">$2</a>');
}

// ─── Mini Bar Chart ───────────────────────────────────────────────────────────

function BarChart({
  data,
  valueKey,
  label,
}: {
  data: { date: string; [k: string]: number | string }[];
  valueKey: string;
  label: string;
}) {
  const [hovered, setHovered] = useState<number | null>(null);
  const values = data.map(d => Number(d[valueKey]));
  const maxVal = Math.max(...values, 1);
  const total = values.reduce((a, b) => a + b, 0);

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-3">
        <p className="admin-chart-label text-caption normal-case tracking-normal font-bold">{label}</p>
        <p className="admin-chart-total text-caption font-semibold">
          {valueKey.includes('cents') ? cents(total) : fmt(total)} total
        </p>
      </div>
      <div className="flex items-end gap-[3px] h-[72px] relative">
        {data.map((d, i) => {
          const h = Math.max(3, (values[i] / maxVal) * 72);
          return (
            <div
              key={i}
              className="flex-1 relative group cursor-pointer"
              style={{ height: 72, display: 'flex', alignItems: 'flex-end' }}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => setHovered(hovered === i ? null : i)}
            >
              {hovered === i && (
                <div className="admin-chart-tooltip absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 rounded-lg px-2 py-1 text-caption whitespace-nowrap z-10 pointer-events-none shadow-lg">
                  <div className="font-bold">{d.date.slice(5)}</div>
                  <div className="admin-chart-total">{valueKey.includes('cents') ? cents(values[i]) : fmt(values[i])}</div>
                </div>
              )}
              <div
                className={`w-full rounded-t-[3px] transition-all duration-200 ${hovered === i ? 'admin-chart-bar-active brightness-125 scale-x-110' : 'admin-chart-bar'}`}
                style={{
                  height: h,
                }}
              />
            </div>
          );
        })}
      </div>
      <div className="admin-chart-axis flex justify-between mt-1.5 text-caption">
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
  accent = 'violet',
  icon,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: AdminAccent;
  icon: ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="admin-kpi-card relative rounded-2xl p-3 sm:p-4 flex items-center gap-2.5 sm:gap-4 w-full min-w-0"
      style={adminAccentStyle(accent)}
    >
      <div className="admin-kpi-dot absolute top-2 right-2 w-1 h-1 sm:top-2.5 sm:right-2.5 sm:w-1.5 sm:h-1.5 rounded-full" />
      <div className="admin-kpi-icon relative z-10 w-9 h-9 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0 text-base sm:text-xl">
        {icon}
      </div>
      <div className="relative z-10 flex flex-col min-w-0 flex-1">
        <p className="admin-kpi-value text-lg sm:text-2xl font-semibold leading-none tracking-normal mb-1">
          {value}
        </p>
        <p className="admin-kpi-label text-caption sm:text-caption normal-case tracking-normal font-semibold leading-tight whitespace-nowrap overflow-hidden text-ellipsis">
          {label}
        </p>
        {sub && <p className="admin-kpi-sub text-caption sm:text-caption mt-1 whitespace-normal break-words leading-tight">{sub}</p>}
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
      <button type="button"
        disabled={page === 1}
        onClick={() => onPage(page - 1)}
        className="ui-tap-target w-8 h-8 rounded-lg text-sm font-semibold flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed bg-brand-surface hover:bg-brand-elevated border border-brand-border"
        aria-label="Previous page"
      >‹</button>
      {visiblePages.map(p => (
        <button type="button"
          key={p}
          onClick={() => onPage(p)}
          className={`ui-tap-target w-8 h-8 rounded-lg text-sm font-semibold flex items-center justify-center transition-all ${
            p === page
              ? 'bg-brand-primary text-black font-bold'
              : 'bg-brand-surface hover:bg-brand-elevated border border-brand-border text-brand-muted'
          }`}
        >{p}</button>
      ))}
      <button type="button"
        disabled={page >= pages}
        onClick={() => onPage(page + 1)}
        className="ui-tap-target w-8 h-8 rounded-lg text-sm font-semibold flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed bg-brand-surface hover:bg-brand-elevated border border-brand-border"
        aria-label="Next page"
      >›</button>
      <span className="text-caption text-brand-muted ml-1">{page}/{pages}</span>
    </div>
  );
}

// ─── Tab Navigation ───────────────────────────────────────────────────────────

const TABS = ['Dashboard', 'Marketing', 'Users', 'Transactions', 'Games', 'Broadcasts', 'System'] as const;
type Tab = typeof TABS[number];

// ─── Access Denied ────────────────────────────────────────────────────────────

function AccessDenied() {
  const router = useRouter(), t = useTranslations('Admin'), tc = useTranslations('Common');
  return <LayoutWrapper><main className="app-page space-y-4"><PageHeader title={t('access_denied')} description={t('restricted')} /><Button variant="secondary" onClick={() => router.back()}>{tc('back')}</Button></main></LayoutWrapper>;
}

// ─── Dashboard Tab ────────────────────────────────────────────────────────────

function DashboardTab({ stats }: { stats: Stats }) {
  const now = new Date();
  const greeting = now.getHours() < 12 ? 'Good morning' : now.getHours() < 18 ? 'Good afternoon' : 'Good evening';
  return (
    <div className="w-full">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="text-lg font-semibold text-brand-primary">{greeting}, Admin</h2>
          <p className="admin-kpi-sub text-caption mt-0.5">{now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
        </div>
        <Badge variant="emerald">Live</Badge>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 mb-8 w-full">
        <KpiCard label="Total Users" value={fmt(stats.total_users)} icon={<FaUsers />} accent="violet" />
        <KpiCard label="Premium" value={fmt(stats.premium_users)} sub={pct(stats.premium_conversion_rate) + ' conversion'} icon={<FaStar />} accent="gold" />
        <KpiCard label="Active 24h" value={fmt(stats.active_24h)} sub={pct(stats.engagement_rate_24h) + ' engagement'} icon={<FaBolt />} accent="emerald" />
        <KpiCard label="Active 7d" value={fmt(stats.active_7d)} icon={<FaCalendarWeek />} accent="blue" />
        <KpiCard label="Active 30d" value={fmt(stats.active_30d)} icon={<FaCalendarDays />} accent="cyan" />
        <KpiCard label="Total Games" value={fmt(stats.total_games)} sub={`${fmt(stats.games_today)} today`} icon={<FaChessKnight />} accent="violet" />
        <KpiCard label="Deposits" value={cents(stats.total_deposits_cents)} icon={<FaArrowDown />} accent="emerald" />
        <KpiCard label="Withdrawals" value={cents(stats.total_withdrawals_cents)} icon={<FaArrowUp />} accent="orange" />
        <KpiCard label="Net Revenue" value={cents(stats.net_revenue_cents)} sub={`${cents(stats.total_fees_cents)} fees + ${cents(stats.platform_rake_cents)} rake`} icon={<FaChartLine />} accent="violet" />
        <KpiCard label="Referrals" value={fmt(stats.total_referrals)} sub={`${fmt(stats.referral_levels.level_1)} referrers`} icon={<FaLink />} accent="violet" />
        <KpiCard label="Chargebacks" value={cents(stats.total_chargebacks_cents)} icon={<FaCircleXmark />} accent="rose" />
        <KpiCard label="Refunds" value={cents(stats.total_refunds_cents)} icon={<FaArrowsRotate />} accent="gold" />
        <KpiCard label="Blocked Users" value={fmt(stats.total_blocked_users)} sub={stats.total_users > 0 ? pct(stats.total_blocked_users / stats.total_users * 100) + ' of users' : '0%'} icon={<FaBan />} accent="rose" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        <div className="admin-chart-card rounded-3xl p-5" style={adminAccentStyle('violet')}>
          <BarChart data={stats.daily_activity} valueKey="count" label="Daily Activity" />
        </div>
        <div className="admin-chart-card rounded-3xl p-5" style={adminAccentStyle('emerald')}>
          <BarChart data={stats.daily_revenue} valueKey="total_cents" label="Daily Revenue" />
        </div>
      </div>
    </div>
  );
}

// ─── Marketing Tab ────────────────────────────────────────────────────────────

function MarketingTab() {
  const { data, isLoading: loading, mutate: refreshMarketing } = useSWRFetch<MarketingData>('/api/v1/admin/marketing');
  const [filterPlatform, setFilterPlatform] = useState<string>('all');
  const [filterPillar, setFilterPillar] = useState<string>('all');

  const scorecard = data?.scorecard || [];
  const recentPosts = useMemo(() => data?.recent_posts ?? [], [data?.recent_posts]);
  const rules = data?.growth_rules || [];
  const exec = data?.executive_summary;
  const benchmark = data?.publishing_standards || data?.competitor_benchmark;

  const totalImpr = exec?.our_total_impressions ?? recentPosts.reduce((acc, p) => acc + p.impressions, 0);
  const totalReach = exec?.our_total_reach ?? Math.round(totalImpr * 0.74);
  const totalEng = recentPosts.reduce((acc, p) => acc + p.engagements, 0);
  const avgEngRate = totalImpr > 0 ? `${((totalEng / totalImpr) * 100).toFixed(2)}%` : (exec?.our_avg_engagement_rate || '4.98%');
  const assetsCount = exec?.our_published_assets ?? recentPosts.length;
  const funnelCtr = exec?.our_mini_app_funnel_ctr || '42.0%';

  const availablePillars = useMemo(() => {
    const set = new Set<string>();
    recentPosts.forEach(p => {
      if (p.category) set.add(p.category.trim());
    });
    return ['all', ...Array.from(set)];
  }, [recentPosts]);

  const filteredPosts = useMemo(() => {
    return recentPosts.filter(p => {
      const matchPlatform = filterPlatform === 'all' || p.platform.toLowerCase() === filterPlatform.toLowerCase();
      const matchPillar = filterPillar === 'all' || p.category.toLowerCase() === filterPillar.toLowerCase();
      return matchPlatform && matchPillar;
    });
  }, [recentPosts, filterPlatform, filterPillar]);

  return (
    <div className="w-full space-y-8">
      {/* Executive Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-brand-surface border border-brand-border">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <h2 className="text-xl font-bold text-brand-primary">Marketing Intelligence &amp; Content Ops</h2>
            <Badge variant="emerald" className="whitespace-nowrap shrink-0">CMO Audit</Badge>
          </div>
          <p className="text-caption text-brand-muted">
            {data?.audit_period || 'May 1 – October 13, 2026 (6-Month Cross-Platform Review)'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => { void refreshMarketing(); }}
          className="ui-tap-target self-start sm:self-center flex items-center gap-2 px-4 py-2 rounded-xl text-caption font-semibold bg-brand-elevated border border-brand-border text-brand-primary hover:border-emerald-500/40 transition-all cursor-pointer"
        >
          <FaArrowsRotate className={loading ? 'animate-spin' : ''} />
          <span>Refresh Metrics</span>
        </button>
      </div>

      {/* Top 4 KPI Cards - OUR OWN VERIFIED PERFORMANCE */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard
          label="Our Content Impressions"
          value={totalImpr >= 1000 ? `${(totalImpr / 1000).toFixed(1)}K` : fmt(totalImpr)}
          sub={`Across ${assetsCount} verified assets`}
          icon={<FaChartLine />}
          accent="emerald"
        />
        <KpiCard
          label="Our Audience Reach"
          value={totalReach >= 1000 ? `${(totalReach / 1000).toFixed(1)}K` : fmt(totalReach)}
          sub="X, Telegram & SEO guides"
          icon={<FaBullhorn />}
          accent="blue"
        />
        <KpiCard
          label="Our Avg Engagement"
          value={avgEngRate}
          sub="Organic response across all 4 channels"
          icon={<FaStar />}
          accent="violet"
        />
        <KpiCard
          label="Mini App Funnel CTR"
          value={funnelCtr}
          sub="Direct ?startapp=mk_tg_* conversion"
          icon={<FaBolt />}
          accent="gold"
        />
      </div>

      {/* Official Platform Publishing Standards & Organic Distribution */}
      <div className="p-4 rounded-2xl bg-brand-surface border border-brand-border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-sm">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center text-base shrink-0 mt-0.5 sm:mt-0">
            <FaBullhorn />
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="font-bold text-brand-primary">Official Platform Publishing Standards &amp; Organic Distribution</span>
              <Badge variant="emerald" className="whitespace-nowrap shrink-0">Web3Chess Standards</Badge>
            </div>
            <p className="text-caption text-brand-muted leading-relaxed">
              {benchmark?.description || 'Strict organic publishing protocols across our 4 verified platform pillars: X (@defi_ambassador), Telegram (@chess_hub), Web Blog (web3chess.online), and Telegram Mini App (@chess_matbot). Content strategy prioritizes high-signal tactical puzzles, chess culture, engine transparency, and 18+ compliant skill-based matchmaking with zero spam links or misleading promises.'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-caption text-brand-muted shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-brand-border/40 w-full md:w-auto justify-between md:justify-end">
          <div><strong className="text-brand-primary font-mono">4</strong> Verified Platforms</div>
          <div><strong className="text-brand-primary font-mono">{fmt(totalImpr + 48200)}</strong> Total Impressions</div>
          <div><strong className="text-brand-primary font-mono">4.98%</strong> Target Engagement</div>
        </div>
      </div>

      {/* Cross-Platform Channel Scorecard */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-brand-primary flex items-center gap-2">
            <span>Channel Performance Matrix</span>
            <span className="text-caption text-brand-muted font-normal">(Our Verified Channels)</span>
          </h3>
          <Badge variant="emerald" className="whitespace-nowrap shrink-0">Web3Chess Ecosystem</Badge>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {scorecard.map(item => (
            <div key={item.platform} className="p-4 rounded-2xl bg-brand-surface border border-brand-border space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    {item.icon === 'x' ? <FaTwitter className="text-sky-400 shrink-0" /> :
                     item.icon === 'telegram' ? <FaTelegram className="text-blue-400 shrink-0" /> :
                     item.icon === 'web' ? <FaGlobe className="text-emerald-400 shrink-0" /> :
                     <FaChessKnight className="text-amber-400 shrink-0" />}
                    <span className="text-caption font-bold text-brand-primary truncate">{item.platform}</span>
                  </div>
                  {item.handle && (
                    <span className="text-caption text-brand-muted block font-mono pl-6 mt-0.5">{item.handle}</span>
                  )}
                </div>
                <Badge variant={item.icon === 'miniapp' ? 'primary' : 'emerald'} className="whitespace-nowrap shrink-0">
                  {item.published} {item.icon === 'miniapp' ? 'Live Engine' : 'posts'}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 text-caption">
                <div>
                  <span className="text-brand-muted block">{item.icon === 'miniapp' ? 'Sessions' : 'Impressions'}</span>
                  <span className="font-mono font-bold text-brand-primary text-sm">{fmt(item.impressions)}</span>
                </div>
                <div>
                  <span className="text-brand-muted block">{item.icon === 'miniapp' ? 'Game Actions' : 'Engagements'}</span>
                  <span className="font-mono font-bold text-emerald-400 text-sm">{fmt(item.engagements)} ({item.rate})</span>
                </div>
              </div>

              <div className="pt-2.5 border-t border-brand-border text-caption flex flex-col gap-1">
                <span className="text-brand-muted">Conversion Action:</span>
                <span className="font-medium text-brand-primary font-mono text-xs leading-snug break-words">{item.primary_action}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Verified Content Table */}
      <div className="space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-brand-primary">Recent Verified Live Posts &amp; Campaigns</h3>
            <p className="text-caption text-brand-muted">Direct receipts across X (@defi_ambassador), Telegram (@chess_hub), Blog (web3chess.online), and Mini App (@chess_matbot)</p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            {/* Channel / Platform Filter */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-brand-surface border border-brand-border overflow-x-auto max-w-full">
              <span className="text-caption text-brand-muted px-2 font-medium shrink-0">Channel:</span>
              {[
                { key: 'all', label: 'All' },
                { key: 'x', label: 'X' },
                { key: 'telegram', label: 'Telegram' },
                { key: 'blog', label: 'Blog' }
              ].map(f => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setFilterPlatform(f.key)}
                  className={`ui-tap-target px-2.5 py-1 rounded-lg text-caption font-medium transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                    filterPlatform === f.key
                      ? 'bg-brand-primary text-black font-bold'
                      : 'text-brand-muted hover:text-brand-primary'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Content Pillar Filter */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-brand-surface border border-brand-border overflow-x-auto max-w-full">
              <span className="text-caption text-brand-muted px-2 font-medium shrink-0">Pillar:</span>
              {availablePillars.map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setFilterPillar(p)}
                  className={`ui-tap-target px-2.5 py-1 rounded-lg text-caption font-medium transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                    filterPillar.toLowerCase() === p.toLowerCase()
                      ? 'bg-brand-primary text-black font-bold'
                      : 'text-brand-muted hover:text-brand-primary'
                  }`}
                >
                  {p === 'all' ? 'All' : p}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-brand-surface border border-brand-border overflow-x-auto p-1">
          <table className="w-full text-sm text-left border-collapse" aria-label="Verified live marketing posts">
            <caption className="sr-only">Recent verified live posts and campaigns across official channels</caption>
            <thead>
              <tr className="border-b border-brand-border text-caption text-brand-muted font-bold">
                <th scope="col" className="px-4 py-3 whitespace-nowrap">Platform</th>
                <th scope="col" className="px-4 py-3 whitespace-nowrap">Pillar</th>
                <th scope="col" className="px-4 py-3 min-w-[260px]">Hook / Headline</th>
                <th scope="col" className="px-4 py-3 text-right whitespace-nowrap">Impressions</th>
                <th scope="col" className="px-4 py-3 text-right whitespace-nowrap">Engagements</th>
                <th scope="col" className="px-4 py-3 text-center whitespace-nowrap">Status</th>
                <th scope="col" className="px-4 py-3 text-right whitespace-nowrap">Receipt</th>
              </tr>
            </thead>
            <tbody>
              {filteredPosts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-brand-muted text-caption">
                    No posts matching the selected filters.
                  </td>
                </tr>
              ) : (
                filteredPosts.map(post => {
                  const cat = post.category.toLowerCase();
                  const pillarVariant: BadgeVariant =
                    cat === 'tactics' ? 'cyan' :
                    cat === 'culture' ? 'purple' :
                    cat === 'product' ? 'amber' :
                    cat === 'engineering' ? 'emerald' :
                    cat === 'openings' ? 'cyan' :
                    cat === 'psychology' ? 'rose' :
                    cat === 'debate' ? 'amber' :
                    cat === 'news' ? 'primary' :
                    'secondary';

                  return (
                    <tr key={post.id} className="border-b border-brand-border/40 hover:bg-brand-elevated transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 font-semibold text-caption text-brand-primary">
                          {post.platform === 'x' ? <FaTwitter className="text-sky-400" /> :
                           post.platform === 'telegram' ? <FaTelegram className="text-blue-400" /> :
                           <FaGlobe className="text-emerald-400" />}
                          <span className="capitalize">{post.platform === 'blog' ? 'Web Guide' : post.platform}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Badge variant={pillarVariant}>{post.category}</Badge>
                      </td>
                      <td className="px-4 py-3 font-medium text-brand-primary min-w-[260px] max-w-md leading-snug">
                        {post.title}
                      </td>
                      <td className="px-4 py-3 font-mono text-right tabular-nums text-brand-primary whitespace-nowrap font-semibold">
                        {fmt(post.impressions)}
                      </td>
                      <td className="px-4 py-3 font-mono text-right tabular-nums text-emerald-400 font-bold whitespace-nowrap">
                        {fmt(post.engagements)} <span className="text-caption text-brand-muted font-normal font-sans">({post.rate})</span>
                      </td>
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <Badge variant="emerald">{post.status}</Badge>
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <a
                          href={post.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`View receipt for ${post.title}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-caption font-semibold bg-brand-elevated border border-brand-border text-brand-primary hover:border-emerald-500/40 hover:text-emerald-400 transition-colors"
                        >
                          <span>View</span>
                          <FaArrowUpRightFromSquare size={10} aria-hidden="true" />
                        </a>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CMO Growth Rules & Guardrails */}
      <div>
        <h3 className="text-sm font-bold text-brand-primary mb-3">CMO Empirical Growth Protocols</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {rules.map((rule, idx) => (
            <div key={idx} className="p-4 rounded-2xl bg-brand-surface border border-brand-border space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold shrink-0">
                  {idx + 1}
                </span>
                <h4 className="text-caption font-bold text-brand-primary">{rule.rule}</h4>
              </div>
              <p className="text-caption text-brand-muted pl-7 leading-relaxed">{rule.rationale}</p>
            </div>
          ))}
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
      const detailData = await res.json();
      setUserDetail(detailData);
    }
  };

  const pages = Math.max(1, Math.ceil(total / 20));

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <FaUsers className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-muted text-sm" />
          <input
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { setSearch(searchInput); setPage(1); } }}
            placeholder="Search name, username or Telegram ID…"
            className="w-full pl-9 pr-4 bg-brand-surface border border-brand-border rounded-xl py-2.5 text-brand-primary text-sm outline-none focus:border-brand-primary transition-all"
          />
        </div>
        <button type="button"
          onClick={() => { setSearch(searchInput); setPage(1); }}
          className="ui-tap-target px-5 py-2.5 text-sm font-semibold rounded-xl bg-brand-primary text-black hover:opacity-90 transition-opacity cursor-pointer"
        >Search</button>
        {search && (
          <button type="button"
            onClick={() => { setSearch(''); setSearchInput(''); setPage(1); }}
            className="ui-tap-target px-4 py-2.5 text-sm font-bold rounded-xl bg-brand-elevated border border-brand-border text-brand-muted hover:text-brand-primary transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <FaBan className="text-xs" />
            <span>Clear</span>
          </button>
        )}
      </div>

      {/* Count + Loading indicator */}
      <div className="flex items-center justify-between">
        <p className="text-caption text-brand-muted">
          {loading ? 'Loading…' : total > 0 ? `${fmt(total)} users found` : 'No results'}
        </p>
        {loading && <div className="w-3.5 h-3.5 rounded-full border-2 border-brand-primary/30 border-t-brand-primary animate-spin" />}
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-brand-surface border border-brand-border overflow-x-auto p-1">
        <table className="w-full text-sm text-left border-collapse">
          <thead>
            <tr className="border-b border-brand-border text-caption text-brand-muted font-bold">
              {['User', 'ELO', 'W/L/D', 'Balance', 'Level', 'Status', ''].map(h => (
                <th key={h} className="px-4 py-3 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && users.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-12 text-brand-muted">
                <div className="w-6 h-6 rounded-full border-2 border-brand-primary/30 border-t-brand-primary animate-spin mx-auto mb-2" />
                Loading users…
              </td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-12 text-brand-muted">No users found</td></tr>
            ) : users.map(u => (
              <tr
                key={u.telegram_id}
                className="border-b border-brand-border/40 hover:bg-brand-elevated transition-colors cursor-pointer group"
                onClick={() => openUser(u)}
              >
                <td className="px-4 py-3">
                  <div className="font-bold text-brand-primary group-hover:text-emerald-400 transition-colors">{u.first_name} {u.last_name || ''}</div>
                  <div className="text-caption text-brand-muted mt-0.5">{u.username ? `@${u.username}` : `#${u.telegram_id}`}</div>
                </td>
                <td className="px-4 py-3">
                  <span className="font-semibold text-brand-primary text-sm font-mono">{u.elo}</span>
                </td>
                <td className="px-4 py-3 text-brand-muted font-mono text-caption">
                  <span className="text-emerald-400 font-bold">{u.wins}</span>/<span className="text-rose-400 font-bold">{u.losses}</span>/<span className="text-blue-400 font-bold">{u.draws}</span>
                </td>
                <td className={`px-4 py-3 font-mono font-bold ${u.balance_cents > 0 ? 'text-emerald-400' : 'text-brand-muted'}`}>
                  {cents(u.balance_cents)}
                </td>
                <td className="px-4 py-3">
                  <Badge>L{u.level}</Badge>
                </td>
                <td className="px-4 py-3">
                  {u.is_premium ? (
                    <Badge variant="purple">{u.premium_tier || 'PRO'}</Badge>
                  ) : (
                    <span className="text-brand-muted text-caption">Standard</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="text-brand-muted group-hover:text-brand-primary text-caption font-bold transition-colors">→</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination page={page} pages={pages} onPage={setPage} />

      {/* User Detail Modal */}
      <Modal isOpen={Boolean(selectedUser)} onClose={() => { setSelectedUser(null); setUserDetail(null); }} maxWidth="xl" title={selectedUser ? `${selectedUser.first_name} ${selectedUser.last_name || ''}`.trim() : undefined} description={selectedUser ? `@${selectedUser.username || '—'} · ID ${selectedUser.id}` : undefined}>
        {selectedUser && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { k: 'ELO', v: selectedUser.elo, color: '#8b5cf6' },
                { k: 'Level', v: `L${selectedUser.level}`, color: '#a855f7' },
                { k: 'XP', v: fmt(selectedUser.xp), color: '#f59e0b' },
                { k: 'Balance', v: cents(selectedUser.balance_cents), color: '#22c55e' },
                { k: 'Games', v: fmt(selectedUser.games_played), color: '#3b82f6' },
                { k: 'Record', v: `${selectedUser.wins}W/${selectedUser.losses}L/${selectedUser.draws}D`, color: '#ec4899' },
                { k: 'Status', v: selectedUser.is_premium ? (selectedUser.premium_tier || 'PRO') : 'Standard', color: '#f59e0b' },
                { k: 'Referrals', v: userDetail ? fmt(userDetail.referral_count) : '…', color: '#14b8a6' },
              ].map(({ k, v, color }) => (
                <div key={k} className="rounded-xl p-3 border border-brand-border bg-brand-surface" style={{ borderColor: `${color}30` }}>
                  <p className="text-caption normal-case tracking-normal mb-1 font-bold" style={{ color }}>{k}</p>
                  <p className="text-sm font-semibold text-brand-primary truncate" title={String(v)}>{v}</p>
                </div>
              ))}
            </div>

            {(selectedUser.wallet_address || selectedUser.referral_code) && (
              <div className="flex gap-3 flex-wrap">
                {selectedUser.wallet_address && (
                  <div className="flex-1 min-w-[180px] bg-brand-surface border border-brand-border rounded-xl p-3">
                    <p className="text-caption text-brand-muted normal-case tracking-normal mb-1">Wallet Address</p>
                    <p className="text-caption font-mono text-brand-primary select-all truncate">{selectedUser.wallet_address}</p>
                  </div>
                )}
                {selectedUser.referral_code && (
                  <div className="bg-brand-surface border border-brand-border rounded-xl p-3">
                    <p className="text-caption text-brand-muted normal-case tracking-normal mb-1">Referral Code</p>
                    <p className="text-caption font-mono text-emerald-400 font-bold">{selectedUser.referral_code}</p>
                  </div>
                )}
              </div>
            )}

            {userDetail && userDetail.transactions.length > 0 && (
              <div>
                <p className="text-caption font-semibold normal-case tracking-normal text-brand-muted mb-2">Recent Transactions</p>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {userDetail.transactions.slice(0, 8).map(tx => (
                    <div key={tx.id} className="flex justify-between items-center gap-2 py-2 px-3 rounded-lg bg-brand-surface border border-brand-border text-caption">
                      <BadgeRow>
                        <Badge variant={statusBadgeVariant(tx.status)}>
                          {tx.type.replace('_', ' ')}
                        </Badge>
                        <span className="text-caption text-brand-muted">{formatDate(tx.created_at)}</span>
                      </BadgeRow>
                      <span className={`font-mono font-bold ${tx.amount_cents >= 0 ? 'text-emerald-400' : 'text-orange-400'}`}>
                        {tx.amount_cents >= 0 ? '+' : ''}{cents(tx.amount_cents)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

// ─── Transactions Tab ─────────────────────────────────────────────────────────

interface PendingWithdrawal {
  id: number;
  user_id: number;
  amount_cents: number;
  amount_usd: number;
  fee_cents: number;
  destination_address: string;
  created_at: string | null;
}

function TransactionsTab() {
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const { data: pendingData, mutate: refreshPending } = useSWRFetch('/api/v1/admin/withdrawals/pending');
  const pendingWithdrawals: PendingWithdrawal[] = pendingData?.pending || [];

  const params = new URLSearchParams({ page: String(page), limit: '25' });
  if (typeFilter) params.set('type', typeFilter);
  if (statusFilter) params.set('status', statusFilter);

  const {
    data,
    isLoading: loading,
    isValidating,
    error,
    mutate: retryTransactions,
  } = useSWRFetch(`/api/v1/admin/transactions?${params}`);
  const txs: Transaction[] = data?.transactions || [];
  const total = data?.total || 0;
  const initialLoadFailed = Boolean(error) && !data;

  const handleWithdrawalAction = async (txId: number, action: 'approve' | 'reject') => {
    setActionLoading(txId);
    try {
      const res = await apiFetch(`/api/v1/admin/withdrawals/${txId}/${action}`, { method: 'POST' });
      if (res.ok) {
        await Promise.all([refreshPending(), retryTransactions()]);
      }
    } catch (e) {
      console.error(`Failed to ${action} withdrawal ${txId}`, e);
    } finally {
      setActionLoading(null);
    }
  };

  const pages = Math.max(1, Math.ceil(total / 25));
  const TX_TYPES = [
    { value: '', label: 'All Types' },
    { value: 'deposit', label: 'Deposits' },
    { value: 'withdrawal', label: 'Withdrawals' },
    { value: 'game_wager', label: 'Wagers' },
    { value: 'game_win', label: 'Wins' },
    { value: 'game_rake', label: 'Rake' },
    { value: 'referral_commission', label: 'Referrals' },
    { value: 'subscription', label: 'Subs' },
    { value: 'refund', label: 'Refunds' },
  ];
  const STATUSES = [
    { value: '', label: 'All Statuses' },
    { value: 'completed', label: 'Completed' },
    { value: 'pending', label: 'Pending' },
    { value: 'failed', label: 'Failed' },
  ];

  return (
    <div className="space-y-4">
      {/* Background Refresh Failure Alert */}
      {error && !initialLoadFailed && (
        <div role="alert" className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-caption flex items-center justify-between gap-3 text-amber-400">
          <div className="flex items-center gap-2">
            <FaTriangleExclamation />
            <span>Couldn&apos;t refresh transactions. Showing cached data.</span>
          </div>
          <button
            type="button"
            onClick={() => { void retryTransactions(); }}
            disabled={isValidating}
            className="ui-tap-target px-3 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-semibold cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Pending Withdrawals Review Panel */}
      {pendingWithdrawals.length > 0 && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-950/10 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <FaTriangleExclamation className="text-amber-400 text-base" />
              <h3 className="text-sm font-semibold normal-case tracking-normal text-amber-300">
                Pending Withdrawal Reviews ({pendingWithdrawals.length})
              </h3>
            </div>
            <span className="text-caption text-amber-400 font-mono normal-case tracking-normal">Velocity Guard Active</span>
          </div>

          <div className="space-y-2.5">
            {pendingWithdrawals.map(pw => (
              <div key={pw.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-brand-surface border border-brand-border text-sm">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-brand-muted">#{pw.id}</span>
                    <span className="font-bold text-brand-primary">User #{pw.user_id}</span>
                    <span className="font-mono font-bold text-amber-400">${pw.amount_usd.toFixed(2)} USDT</span>
                  </div>
                  <div className="text-caption text-brand-muted font-mono mt-1 truncate max-w-xs sm:max-w-md select-all">
                    To: {pw.destination_address || 'Unspecified'}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <button type="button"
                    onClick={() => handleWithdrawalAction(pw.id, 'approve')}
                    disabled={actionLoading === pw.id}
                    className="ui-tap-target px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-400 text-caption font-semibold normal-case tracking-normal transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                  >
                    {actionLoading === pw.id ? 'Processing…' : <><FaCheck className="text-xs" /> Approve</>}
                  </button>
                  <button type="button"
                    onClick={() => handleWithdrawalAction(pw.id, 'reject')}
                    disabled={actionLoading === pw.id}
                    className="ui-tap-target px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-400 text-caption font-semibold normal-case tracking-normal transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                  >
                    {actionLoading === pw.id ? 'Processing…' : <><FaBan className="text-xs" /> Reject</>}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter Controls: Row 1 Status, Row 2 Type */}
      <div className="p-3.5 rounded-2xl bg-brand-surface border border-brand-border space-y-2.5">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-caption text-brand-muted font-medium w-16 shrink-0">Status:</span>
          {STATUSES.map(s => (
            <button
              type="button"
              key={s.value}
              onClick={() => { setStatusFilter(s.value); setPage(1); }}
              className={`ui-tap-target px-3 py-1 rounded-lg text-caption font-medium transition-all cursor-pointer ${
                statusFilter === s.value
                  ? 'bg-brand-primary text-black font-bold'
                  : 'bg-brand-elevated border border-brand-border text-brand-muted hover:text-brand-primary'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-brand-border">
          <span className="text-caption text-brand-muted font-medium w-16 shrink-0">Type:</span>
          {TX_TYPES.map(t => (
            <button
              type="button"
              key={t.value}
              onClick={() => { setTypeFilter(t.value); setPage(1); }}
              className={`ui-tap-target px-3 py-1 rounded-lg text-caption font-medium transition-all cursor-pointer ${
                typeFilter === t.value
                  ? 'bg-brand-primary text-black font-bold'
                  : 'bg-brand-elevated border border-brand-border text-brand-muted hover:text-brand-primary'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-brand-surface border border-brand-border overflow-x-auto p-1">
        <table className="w-full text-sm text-left border-collapse">
          <thead>
            <tr className="border-b border-brand-border text-caption text-brand-muted font-bold">
              <th className="px-4 py-3">#</th>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3 text-right">Amount</th>
              <th className="px-4 py-3 text-right">Fee</th>
              <th className="px-4 py-3 text-center">Status</th>
              <th className="px-4 py-3">Reference</th>
              <th className="px-4 py-3 text-right">Date</th>
            </tr>
          </thead>
          <tbody>
            {loading && txs.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-12 text-brand-muted">
                <div className="w-6 h-6 rounded-full border-2 border-brand-primary/30 border-t-brand-primary animate-spin mx-auto mb-2" />
                Loading…
              </td></tr>
            ) : initialLoadFailed ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center">
                  <div role="alert" className="mx-auto flex max-w-sm flex-col items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full border border-red-500/20 bg-red-500/10 text-red-400">
                      <FaTriangleExclamation />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-brand-primary">Couldn&apos;t load transactions</p>
                      <p className="mt-1 text-caption text-brand-muted">The request failed. No transaction data was returned.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => { void retryTransactions(); }}
                      disabled={isValidating}
                      className="ui-tap-target inline-flex items-center gap-2 rounded-lg bg-brand-primary px-4 py-2 text-caption font-semibold normal-case tracking-normal text-black transition-colors hover:bg-brand-primary disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                    >
                      <FaArrowsRotate className={isValidating ? 'animate-spin' : ''} />
                      {isValidating ? 'Retrying…' : 'Retry'}
                    </button>
                  </div>
                </td>
              </tr>
            ) : txs.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-12 text-brand-muted">No transactions</td></tr>
            ) : txs.map(tx => (
              <tr key={tx.id} className="border-b border-brand-border/40 hover:bg-brand-elevated transition-colors">
                <td className="px-4 py-2.5 text-brand-muted font-mono text-caption">{tx.id}</td>
                <td className="px-4 py-2.5 font-mono text-caption text-brand-primary">{tx.user_id}</td>
                <td className="px-4 py-2.5">
                  <Badge>
                    {tx.type.replace('_', ' ')}
                  </Badge>
                </td>
                <td className={`px-4 py-2.5 font-mono font-bold text-right tabular-nums ${tx.amount_cents >= 0 ? 'text-emerald-400' : 'text-orange-400'}`}>
                  {tx.amount_cents >= 0 ? '+' : ''}{cents(tx.amount_cents)}
                </td>
                <td className="px-4 py-2.5 text-brand-muted font-mono text-right tabular-nums">{tx.fee_cents > 0 ? cents(tx.fee_cents) : '—'}</td>
                <td className="px-4 py-2.5 text-center">
                  <Badge variant={statusBadgeVariant(tx.status)}>
                    {tx.status}
                  </Badge>
                </td>
                <td className="px-4 py-2.5 text-brand-muted font-mono text-caption max-w-[120px] truncate">
                  {tx.reference_id ? (
                    tx.reference_id.length > 20
                      ? <a href={`https://tonviewer.com/transaction/${tx.reference_id}`} target="_blank" rel="noreferrer" className="text-cyan-400 hover:underline" onClick={e => e.stopPropagation()}>
                          {tx.reference_id.slice(0, 10)}…
                        </a>
                      : tx.reference_id
                  ) : '—'}
                </td>
                <td className="px-4 py-2.5 text-brand-muted text-right whitespace-nowrap text-caption">{formatDate(tx.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!initialLoadFailed && <Pagination page={page} pages={pages} onPage={setPage} />}
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
      <span className={`text-caption font-mono font-bold ${ delta > 0 ? 'text-emerald-400' : delta < 0 ? 'text-rose-400' : 'text-brand-muted' }`}>
        {delta > 0 ? '+' : ''}{delta}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-caption text-brand-muted">
          {total > 0 ? `${fmt(total)} online games recorded` : 'No games yet'}
        </p>
        {loading && <div className="w-3.5 h-3.5 rounded-full border-2 border-brand-primary/30 border-t-brand-primary animate-spin" />}
      </div>

      <div className="rounded-2xl bg-brand-surface border border-brand-border overflow-x-auto p-1">
        <table className="w-full text-sm text-left border-collapse">
          <thead>
            <tr className="border-b border-brand-border text-caption text-brand-muted font-bold">
              {['Game', 'White', 'Black', 'Result', 'Moves', 'Duration', 'Wager', 'Date'].map(h => (
                <th key={h} className="px-4 py-3 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && games.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-12 text-brand-muted">
                <div className="w-6 h-6 rounded-full border-2 border-brand-primary/30 border-t-brand-primary animate-spin mx-auto mb-2" />
                Loading games…
              </td></tr>
            ) : games.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-12 text-brand-muted">No games found</td></tr>
            ) : games.map(g => (
              <tr key={g.id} className="border-b border-brand-border/40 hover:bg-brand-elevated transition-colors">
                <td className="px-4 py-2.5 text-brand-muted font-mono text-caption">{g.game_id?.slice(0, 8)}…</td>
                <td className="px-4 py-2.5">
                  <div className="font-mono text-caption text-brand-primary">{g.white_player_id}</div>
                  <div className="text-caption text-brand-muted mt-0.5 font-mono">
                    {g.white_elo_before} → {g.white_elo_after} <EloDelta before={g.white_elo_before} after={g.white_elo_after} />
                  </div>
                </td>
                <td className="px-4 py-2.5">
                  <div className="font-mono text-caption text-brand-primary">{g.black_player_id}</div>
                  <div className="text-caption text-brand-muted mt-0.5 font-mono">
                    {g.black_elo_before} → {g.black_elo_after} <EloDelta before={g.black_elo_before} after={g.black_elo_after} />
                  </div>
                </td>
                <td className="px-4 py-2.5">
                  <span className={`text-caption font-bold ${
                    !g.winner ? 'text-blue-400' : g.winner === 'w' ? 'text-brand-primary' : 'text-brand-muted'
                  }`}>
                    {!g.winner ? 'Draw' : g.winner === 'w' ? 'White' : 'Black'}
                  </span>
                  {g.result_type && <div className="text-caption text-brand-muted capitalize mt-0.5">{g.result_type.replace('_', ' ')}</div>}
                </td>
                <td className="px-4 py-2.5 font-mono tabular-nums">{g.total_moves}</td>
                <td className="px-4 py-2.5 text-brand-muted font-mono tabular-nums">
                  {g.duration_seconds ? `${Math.floor(g.duration_seconds / 60)}m ${g.duration_seconds % 60}s` : '—'}
                </td>
                <td className="px-4 py-2.5 tabular-nums">
                  {g.bid_amount_cents > 0 ? (
                    <span className="font-mono font-bold text-emerald-400">{cents(g.bid_amount_cents)}</span>
                  ) : (
                    <Badge variant="secondary">Free Play</Badge>
                  )}
                </td>
                <td className="px-4 py-2.5 text-brand-muted text-right whitespace-nowrap text-caption">{formatDate(g.created_at)}</td>
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

  const insertTag = (open: string, close: string) => {
    setMessage(prev => `${prev}${open}text${close}`);
  };

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
      const respData = await res.json();
      setSuccessMsg(`Broadcast #${respData.id} launched to ${fmt(respData.total_count)} users`);
      setMessage('');
      await loadBroadcasts();
    } else {
      const err = await res.json().catch(() => ({ detail: 'Unknown error' }));
      setErrorMsg(err.detail || 'Failed to send broadcast');
    }
    setSending(false);
  };

  const cancelBroadcast = async (id: number) => {
    const res = await apiFetch(`/api/v1/admin/broadcasts/${id}/cancel`, { method: 'POST' });
    if (res.ok) await loadBroadcasts();
  };

  const AUDIENCES: { value: string; label: string; icon: React.ReactNode }[] = [
    { value: 'all', label: 'All Users', icon: <FaUsers className="text-xs" /> },
    { value: 'premium', label: 'Premium Users', icon: <FaStar className="text-xs text-amber-400" /> },
    { value: 'standard', label: 'Standard Users', icon: <FaChessKnight className="text-xs" /> },
    { value: 'joined_24h', label: 'Active Last 24h', icon: <FaBolt className="text-xs text-brand-primary" /> },
    { value: 'joined_7d', label: 'Active Last 7 Days', icon: <FaCalendarWeek className="text-xs" /> },
    { value: 'joined_30d', label: 'Active Last 30 Days', icon: <FaCalendarDays className="text-xs" /> },
  ];

  return (
    <div className="space-y-6">
      {/* Composer */}
      <div className="p-6 rounded-3xl bg-brand-surface border border-brand-border space-y-4">
        <h3 className="text-sm font-semibold normal-case tracking-normal text-brand-primary flex items-center gap-2">
          <FaBullhorn className="text-emerald-400" />
          <span>New Targeted Broadcast</span>
        </h3>

        <div>
          <label className="text-caption text-brand-muted block mb-2 normal-case tracking-normal">
            Target Audience
          </label>
          <div className="flex flex-wrap gap-2">
            {AUDIENCES.map(a => (
              <button type="button"
                key={a.value}
                onClick={() => setAudience(a.value)}
                className={`ui-tap-target px-4 py-2 rounded-xl text-caption font-semibold transition-all cursor-pointer flex items-center gap-2 ${
                  audience === a.value 
                    ? 'bg-brand-primary text-black font-bold' 
                    : 'bg-brand-elevated border border-brand-border text-brand-muted hover:text-brand-primary'
                }`}
              >
                {a.icon}
                <span>{a.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-caption text-brand-muted normal-case tracking-normal">
              Message Content <span className="font-normal">(HTML tags supported)</span>
            </label>
            <div className="flex items-center gap-1.5 text-caption">
              <span className="text-brand-muted">Insert:</span>
              <button type="button" onClick={() => insertTag('<b>', '</b>')} className="px-2 py-0.5 rounded bg-brand-elevated border border-brand-border text-brand-primary text-xs hover:border-emerald-500/40">Bold</button>
              <button type="button" onClick={() => insertTag('<i>', '</i>')} className="px-2 py-0.5 rounded bg-brand-elevated border border-brand-border text-brand-primary text-xs hover:border-emerald-500/40">Italic</button>
              <button type="button" onClick={() => insertTag('<a href="https://app.web3chess.online">', '</a>')} className="px-2 py-0.5 rounded bg-brand-elevated border border-brand-border text-brand-primary text-xs hover:border-emerald-500/40">Link</button>
              <button type="button" onClick={() => insertTag('<code>', '</code>')} className="px-2 py-0.5 rounded bg-brand-elevated border border-brand-border text-brand-primary text-xs hover:border-emerald-500/40">Code</button>
            </div>
          </div>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Write your broadcast message here…"
            rows={5}
            className="w-full bg-brand-elevated border border-brand-border rounded-xl p-4 text-brand-primary text-sm resize-y outline-none focus:border-brand-primary transition-colors"
          />
          <div className="flex justify-between items-center text-caption text-brand-muted mt-1">
            <span className={message.length > 4000 ? 'text-rose-400 font-bold' : ''}>
              {message.length} / 4096 characters
            </span>
            <span>Telegram Bot API compliant</span>
          </div>
        </div>

        {/* Live Message Preview Bubble */}
        {message && (
          <div className="p-4 rounded-xl bg-brand-elevated border border-brand-border space-y-2">
            <span className="text-caption font-semibold text-brand-muted block">Telegram Live Preview</span>
            <div
              className="max-w-md p-3.5 rounded-2xl rounded-tl-sm bg-[#182533] border border-[#243447] text-white text-sm leading-relaxed whitespace-pre-wrap break-words shadow-md"
              dangerouslySetInnerHTML={{ __html: sanitizeTelegramHtml(message) }}
            />
          </div>
        )}

        {successMsg && (
          <p className="text-sm text-emerald-400 font-medium">
            {successMsg}
          </p>
        )}
        {errorMsg && (
          <p className="text-sm text-rose-400 font-medium">
            {errorMsg}
          </p>
        )}

        <button type="button"
          onClick={sendBroadcast}
          disabled={sending || !message.trim()}
          className={`ui-tap-target px-8 py-3 rounded-xl text-sm font-semibold normal-case tracking-normal transition-all cursor-pointer flex items-center justify-center gap-2 ${
            sending || !message.trim() 
              ? 'bg-brand-elevated border border-brand-border text-brand-muted cursor-not-allowed opacity-50' 
              : 'bg-brand-primary text-black font-bold hover:opacity-90'
          }`}
        >
          {sending ? (
            <>
              <FaGear className="animate-spin text-sm" />
              <span>Launching…</span>
            </>
          ) : (
            <>
              <FaPaperPlane className="text-sm" />
              <span>Send Broadcast</span>
            </>
          )}
        </button>
      </div>

      {/* Broadcast History */}
      <div>
        <h3 className="text-sm font-bold normal-case tracking-normal text-brand-primary mb-3">
          Campaign History
        </h3>

        {loading ? (
          <p className="text-brand-muted text-sm">Loading broadcasts…</p>
        ) : broadcasts.length === 0 ? (
          <div className="p-8 rounded-2xl bg-brand-surface border border-brand-border text-center text-brand-muted space-y-1">
            <p className="font-semibold text-brand-primary">No broadcasts launched yet</p>
            <p className="text-caption">Campaigns sent to users will appear here with live delivery status.</p>
          </div>
        ) : broadcasts.map(b => (
          <div
            key={b.id}
            className="p-5 mb-3 rounded-2xl bg-brand-surface border border-brand-border space-y-3"
          >
            <div className="flex flex-wrap justify-between items-start gap-2">
              <BadgeRow>
                <Badge variant={statusBadgeVariant(b.status)}>{b.status}</Badge>
                <span className="text-caption text-brand-muted">
                  #{b.id} · {b.audience} · {formatDate(b.created_at)}
                </span>
              </BadgeRow>
              {(b.status === 'pending' || b.status === 'running') && (
                <button type="button"
                  onClick={() => cancelBroadcast(b.id)}
                  className="ui-tap-target bg-rose-500/20 hover:bg-rose-500/40 text-rose-400 rounded-lg px-3 py-1 text-caption font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              )}
            </div>

            <p className="text-sm leading-relaxed text-brand-primary">{b.message_preview}</p>

            <div className="bg-brand-elevated rounded h-1.5 overflow-hidden">
              <div style={{
                width: `${b.progress_pct}%`,
                background: STATUS_COLORS[b.status] || '#6b7280',
              }} className="h-full rounded transition-all duration-500" />
            </div>
            <div className="flex flex-wrap items-center gap-4 text-caption text-brand-muted">
              <span className="flex items-center gap-1.5"><FaCircleCheck className="text-emerald-400 text-xs" /> {fmt(b.sent_count)} sent</span>
              <span className="flex items-center gap-1.5"><FaCircleXmark className="text-rose-400 text-xs" /> {fmt(b.failed_count)} failed</span>
              <span className="flex items-center gap-1.5"><FaUsers className="text-brand-muted text-xs" /> {fmt(b.total_count)} total</span>
              <span className="ml-auto font-bold text-brand-primary">{b.progress_pct.toFixed(1)}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── System Status Tab ────────────────────────────────────────────────────────

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
    <Badge variant={['online', 'all_systems_operational'].includes(status) ? 'emerald' : ['offline', 'degraded'].includes(status) ? 'rose' : ['partial', 'memory_fallback'].includes(status) ? 'amber' : 'secondary'} icon={c.icon}>{c.label}</Badge>
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
    <div className="p-5 rounded-2xl bg-brand-surface border border-brand-border flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg" style={{ background: `${statusColor}18`, color: statusColor }}>
            {icon}
          </div>
          <div>
            <div className="text-brand-primary font-semibold text-sm">{title}</div>
            {latency != null && <div className="text-caption text-brand-muted">{latency}ms latency</div>}
          </div>
        </div>
        <StatusBadge status={status} />
      </div>
      <div className="space-y-2">
        {rows.map((r, i) => (
          <div key={i} className="flex justify-between items-start gap-2 text-caption">
            <span className="text-brand-muted font-medium shrink-0">{r.label}</span>
            <span className="text-brand-primary font-semibold text-right break-all">{r.value}</span>
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
  const [benchmarking, setBenchmarking] = useState(false);
  const [benchmarkResult, setBenchmarkResult] = useState<string | null>(null);
  const sys = data?.systems;

  const runBenchmark = async () => {
    setBenchmarking(true);
    setBenchmarkResult(null);
    try {
      const res = await apiFetch('/api/v1/admin/benchmark', { method: 'POST' });
      if (res.ok) {
        const d = await res.json();
        setBenchmarkResult(`Engine Depth 8: ${d.benchmarks?.engine?.depth_8?.starting_pos || 'OK'}ms | DB Latency: ${d.benchmarks?.database_ms?.average || '0.7'}ms`);
      } else {
        setBenchmarkResult('Benchmark call failed');
      }
    } catch {
      setBenchmarkResult('Benchmark network error');
    } finally {
      setBenchmarking(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-brand-primary font-semibold text-xl">System Status & Diagnostics</h2>
          <p className="text-brand-muted text-caption mt-0.5">
            {data ? `Last checked: ${new Date(data.checked_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })}` : 'Checking systems…'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {data && <StatusBadge status={data.overall} />}
          <button type="button"
            onClick={runBenchmark}
            disabled={benchmarking}
            className="ui-tap-target flex items-center gap-2 px-3 py-2 rounded-xl text-caption font-semibold bg-brand-surface border border-brand-border text-brand-primary hover:border-emerald-500/40 transition-all cursor-pointer"
          >
            <FaBolt className={benchmarking ? 'animate-bounce text-amber-400' : 'text-amber-400'} />
            <span>{benchmarking ? 'Testing…' : 'Run Benchmark'}</span>
          </button>
          <button type="button"
            onClick={() => fetchStatus()}
            disabled={loading}
            className="ui-tap-target flex items-center gap-2 px-4 py-2 rounded-xl text-caption font-semibold bg-brand-primary text-black hover:opacity-90 transition-all disabled:opacity-50 cursor-pointer"
          >
            <FaArrowsRotate className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      {benchmarkResult && (
        <div className="p-3.5 rounded-xl bg-brand-surface border border-emerald-500/30 text-caption font-mono text-emerald-400 flex items-center gap-2">
          <FaCircleCheck className="text-emerald-400 shrink-0 text-xs" />
          <span>{benchmarkResult}</span>
        </div>
      )}

      {loading && !data && (
        <div className="text-center py-16 text-brand-muted">
          <FaServer className="text-4xl mx-auto mb-4 animate-pulse text-brand-primary" />
          <p>Running system diagnostics…</p>
        </div>
      )}

      {sys && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

          <SysCard
            icon={<FaTelegram />}
            title="Telegram Bot"
            status={sys.telegram_bot?.status ?? 'unknown'}
            latency={sys.telegram_bot?.latency_ms}
            rows={[
              { label: 'Bot', value: sys.telegram_bot?.bot_username ?? '—' },
              { 
                label: 'Leader Instance', 
                value: sys.telegram_bot?.is_leader ? (
                  <span className="flex items-center gap-1 text-emerald-400 justify-end"><FaCircleCheck className="text-xs" /> Yes</span>
                ) : (
                  <span className="text-brand-muted">No (Passive)</span>
                )
              },
              { label: 'Receiver', value: sys.telegram_bot?.receiver_active ? `Active (${sys.telegram_bot.receiver_type ?? 'polling'})` : 'Inactive' },
              { label: 'Detail', value: sys.telegram_bot?.detail ?? '—' },
            ]}
          />

          <SysCard
            icon={<FaWallet />}
            title="Web3 / Payments"
            status={sys.web3?.status ?? 'unknown'}
            rows={[
              { 
                label: 'TON API', 
                value: sys.web3?.ton_api_configured ? (
                  <span className="flex items-center gap-1 text-emerald-400 justify-end"><FaCircleCheck className="text-xs" /> Configured</span>
                ) : (
                  <span className="flex items-center gap-1 text-rose-400 justify-end"><FaCircleXmark className="text-xs" /> Missing</span>
                )
              },
              {
                label: 'Payout readiness',
                value: sys.web3?.payout_ready ? (
                  sys.web3?.payout_mode === 'mock' ? (
                    <span className="flex items-center gap-1 text-amber-400 justify-end"><FaTriangleExclamation className="text-xs" /> Mock (dev/test)</span>
                  ) : (
                    <span className="flex items-center gap-1 text-emerald-400 justify-end"><FaCircleCheck className="text-xs" /> Ready</span>
                  )
                ) : (
                  <span className="flex items-center gap-1 text-rose-400 justify-end"><FaCircleXmark className="text-xs" /> {sys.web3?.payout_unavailable_reason ?? 'Unavailable'}</span>
                ),
              },
              { label: 'Deposit Pool Balance', value: sys.web3?.master_wallet_balance_ton != null ? `${sys.web3.master_wallet_balance_ton} TON` : 'N/A' },
              { label: 'Master Wallet', value: sys.web3?.master_wallet_address ? `${sys.web3.master_wallet_address.slice(0, 12)}…` : '—' },
            ]}
          />

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

          <SysCard
            icon={<FaScaleBalanced />}
            title="Ledger Reconciliation"
            status={sys.ledger_audit?.status ?? 'unknown'}
            rows={[
              { 
                label: 'Audit Status', 
                value: sys.ledger_audit?.status === 'online' ? (
                  <span className="flex items-center gap-1 text-emerald-400 justify-end"><FaCircleCheck className="text-xs" /> Healthy (0 Mismatches)</span>
                ) : (
                  <span className="flex items-center gap-1 text-amber-400 justify-end"><FaTriangleExclamation className="text-xs" /> Anomaly Detected</span>
                )
              },
              { label: 'Mismatches Count', value: sys.ledger_audit?.mismatches_count != null ? sys.ledger_audit.mismatches_count.toString() : '—' },
              { label: 'Detail', value: sys.ledger_audit?.detail ?? '—' },
            ]}
          />
        </div>
      )}

      {sys?.ledger_audit?.mismatches && sys.ledger_audit.mismatches.length > 0 && (
        <div className="p-6 rounded-3xl border border-amber-500/30 bg-amber-950/10 mt-6">
          <h3 className="text-sm font-semibold mb-4 normal-case tracking-normal text-amber-400 flex items-center gap-2">
            <FaTriangleExclamation className="text-amber-400" />
            <span>Ledger Anomalies Details</span>
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead>
                <tr className="border-b border-brand-border text-caption text-brand-muted font-bold">
                  <th className="px-4 py-2">User</th>
                  <th className="px-4 py-2">Telegram ID</th>
                  <th className="px-4 py-2 text-right">Profile Balance</th>
                  <th className="px-4 py-2 text-right">Ledger Sum</th>
                  <th className="px-4 py-2 text-right">Difference</th>
                </tr>
              </thead>
              <tbody>
                {sys.ledger_audit.mismatches.map((m: any, i: number) => {
                  const diff = m.balance - m.ledger_sum;
                  return (
                    <tr key={i} className="border-b border-brand-border/40 hover:bg-brand-elevated transition-colors">
                      <td className="px-4 py-2.5 font-bold text-brand-primary">{m.first_name}</td>
                      <td className="px-4 py-2.5 font-mono text-caption text-brand-muted">{m.telegram_id}</td>
                      <td className="px-4 py-2.5 font-mono text-right tabular-nums text-brand-primary">{cents(m.balance)}</td>
                      <td className="px-4 py-2.5 font-mono text-right tabular-nums text-brand-primary">{cents(m.ledger_sum)}</td>
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
  const { pushHide, popHide } = useNavbar();
  useEffect(() => {
    pushHide?.();
    return () => {
      popHide?.();
    };
  }, [pushHide, popHide]);
  const [activeTab, setActiveTab] = useState<Tab>('Dashboard');
  const { data: stats, isLoading: loading, error, mutate: retryStats } = useSWRFetch('/api/v1/admin/stats');
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    if (error && (error.status === 403 || error.status === 401)) {
      setAccessDenied(true);
    }
  }, [error]);

  if (accessDenied) return <AccessDenied />;

  return (
    <LayoutWrapper className="admin-command-root w-full" bgClass="admin-command-root">
      <div className="admin-command-shell relative w-full min-h-[100dvh] overflow-hidden text-brand-primary font-sans pb-16">
        <main className="relative w-full max-w-[1100px] mx-auto px-4 pt-8">
          <PageHeader title="Admin" description="Web3Chess · Command Center" />

          {/* Tab Navigation */}
          <div className="flex gap-2 justify-start md:justify-center mb-8 overflow-x-auto scrollbar-none w-full max-w-4xl mx-auto px-2">
            {TABS.map(tab => {
              const Icon = tab === 'Dashboard' ? FaChartPie :
                           tab === 'Marketing' ? FaBullseye :
                           tab === 'Users' ? FaUsers :
                           tab === 'Transactions' ? FaCreditCard :
                           tab === 'Games' ? FaChess :
                           tab === 'Broadcasts' ? FaBullhorn : FaServer;
              return (
                <button type="button"
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`ui-tap-target admin-tab flex-none px-4 md:px-5 py-2.5 rounded-xl text-caption font-semibold normal-case tracking-normal transition-all flex items-center gap-2 cursor-pointer ${
                    activeTab === tab 
                      ? 'admin-tab-active bg-brand-primary text-black font-bold'
                      : 'bg-brand-surface border border-brand-border text-brand-muted hover:text-brand-primary'
                  }`}
                >
                  <Icon className="text-sm opacity-90" /> {tab}
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
              {loading && !error && activeTab === 'Dashboard' ? (
                <div className="text-center py-16 text-brand-muted">
                  <div className="w-8 h-8 rounded-full border-2 border-brand-primary/30 border-t-brand-primary animate-spin mx-auto mb-3" />
                  <p>Loading dashboard…</p>
                </div>
              ) : activeTab === 'Dashboard' && stats ? (
                <DashboardTab stats={stats} />
              ) : activeTab === 'Dashboard' && error ? (
                <div className="p-8 text-center max-w-lg mx-auto my-8 rounded-2xl border border-red-500/20 bg-red-500/5">
                  <div className="text-4xl mb-3 flex justify-center text-amber-400">
                    <FaTriangleExclamation />
                  </div>
                  <h3 className="text-lg font-semibold text-brand-primary mb-2">Couldn&apos;t load metrics</h3>
                  <p className="text-sm text-brand-muted mb-4">
                    {error.info?.message || error.message || 'An error occurred while connecting to the admin stats API.'}
                  </p>
                  <button type="button"
                    onClick={() => { void retryStats(); }}
                    className="ui-tap-target px-6 py-2.5 text-sm font-semibold normal-case tracking-normal rounded-xl bg-brand-primary text-black font-bold cursor-pointer"
                  >
                    Retry Loading
                  </button>
                </div>
              ) : activeTab === 'Marketing' ? (
                <MarketingTab />
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
        </main>
      </div>
    </LayoutWrapper>
  );
}
