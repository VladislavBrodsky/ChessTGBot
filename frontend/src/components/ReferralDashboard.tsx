'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaCopy, FaCheck, FaShareAlt, FaUsers, FaBolt, FaDollarSign, FaChartLine, FaQrcode } from 'react-icons/fa';
import { useTranslations } from 'next-intl';
import { useUser } from '@/context/UserContext';
import { useSWRFetch } from '@/hooks/useSWRFetch';
import { telegramHaptic } from '@/lib/telegram';
import { copyToClipboard } from '@/lib/clipboard';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';

const UsdtLogo = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 200 200" fill="currentColor" className={className} width="1em" height="1em">
    <path d="M100 0C44.772 0 0 44.772 0 100s44.772 100 100 100 100-44.772 100-100S155.228 0 100 0zm33.593 72.842v15.932h-22.956V145.4h-21.272V88.774H66.407V72.842h67.186z"/>
  </svg>
);

interface EarningPoint {
  date: string;
  amount: number;
}

// Interface removed since it was unused

interface ReferralDashboardProps {
  referralCode?: string;
  botUsername?: string;
}

// SVG earnings chart component
function EarningsChart({ data }: { data: EarningPoint[] }) {
  const WIDTH = 300;
  const HEIGHT = 80;
  const PAD = 8;

  if (!data || data.length === 0) {
    // Empty state with subtle flat line
    const midY = PAD + (HEIGHT - PAD * 2) / 2;
    return (
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full text-brand-muted" style={{ height: HEIGHT }}>
        <defs>
          <linearGradient id="emptyGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.15" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={`M ${PAD},${midY} L ${WIDTH - PAD},${midY}`} stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.45" fill="none" />
        <text x={WIDTH / 2} y={HEIGHT / 2 + 4} textAnchor="middle" fill="currentColor" fontSize="9" opacity="0.8" fontWeight="700" letterSpacing="1">NO EARNINGS YET</text>
      </svg>
    );
  }

  // Build 30-day scaffold with zeros for missing days
  const today = new Date();
  const days30: EarningPoint[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const existing = data.find(p => p.date === key);
    days30.push({ date: key, amount: existing ? existing.amount : 0 });
  }

  const maxVal = Math.max(...days30.map(p => p.amount), 0.001);
  const pts = days30.map((p, i) => {
    const x = PAD + (i / (days30.length - 1)) * (WIDTH - PAD * 2);
    const y = PAD + (1 - p.amount / maxVal) * (HEIGHT - PAD * 2);
    return { x, y };
  });

  const pathD = pts
    .map((p, i) => (i === 0 ? `M ${p.x},${p.y}` : `L ${p.x},${p.y}`))
    .join(' ');

  const areaD = `${pathD} L ${pts[pts.length - 1].x},${HEIGHT - PAD} L ${pts[0].x},${HEIGHT - PAD} Z`;

  return (
    <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full text-emerald-500" style={{ height: HEIGHT }}>
      <defs>
        <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.35" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill="url(#chartGrad)" />
      <path d={pathD} stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinejoin="round" />
      {/* Dots for each data point with value */}
      {pts.map((p, i) =>
        days30[i].amount > 0 ? (
          <circle key={i} cx={p.x} cy={p.y} r="2.5" fill="currentColor" opacity="0.85" />
        ) : null
      )}
    </svg>
  );
}

export default function ReferralDashboard({ referralCode, botUsername = 'FinChess_bot' }: ReferralDashboardProps) {
  const t = useTranslations('Referral');
  const { stats: userStats } = useUser();
  const { data: statsData, isLoading: loading } = useSWRFetch('/api/v1/users/referrals/stats');

  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'total' | 'active' | 'rate' | 'earnings'>('total');
  const [showQr, setShowQr] = useState(false);
  
  const code = userStats?.referral_code || referralCode || '';
  const botUsernameToUse = userStats?.bot_username || botUsername;

  // Use mock data if error or loading fails (matching previous fallback logic)
  const stats = statsData || {
    total_referrals: 0,
    active_referrals: 0,
    total_earnings_usdt: 0,
    earnings_chart: []
  };

  const inviteLink = `https://t.me/${botUsernameToUse}?start=ref_${code}`;

  const handleCopy = () => {
    copyToClipboard(inviteLink).then((ok) => {
      if (!ok) return;
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      telegramHaptic('success');
    });
  };

  const handleShare = () => {
    const text = encodeURIComponent(`🏆 Join me on FinChess! Play chess, earn real USDT rewards. ♟️`);
    const url = encodeURIComponent(inviteLink);
    window.open(`https://t.me/share/url?url=${url}&text=${text}`, '_blank');
  };

  const totalCount = stats?.total_referrals ?? 0;
  const activeCount = stats?.active_referrals ?? 0;
  const totalEarnings = stats?.total_earnings_usdt ?? 0;

  const tabs = [
    {
      id: 'total' as const,
      label: t('total_label'),
      icon: <FaUsers />,
      value: loading ? <div className="h-4 w-10 bg-current/20 animate-pulse rounded" /> : totalCount.toString(),
      color: 'purple',
    },
    {
      id: 'active' as const,
      label: t('active_label'),
      icon: <FaBolt />,
      value: loading ? <div className="h-4 w-8 bg-current/20 animate-pulse rounded" /> : activeCount.toString(),
      color: 'emerald',
    },
    {
      id: 'rate' as const,
      label: 'RATE',
      icon: <span className="font-extrabold text-[12px] leading-none">%</span>,
      value: '15%',
      color: 'blue',
    },
    {
      id: 'earnings' as const,
      label: 'EARNED',
      icon: <UsdtLogo className="text-[16px]" />,
      value: loading ? <div className="h-4 w-12 bg-current/20 animate-pulse rounded" /> : `${totalEarnings.toFixed(2)}`,
      color: 'amber',
    },
  ];

  const getColorClasses = (color: string, isActive: boolean) => {
    const styles = {
      purple: {
        activeBg: 'border-purple-500/40 bg-gradient-to-br from-purple-500/12 to-brand-surface/60 shadow-[0_4px_24px_rgba(168,85,247,0.14)]',
        inactiveBg: 'border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-brand-surface/30 hover:border-purple-500/35 hover:from-purple-500/8',
        activeIcon: 'bg-gradient-to-br from-purple-500/20 to-purple-500/5 border-purple-500/35 shadow-[0_0_12px_rgba(168,85,247,0.25)] text-purple-500 dark:text-purple-400',
        inactiveIcon: 'bg-gradient-to-br from-purple-500/10 to-purple-500/3 border-purple-500/20 text-purple-500/60 dark:text-purple-400/60',
        activeText: 'text-purple-600 dark:text-purple-400',
        inactiveText: 'text-purple-500/70 dark:text-purple-400/60',
      },
      emerald: {
        activeBg: 'border-emerald-500/40 bg-gradient-to-br from-emerald-500/12 to-brand-surface/60 shadow-[0_4px_24px_rgba(16,185,129,0.14)]',
        inactiveBg: 'border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-brand-surface/30 hover:border-emerald-500/35 hover:from-emerald-500/8',
        activeIcon: 'bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 border-emerald-500/35 shadow-[0_0_12px_rgba(16,185,129,0.25)] text-emerald-500 dark:text-emerald-400',
        inactiveIcon: 'bg-gradient-to-br from-emerald-500/10 to-emerald-500/3 border-emerald-500/20 text-emerald-500/60 dark:text-emerald-400/60',
        activeText: 'text-emerald-600 dark:text-emerald-400',
        inactiveText: 'text-emerald-500/70 dark:text-emerald-400/60',
      },
      blue: {
        activeBg: 'border-blue-500/40 bg-gradient-to-br from-blue-500/12 to-brand-surface/60 shadow-[0_4px_24px_rgba(59,130,246,0.14)]',
        inactiveBg: 'border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-brand-surface/30 hover:border-blue-500/35 hover:from-blue-500/8',
        activeIcon: 'bg-gradient-to-br from-blue-500/20 to-blue-500/5 border-blue-500/35 shadow-[0_0_12px_rgba(59,130,246,0.25)] text-blue-500 dark:text-blue-400',
        inactiveIcon: 'bg-gradient-to-br from-blue-500/10 to-blue-500/3 border-blue-500/20 text-blue-500/60 dark:text-blue-400/60',
        activeText: 'text-blue-600 dark:text-blue-400',
        inactiveText: 'text-blue-500/70 dark:text-blue-400/60',
      },
      amber: {
        activeBg: 'border-amber-500/40 bg-gradient-to-br from-amber-500/12 to-brand-surface/60 shadow-[0_4px_24px_rgba(245,158,11,0.14)]',
        inactiveBg: 'border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-brand-surface/30 hover:border-amber-500/35 hover:from-amber-500/8',
        activeIcon: 'bg-gradient-to-br from-amber-500/20 to-amber-500/5 border-amber-500/35 shadow-[0_0_12px_rgba(245,158,11,0.25)] text-amber-500 dark:text-amber-400',
        inactiveIcon: 'bg-gradient-to-br from-amber-500/10 to-amber-500/3 border-amber-500/20 text-amber-500/60 dark:text-amber-400/60',
        activeText: 'text-amber-600 dark:text-amber-400',
        inactiveText: 'text-amber-500/70 dark:text-amber-400/60',
      },
    }[color as 'purple' | 'emerald' | 'blue' | 'amber'];
  
    return isActive
      ? { bg: styles.activeBg, icon: styles.activeIcon, text: styles.activeText }
      : { bg: styles.inactiveBg, icon: styles.inactiveIcon, text: styles.inactiveText };
  };

  const activeTabColor = tabs.find(t => t.id === activeTab)?.color || 'emerald';
  const detailStyles = {
    purple: { text: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
    emerald: { text: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
    blue: { text: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
    amber: { text: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
  }[activeTabColor as 'purple' | 'emerald' | 'blue' | 'amber'];

  return (
    <div className="w-full space-y-4">
      {/* Header */}
      <div className="flex justify-center mb-2">
        <Badge variant="outline" className="gap-2 border-brand-border-opacity-20 text-brand-muted">
          <FaChartLine className="text-[10px]" />
          {t('dashboard_title')}
        </Badge>
      </div>

      {/* Web3 Metric Family */}
      <div className="grid grid-cols-2 gap-3">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const colors = getColorClasses(tab.color, isActive);
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              aria-pressed={isActive}
              className={`relative min-h-24 rounded-2xl p-4 flex items-center gap-3 border transition-colors duration-200 text-left w-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 overflow-hidden
                ${colors.bg}`}
            >
              {/* Glowing Indicator Dot */}
              {isActive && (
                <motion.div
                  layoutId="activeTabIndicator"
                  className={`absolute top-2.5 right-2.5 w-1.5 h-1.5 rounded-full shadow-[0_0_8px_currentColor] ${colors.text}`}
                  style={{ backgroundColor: 'currentColor' }}
                />
              )}

              {/* Icon Container */}
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-colors ${colors.icon}`}
              >
                {tab.icon}
              </div>

              {/* Value / Label */}
              <div className="flex flex-col min-w-0 flex-1 z-10">
                <span className="text-xl font-black leading-none text-brand-primary truncate">
                  {tab.value}
                </span>
                <span className={`text-[10px] font-black uppercase tracking-widest mt-1 truncate header-balanced ${colors.text}`}>
                  {tab.label}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Detail panel */}
      <motion.div
        key={activeTab}
        initial={false}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.15 }}
        className="w-full"
      >
          <Card variant="solid" className="w-full border-brand-border-opacity-20">
          {activeTab === 'total' && (
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black text-brand-muted uppercase tracking-widest">{t('total_desc_label')}</p>
                  <p className={`text-xl font-black ${detailStyles.text} leading-none mt-1`}>{loading ? '…' : totalCount}</p>
                  <p className="text-[10px] font-bold text-brand-muted uppercase tracking-widest mt-0.5">{t('total_sublabel')}</p>
                </div>
                <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center ${detailStyles.bg}`}>
                  <FaUsers className={`${detailStyles.text} text-lg`} />
                </div>
              </div>
              <p className="text-[10px] text-brand-muted font-medium leading-relaxed">
                {t('total_detail')}
              </p>
            </div>
          )}

          {activeTab === 'active' && (
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black text-brand-muted uppercase tracking-widest">{t('active_desc_label')}</p>
                  <p className={`text-xl font-black ${detailStyles.text} leading-none mt-1`}>{loading ? '…' : activeCount}</p>
                  <p className="text-[10px] font-bold text-brand-muted uppercase tracking-widest mt-0.5">{t('active_sublabel')}</p>
                </div>
                <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center ${detailStyles.bg}`}>
                  <FaBolt className={`${detailStyles.text} text-lg`} />
                </div>
              </div>
              {/* Active ratio bar */}
              {(stats?.total_referrals ?? 0) > 0 && (
                <div>
                  <div className="flex justify-between text-[10px] font-black text-brand-muted uppercase tracking-widest mb-1">
                    <span>{t('activity_rate')}</span>
                    <span>{Math.round(((stats?.active_referrals ?? 0) / (stats?.total_referrals ?? 1)) * 100)}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-brand-elevated overflow-hidden border border-brand-border-opacity-20">
                    <motion.div
                      initial={false}
                      animate={{ width: `${Math.round(((stats?.active_referrals ?? 0) / (stats?.total_referrals ?? 1)) * 100)}%` }}
                      transition={{ duration: 0.2, ease: 'easeOut' }}
                      className={`h-full rounded-full bg-current ${detailStyles.text}`}
                    />
                  </div>
                </div>
              )}
              <p className="text-[10px] text-brand-muted font-medium leading-relaxed">
                {t('active_detail')}
              </p>
            </div>
          )}

          {activeTab === 'rate' && (
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black text-brand-muted uppercase tracking-widest">Share Commission Rate</p>
                  <p className={`text-xl font-black ${detailStyles.text} leading-none mt-1`}>15% Lifetime</p>
                  <p className="text-[10px] font-bold text-brand-muted uppercase tracking-widest mt-0.5">Of Platform Rake Fee</p>
                </div>
                <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center ${detailStyles.bg}`}>
                  <span className={`${detailStyles.text} text-lg font-black`}>%</span>
                </div>
              </div>
              <p className="text-[10px] text-brand-muted font-medium leading-relaxed">
                Earn 15% of the 3% platform rake fee collected from all games played by your referrals, instantly credited to your wallet in USDT.
              </p>
            </div>
          )}

          {activeTab === 'earnings' && (
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black text-brand-muted uppercase tracking-widest">{t('earnings_desc_label')}</p>
                  <p className={`text-xl font-black ${detailStyles.text} leading-none mt-1`}>
                    ${loading ? '0.00' : (stats?.total_earnings_usdt ?? 0).toFixed(2)}
                  </p>
                  <p className="text-[10px] font-bold text-brand-muted uppercase tracking-widest mt-0.5">USDT {t('total_earned')}</p>
                </div>
                <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center ${detailStyles.bg}`}>
                  <FaDollarSign className={`${detailStyles.text} text-lg`} />
                </div>
              </div>
              {/* SVG Chart */}
              <div className="rounded-xl overflow-hidden border border-brand-border-opacity-20 bg-brand-elevated">
                <div className="px-3 pt-2 pb-1">
                  <p className="text-[10px] font-black text-brand-muted uppercase tracking-widest">{t('chart_label')}</p>
                </div>
                <div className="px-2 pb-2">
                  <EarningsChart data={stats?.earnings_chart ?? []} />
                </div>
              </div>
              <p className="text-[10px] text-brand-muted font-medium leading-relaxed">
                {t('earnings_detail')}
              </p>
            </div>
          )}
          </Card>
      </motion.div>

      {/* Coupon Ticket Referral Code Card (inspired by Fintech Referral Template) */}
      <div className="relative w-full rounded-2xl border-2 border-dashed border-purple-500/35 bg-gradient-to-br from-purple-500/10 via-brand-surface to-brand-void p-4 space-y-3.5 shadow-sm overflow-hidden mt-1">
        {/* Perforated ticket ambient glow */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-purple-500/15 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between relative z-10">
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-purple-400 uppercase tracking-[0.16em] flex items-center gap-1.5">
              🎟️ {t('your_link')}
              <span className="px-1.5 py-0.2 rounded-md text-[8px] font-black bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-sm">VIP</span>
            </span>
            <span className="text-[9px] font-bold text-brand-muted uppercase tracking-widest mt-0.5">Share coupon to earn 15%</span>
          </div>
          <div className="px-2 py-0.5 rounded-full border border-purple-500/30 bg-purple-500/10 text-[9px] font-black text-purple-400 uppercase tracking-widest shadow-sm">
            +50 XP
          </div>
        </div>

        <div className="flex items-center gap-2 relative z-10">
          <button
            type="button"
            onClick={handleCopy}
            aria-label={`${t('copy')} ${t('your_link')}`}
            className="min-h-11 flex-1 bg-brand-void/70 border border-purple-500/25 rounded-xl px-3 py-2.5 flex items-center overflow-hidden text-left hover:border-purple-500/45 transition-colors focus-visible:ring-2 focus-visible:ring-purple-500 shadow-inner"
          >
            <span className="font-mono text-[10px] font-bold text-purple-300 tracking-wider truncate">
              {inviteLink}
            </span>
          </button>
          
          <button
            type="button"
            onClick={handleCopy}
            className={`shrink-0 h-11 px-4 flex items-center justify-center gap-1.5 font-black text-[10px] uppercase tracking-wider rounded-xl transition-all select-none ${copied ? 'bg-purple-500/20 border border-purple-500/40 text-purple-400' : 'bg-gradient-to-br from-purple-500/20 to-purple-500/5 border border-purple-500/30 text-purple-400 hover:bg-purple-500/30 shadow-sm'}`}
          >
            {copied ? <FaCheck size={12} /> : <FaCopy size={12} />}
            {copied ? t('copied') : t('copy')}
          </button>

          <button
            type="button"
            onClick={handleShare}
            aria-label={`Share ${t('your_link')}`}
            className="shrink-0 w-11 h-11 bg-brand-void/70 border border-purple-500/25 text-purple-400 rounded-xl flex items-center justify-center hover:border-purple-500/45 hover:bg-purple-500/10 transition-colors shadow-sm select-none"
          >
            <FaShareAlt size={14} />
          </button>
        </div>
        
        <Button 
          variant="outline"
          size="sm"
          onClick={() => setShowQr(!showQr)}
          aria-expanded={showQr}
          className="w-full border-purple-500/20 bg-brand-void/30 text-[9px] !text-purple-400 uppercase tracking-widest hover:border-purple-500/40 hover:bg-purple-500/10 transition-colors shadow-sm"
          leftIcon={<FaQrcode size={11} />}
        >
          {showQr ? "Hide QR Code" : "Show QR Code"}
        </Button>
      </div>

      {/* 3-Step Referral Journey Stepper */}
      <div className="w-full rounded-2xl border border-brand-border-opacity-10 bg-brand-surface/60 p-3.5 space-y-3 shadow-sm mt-1">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black text-brand-muted uppercase tracking-[0.2em]">
            How It Works
          </span>
          <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
            3 Simple Steps
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center relative">
          {/* Step 1 */}
          <div className="flex flex-col items-center space-y-1 relative z-10">
            <div className="w-7 h-7 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-black text-xs flex items-center justify-center shadow-sm">
              1
            </div>
            <span className="text-[9px] font-black uppercase text-brand-primary leading-tight header-balanced">
              Share Link
            </span>
            <span className="text-[8px] font-medium text-brand-muted leading-tight text-pretty">
              Send coupon to friends
            </span>
          </div>

          {/* Step 2 */}
          <div className="flex flex-col items-center space-y-1 relative z-10">
            <div className="w-7 h-7 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-black text-xs flex items-center justify-center shadow-sm">
              2
            </div>
            <span className="text-[9px] font-black uppercase text-brand-primary leading-tight header-balanced">
              Friend Plays
            </span>
            <span className="text-[8px] font-medium text-brand-muted leading-tight text-pretty">
              Plays match or deposits
            </span>
          </div>

          {/* Step 3 */}
          <div className="flex flex-col items-center space-y-1 relative z-10">
            <div className="w-7 h-7 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 font-black text-xs flex items-center justify-center shadow-sm">
              3
            </div>
            <span className="text-[9px] font-black uppercase text-amber-400 leading-tight header-balanced">
              Earn USDT
            </span>
            <span className="text-[8px] font-medium text-brand-muted leading-tight text-pretty">
              15% revenue share
            </span>
          </div>
        </div>
      </div>

      {/* Styled Inline QR Code Card - Collapsible */}
      <AnimatePresence>
        {showQr && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="relative rounded-[24px] border border-purple-500/30 bg-brand-void/50 p-5 flex flex-col items-center text-center space-y-4 shadow-[0_8px_32px_rgba(168,85,247,0.15)] mx-1 overflow-hidden">
              <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-purple-500/10 via-brand-void/0 to-brand-void/0 pointer-events-none" />
              
              <div className="space-y-1 relative z-10">
                <h4 className="text-[12px] font-black text-purple-400 uppercase tracking-tight shadow-purple-500/20 drop-shadow-md">FinChess Invite</h4>
                <p className="text-[10px] font-bold text-brand-muted uppercase tracking-widest">Wager • Play • Earn</p>
              </div>

              {/* Styled QR Image Wrapper */}
              <div className="relative p-2.5 bg-white/95 rounded-3xl border border-purple-500/40 shadow-[0_0_24px_rgba(168,85,247,0.2)] flex items-center justify-center shrink-0 w-48 h-48 z-10">
                {/* eslint-disable-next-line @next/next/no-img-element -- external QR service image; next/image would require remote-domain config for no benefit */}
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(inviteLink)}&color=0f172a&bgcolor=ffffff`} 
                  alt="Referral QR Code" 
                  className="w-full h-full object-contain"
                />
                
                {/* Central logo overlay (Framer Users icon) */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full border-[3px] border-purple-500/30 flex items-center justify-center shadow-lg">
                  <div className="w-7 h-7 bg-purple-500/10 rounded-full flex items-center justify-center border border-purple-500/20">
                    <FaUsers size={12} className="text-purple-600" />
                  </div>
                </div>
              </div>

              <div className="space-y-1 relative z-10">
                <p className="text-[10px] font-bold text-brand-muted uppercase leading-normal px-2 max-w-[240px] mx-auto">
                  Show this code to your friend in person. They can scan it with their phone camera to join your network.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
