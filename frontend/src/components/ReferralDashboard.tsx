'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaUserPlus, FaCopy, FaCheck, FaShareAlt, FaUsers, FaBolt, FaDollarSign, FaChartLine, FaQrcode } from 'react-icons/fa';
import { useTranslations } from 'next-intl';
import { apiFetch } from '@/lib/api';
import { useUser } from '@/context/UserContext';
import { useSWRFetch } from '@/hooks/useSWRFetch';
import { telegramHaptic } from '@/lib/telegram';
import { copyToClipboard } from '@/lib/clipboard';

const UsdtLogo = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 200 200" fill="currentColor" className={className} width="1em" height="1em">
    <path d="M100 0C44.772 0 0 44.772 0 100s44.772 100 100 100 100-44.772 100-100S155.228 0 100 0zm33.593 72.842v15.932h-22.956V145.4h-21.272V88.774H66.407V72.842h67.186z"/>
  </svg>
);

interface EarningPoint {
  date: string;
  amount: number;
}

interface ReferralStats {
  total_referrals: number;
  active_referrals: number;
  total_earnings_usdt: number;
  earnings_chart: EarningPoint[];
}

interface ReferralDashboardProps {
  referralCode?: string;
  botUsername?: string;
}

// Animated counter hook
function useCountUp(target: number, duration = 1200) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (target === 0) { setValue(0); return; }
    const start = Date.now();
    const step = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration]);
  return value;
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
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full" style={{ height: HEIGHT }}>
        <defs>
          <linearGradient id="emptyGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#a78bfa" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={`M ${PAD},${midY} L ${WIDTH - PAD},${midY}`} stroke="#a78bfa" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.3" fill="none" />
        <text x={WIDTH / 2} y={HEIGHT / 2 + 4} textAnchor="middle" fill="#a78bfa" fontSize="9" opacity="0.4" fontWeight="700" letterSpacing="1">NO EARNINGS YET</text>
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
    <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full" style={{ height: HEIGHT }}>
      <defs>
        <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill="url(#chartGrad)" />
      <path d={pathD} stroke="#10b981" strokeWidth="1.5" fill="none" strokeLinejoin="round" />
      {/* Dots for each data point with value */}
      {pts.map((p, i) =>
        days30[i].amount > 0 ? (
          <circle key={i} cx={p.x} cy={p.y} r="2.5" fill="#10b981" opacity="0.85" />
        ) : null
      )}
    </svg>
  );
}

export default function ReferralDashboard({ referralCode, botUsername = 'FinChess_bot' }: ReferralDashboardProps) {
  const t = useTranslations('Referral');
  const { stats: userStats } = useUser();
  const { data: statsData, isLoading: loading, error: statsError } = useSWRFetch('/api/v1/users/referrals/stats');

  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'total' | 'active' | 'rate' | 'earnings'>('total');
  const [showQr, setShowQr] = useState(false);
  
  const code = userStats?.referral_code || referralCode || '';
  const bot = userStats?.bot_username || botUsername;

  // Use mock data if error or loading fails (matching previous fallback logic)
  const stats = statsData || {
    total_referrals: 0,
    active_referrals: 0,
    total_earnings_usdt: 0,
    earnings_chart: []
  };

  const inviteLink = `https://t.me/chess_matbot?start=ref_${code}`;

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

  const totalCount = useCountUp(stats?.total_referrals ?? 0);
  const activeCount = useCountUp(stats?.active_referrals ?? 0);
  const totalEarnings = stats?.total_earnings_usdt ?? 0;

  const tabs = [
    {
      id: 'total' as const,
      label: t('total_label'),
      icon: <FaUsers />,
      value: loading ? <div className="h-4 w-10 bg-current/20 animate-pulse rounded" /> : totalCount.toString(),
      colorClass: 'text-brand-gold dark:text-brand-gold',
      borderClass: 'border-brand-gold/20 dark:border-brand-gold/30',
      bgClass: 'bg-gradient-to-br from-brand-gold/10 to-brand-surface/30',
      orbClass: 'bg-brand-gold/80 shadow-[0_0_8px_rgba(251,191,36,0.6)]',
      iconBoxClass: 'from-brand-gold/20 to-brand-gold/5 border-brand-gold/35 shadow-[0_0_12px_rgba(251,191,36,0.15)] text-brand-gold dark:text-brand-gold',
    },
    {
      id: 'active' as const,
      label: t('active_label'),
      icon: <FaBolt />,
      value: loading ? <div className="h-4 w-8 bg-current/20 animate-pulse rounded" /> : activeCount.toString(),
      colorClass: 'text-cyan-500 dark:text-cyan-400',
      borderClass: 'border-cyan-500/20 dark:border-cyan-500/30',
      bgClass: 'bg-gradient-to-br from-cyan-500/10 to-brand-surface/30',
      orbClass: 'bg-cyan-500/80 shadow-[0_0_8px_#06b6d4]',
      iconBoxClass: 'from-cyan-500/20 to-cyan-500/5 border-cyan-500/35 shadow-[0_0_12px_rgba(6,182,212,0.15)] text-cyan-500 dark:text-cyan-400',
    },
    {
      id: 'rate' as const,
      label: 'RATE',
      icon: <span className="font-extrabold text-[12px] leading-none">%</span>,
      value: '15%',
      colorClass: 'text-amber-500 dark:text-amber-400',
      borderClass: 'border-amber-500/20 dark:border-amber-500/30',
      bgClass: 'bg-gradient-to-br from-amber-500/10 to-brand-surface/30',
      orbClass: 'bg-amber-500/80 shadow-[0_0_8px_#f59e0b]',
      iconBoxClass: 'from-amber-500/20 to-amber-500/5 border-amber-500/35 shadow-[0_0_12px_rgba(245,158,11,0.15)] text-amber-500 dark:text-amber-400',
    },
    {
      id: 'earnings' as const,
      label: 'EARNED',
      icon: <UsdtLogo className="text-[16px]" />,
      value: loading ? <div className="h-4 w-12 bg-current/20 animate-pulse rounded" /> : `${totalEarnings.toFixed(2)}`,

      colorClass: 'text-emerald-500 dark:text-emerald-400',
      borderClass: 'border-emerald-500/20 dark:border-emerald-500/30',
      bgClass: 'bg-gradient-to-br from-emerald-500/10 to-brand-surface/30',
      orbClass: 'bg-emerald-500/80 shadow-[0_0_8px_#10b981]',
      iconBoxClass: 'from-emerald-500/20 to-emerald-500/5 border-emerald-500/35 shadow-[0_0_12px_rgba(16,185,129,0.15)] text-emerald-500 dark:text-emerald-400',
    },
  ];

  return (
    <div className="w-full space-y-4">
      {/* Header - Pill format */}
      <div className="flex justify-center mb-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-brand-primary/5 dark:bg-brand-primary/10 text-brand-primary border border-brand-border-opacity-10">
          <FaChartLine className="text-[10px] opacity-60" />
          {t('dashboard_title')}
        </div>
      </div>

      {/* 2x2 metric blocks - synced with Battles / ELO style */}
      <div className="grid grid-cols-2 gap-3">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <motion.button
              key={tab.id}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab(tab.id)}
              className={`relative overflow-hidden rounded-2xl p-4 flex items-center gap-3 border transition-all duration-300 cursor-pointer text-left w-full shadow-[0_4px_24px_rgba(0,0,0,0.06)]
                ${isActive 
                  ? `${tab.borderClass} ${tab.bgClass} shadow-md` 
                  : 'border-brand-border-opacity-10 bg-brand-surface hover:border-brand-primary/20 hover:bg-brand-surface/60'
                }`}
            >
              {/* Indicator dot */}
              <motion.div
                animate={{ opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 2, repeat: Infinity }}
                className={`absolute top-2 right-2 w-1.5 h-1.5 rounded-full ${isActive ? tab.orbClass.split(' ')[0] : 'bg-brand-primary/20'}`}
              />

              {/* Icon Container */}
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-all ${
                  isActive 
                    ? `bg-gradient-to-br ${tab.iconBoxClass}` 
                    : 'bg-brand-bg-opacity-5 border-brand-border-opacity-10 text-brand-primary opacity-40'
                }`}
              >
                {tab.icon}
              </div>

              {/* Value / Label */}
              <div className="flex flex-col min-w-0">
                <span className="text-xl font-black leading-none text-brand-primary">
                  {tab.value}
                </span>
                <span className={`text-[9px] font-black uppercase tracking-widest mt-1 ${isActive ? tab.colorClass : 'text-brand-primary opacity-50'}`}>
                  {tab.label}
                </span>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Detail panel */}
      <AnimatePresence mode="popLayout">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
          className="glass-panel rounded-2xl border border-brand-border-opacity-10 bg-brand-surface overflow-hidden"
        >
          {activeTab === 'total' && (
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[9px] font-black text-brand-primary opacity-40 uppercase tracking-widest">{t('total_desc_label')}</p>
                  <p className="text-xl font-black text-brand-gold leading-none mt-1">{loading ? '…' : totalCount}</p>
                  <p className="text-[8px] font-bold text-brand-primary opacity-30 uppercase tracking-widest mt-0.5">{t('total_sublabel')}</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-brand-gold/10 border border-brand-gold/20 flex items-center justify-center">
                  <FaUsers className="text-brand-gold text-lg" />
                </div>
              </div>
              <p className="text-[9px] text-brand-primary opacity-40 font-medium leading-relaxed">
                {t('total_detail')}
              </p>
            </div>
          )}

          {activeTab === 'active' && (
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[9px] font-black text-brand-primary opacity-40 uppercase tracking-widest">{t('active_desc_label')}</p>
                  <p className="text-xl font-black text-cyan-500 dark:text-cyan-400 leading-none mt-1">{loading ? '…' : activeCount}</p>
                  <p className="text-[8px] font-bold text-brand-primary opacity-30 uppercase tracking-widest mt-0.5">{t('active_sublabel')}</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                  <FaBolt className="text-cyan-500 dark:text-cyan-400 text-lg" />
                </div>
              </div>
              {/* Active ratio bar */}
              {(stats?.total_referrals ?? 0) > 0 && (
                <div>
                  <div className="flex justify-between text-[8px] font-black text-brand-primary opacity-30 uppercase tracking-widest mb-1">
                    <span>{t('activity_rate')}</span>
                    <span>{Math.round(((stats?.active_referrals ?? 0) / (stats?.total_referrals ?? 1)) * 100)}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-brand-void/50 overflow-hidden border border-brand-border-opacity-5">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.round(((stats?.active_referrals ?? 0) / (stats?.total_referrals ?? 1)) * 100)}%` }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                      className="h-full bg-cyan-500 dark:bg-cyan-400 rounded-full"
                    />
                  </div>
                </div>
              )}
              <p className="text-[9px] text-brand-primary opacity-40 font-medium leading-relaxed">
                {t('active_detail')}
              </p>
            </div>
          )}

          {activeTab === 'rate' && (
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[9px] font-black text-brand-primary opacity-40 uppercase tracking-widest">Share Commission Rate</p>
                  <p className="text-xl font-black text-amber-500 dark:text-amber-400 leading-none mt-1">15% Lifetime</p>
                  <p className="text-[8px] font-bold text-brand-primary opacity-30 uppercase tracking-widest mt-0.5">Of Platform Rake Fee</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                  <span className="text-amber-500 dark:text-amber-400 text-lg font-black">%</span>
                </div>
              </div>
              <p className="text-[9px] text-brand-primary opacity-40 font-medium leading-relaxed">
                Earn 15% of the 3% platform rake fee collected from all games played by your referrals, instantly credited to your wallet in USDT.
              </p>
            </div>
          )}

          {activeTab === 'earnings' && (
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[9px] font-black text-brand-primary opacity-40 uppercase tracking-widest">{t('earnings_desc_label')}</p>
                  <p className="text-xl font-black text-emerald-500 dark:text-emerald-400 leading-none mt-1">
                    ${loading ? '0.00' : (stats?.total_earnings_usdt ?? 0).toFixed(2)}
                  </p>
                  <p className="text-[8px] font-bold text-brand-primary opacity-30 uppercase tracking-widest mt-0.5">USDT {t('total_earned')}</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <FaDollarSign className="text-emerald-500 dark:text-emerald-400 text-lg" />
                </div>
              </div>
              {/* SVG Chart */}
              <div className="rounded-xl overflow-hidden border border-brand-border-opacity-5 bg-brand-void/30">
                <div className="px-3 pt-2 pb-1">
                  <p className="text-[7px] font-black text-brand-primary opacity-30 uppercase tracking-widest">{t('chart_label')}</p>
                </div>
                <div className="px-2 pb-2">
                  <EarningsChart data={stats?.earnings_chart ?? []} />
                </div>
              </div>
              <p className="text-[9px] text-brand-primary opacity-40 font-medium leading-relaxed">
                {t('earnings_detail')}
              </p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Invite Link block - Liquid Premium Styling */}
      <div className="premium-liquid-border w-full">
        <div className="premium-liquid-content p-4 space-y-4">
          
          <div className="flex items-center justify-between mb-2">
            <div className="flex flex-col">
              <p className="text-[10px] font-black text-brand-gold uppercase tracking-[0.2em] mb-1 flex items-center gap-2">
                {t('your_link')}
                <span className="text-[7.5px] font-black px-2 py-0.5 rounded-full bg-brand-gold text-brand-void tracking-wider shadow-[0_0_10px_rgba(251,191,36,0.3)]">VIP</span>
              </p>
              <p className="text-[8px] font-bold text-brand-primary/50 uppercase tracking-widest">Share to earn 15%</p>
            </div>
            <span className="text-[9px] font-black text-brand-gold/60 uppercase tracking-widest bg-brand-gold/10 px-2 py-1 rounded-full border border-brand-gold/20 shadow-inner">
              +50 XP
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex-1 bg-brand-surface border-2 border-brand-gold/30 rounded-xl px-3 py-3 flex items-center overflow-hidden shadow-inner relative group cursor-pointer transition-all hover:border-brand-gold/50" onClick={handleCopy}>
              <div className="absolute inset-0 bg-brand-gold/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              <span className="font-mono text-[10px] font-bold text-brand-primary opacity-80 tracking-wider truncate">
                {inviteLink}
              </span>
            </div>
            
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleCopy}
              className={`shrink-0 rounded-xl px-4 py-3 flex items-center justify-center gap-2 font-black text-[10px] uppercase tracking-wider transition-all shadow-md
                ${copied ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400' : 'bg-brand-gold text-brand-void hover:bg-brand-gold/90'}`}
            >
              {copied ? <FaCheck size={12} /> : <FaCopy size={12} />}
              {copied ? t('copied') : t('copy')}
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleShare}
              className="shrink-0 w-11 h-11 bg-brand-surface border-2 border-brand-gold/40 text-brand-gold rounded-xl flex items-center justify-center shadow-md hover:bg-brand-gold/10 transition-colors"
            >
              <FaShareAlt size={14} />
            </motion.button>
          </div>
          
          <button 
            onClick={() => setShowQr(!showQr)}
            className="w-full mt-2 py-2.5 rounded-xl border border-brand-gold/20 bg-brand-gold/5 text-[9px] font-bold text-brand-gold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-brand-gold/10 transition-colors"
          >
            <FaQrcode size={12} />
            {showQr ? "Hide QR Code" : "Show QR Code"}
          </button>
        </div>
      </div>

      {/* Styled Inline QR Code Card - Collapsible */}
      <AnimatePresence>
        {showQr && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="glass-panel rounded-[24px] border border-brand-border-opacity-10 bg-brand-surface p-5 flex flex-col items-center text-center space-y-4 shadow-[0_4px_24px_rgba(0,0,0,0.06)] relative overflow-hidden mx-1">
              
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-brand-gold/5 rounded-full blur-[60px] pointer-events-none" />

              <div className="space-y-1 relative z-10">
                <h4 className="text-[12px] font-black text-brand-gold uppercase tracking-tight drop-shadow-[0_0_8px_rgba(251,191,36,0.3)]">FinChess Invite Matrix</h4>
                <p className="text-[8px] font-bold text-brand-primary opacity-45 uppercase tracking-widest">Wager • Play • Earn</p>
              </div>

              {/* Styled QR Image Wrapper */}
              <div className="relative p-2.5 bg-white rounded-3xl border-2 border-brand-gold/30 shadow-lg flex items-center justify-center shrink-0 w-48 h-48 transition-transform duration-300 hover:scale-[1.02]">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(inviteLink)}&color=0f172a&bgcolor=ffffff`} 
                  alt="Referral QR Code" 
                  className="w-full h-full object-contain"
                />
                
                {/* Central logo overlay (Framer Users icon) */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-9 h-9 bg-white rounded-full border-2 border-brand-gold/30 flex items-center justify-center shadow-md">
                  <div className="w-7 h-7 bg-brand-gold/10 rounded-full flex items-center justify-center border border-brand-gold/20">
                    <FaUsers size={12} className="text-brand-gold" />
                  </div>
                </div>
              </div>

              <div className="space-y-1 relative z-10">
                <p className="text-[8.5px] font-bold text-brand-primary opacity-45 uppercase leading-normal px-2 max-w-[240px] mx-auto">
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
