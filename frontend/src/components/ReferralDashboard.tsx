'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaUserPlus, FaCopy, FaCheck, FaShareAlt, FaUsers, FaBolt, FaDollarSign, FaChartLine } from 'react-icons/fa';
import { useTranslations } from 'next-intl';
import { apiFetch } from '@/lib/api';

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
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'total' | 'active' | 'earnings'>('total');
  const [code, setCode] = useState(referralCode || '');
  const [bot, setBot] = useState(botUsername);

  useEffect(() => {
    // Fetch user sync for code + bot username
    apiFetch('/api/v1/users/sync', { method: 'POST' })
      .then(r => r.json())
      .then(data => {
        if (data?.referral_code) setCode(data.referral_code);
        if (data?.bot_username) setBot(data.bot_username);
      })
      .catch(() => {});

    // Fetch referral stats
    apiFetch('/api/v1/users/referrals/stats')
      .then(r => r.json())
      .then((data: ReferralStats) => {
        setStats(data);
        setLoading(false);
      })
      .catch(() => {
        // Use mock data in dev
        setStats({
          total_referrals: 0,
          active_referrals: 0,
          total_earnings_usdt: 0,
          earnings_chart: []
        });
        setLoading(false);
      });
  }, []);

  const inviteLink = `https://t.me/${bot}/app?startapp=ref_${code}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp?.HapticFeedback) {
      (window as any).Telegram.WebApp.HapticFeedback.notificationOccurred('success');
    }
  };

  const handleShare = () => {
    const text = encodeURIComponent(`🏆 Join me on FinChess! Play chess, earn real USDT rewards. ♟️`);
    const url = encodeURIComponent(inviteLink);
    window.open(`https://t.me/share/url?url=${url}&text=${text}`, '_blank');
  };

  const totalCount = useCountUp(stats?.total_referrals ?? 0);
  const activeCount = useCountUp(stats?.active_referrals ?? 0);

  const tabs = [
    {
      id: 'total' as const,
      label: t('total_label'),
      icon: <FaUsers />,
      value: loading ? '—' : totalCount.toString(),
      sublabel: t('total_sublabel'),
      color: 'text-violet-400',
      border: 'border-violet-500/40',
      bg: 'bg-violet-500/10',
    },
    {
      id: 'active' as const,
      label: t('active_label'),
      icon: <FaBolt />,
      value: loading ? '—' : activeCount.toString(),
      sublabel: t('active_sublabel'),
      color: 'text-amber-400',
      border: 'border-amber-500/40',
      bg: 'bg-amber-500/10',
    },
    {
      id: 'earnings' as const,
      label: t('earnings_label'),
      icon: <FaDollarSign />,
      value: loading ? '—' : `$${(stats?.total_earnings_usdt ?? 0).toFixed(3)}`,
      sublabel: 'USDT',
      color: 'text-emerald-400',
      border: 'border-emerald-500/40',
      bg: 'bg-emerald-500/10',
    },
  ];

  return (
    <div className="w-full space-y-3">
      {/* Header */}
      <div className="flex items-center justify-center gap-2 mb-1">
        <FaChartLine className="text-brand-primary opacity-60 text-sm" />
        <h3 className="text-[10px] font-black text-brand-primary uppercase tracking-[0.2em] opacity-70">
          {t('dashboard_title')}
        </h3>
      </div>

      {/* Three metric blocks */}
      <div className="grid grid-cols-3 gap-2">
        {tabs.map((tab) => (
          <motion.button
            key={tab.id}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveTab(tab.id)}
            className={`glass-panel rounded-2xl p-3 flex flex-col items-center text-center border transition-all duration-300 cursor-pointer
              ${activeTab === tab.id ? `${tab.border} ${tab.bg}` : 'border-brand-border-opacity-10 bg-brand-surface'}`}
          >
            <span className={`text-xs mb-1 ${activeTab === tab.id ? tab.color : 'text-brand-primary opacity-40'}`}>
              {tab.icon}
            </span>
            <span className={`text-base font-black leading-none ${activeTab === tab.id ? tab.color : 'text-brand-primary'}`}>
              {tab.value}
            </span>
            <span className={`text-[7.5px] font-black uppercase tracking-wider mt-1 ${activeTab === tab.id ? tab.color + ' opacity-80' : 'text-brand-primary opacity-30'}`}>
              {tab.label}
            </span>
          </motion.button>
        ))}
      </div>

      {/* Detail panel */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2 }}
          className="glass-panel rounded-2xl border border-brand-border-opacity-10 bg-brand-surface overflow-hidden"
        >
          {activeTab === 'total' && (
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[9px] font-black text-brand-primary opacity-40 uppercase tracking-widest">{t('total_desc_label')}</p>
                  <p className="text-xl font-black text-violet-400 leading-none mt-1">{loading ? '…' : totalCount}</p>
                  <p className="text-[8px] font-bold text-brand-primary opacity-30 uppercase tracking-widest mt-0.5">{t('total_sublabel')}</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                  <FaUsers className="text-violet-400 text-lg" />
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
                  <p className="text-xl font-black text-amber-400 leading-none mt-1">{loading ? '…' : activeCount}</p>
                  <p className="text-[8px] font-bold text-brand-primary opacity-30 uppercase tracking-widest mt-0.5">{t('active_sublabel')}</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                  <FaBolt className="text-amber-400 text-lg" />
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
                      className="h-full bg-amber-400 rounded-full"
                    />
                  </div>
                </div>
              )}
              <p className="text-[9px] text-brand-primary opacity-40 font-medium leading-relaxed">
                {t('active_detail')}
              </p>
            </div>
          )}

          {activeTab === 'earnings' && (
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[9px] font-black text-brand-primary opacity-40 uppercase tracking-widest">{t('earnings_desc_label')}</p>
                  <p className="text-xl font-black text-emerald-400 leading-none mt-1">
                    ${loading ? '0.000' : (stats?.total_earnings_usdt ?? 0).toFixed(3)}
                  </p>
                  <p className="text-[8px] font-bold text-brand-primary opacity-30 uppercase tracking-widest mt-0.5">USDT {t('total_earned')}</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <FaDollarSign className="text-emerald-400 text-lg" />
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

      {/* Invite Link block */}
      <div className="glass-panel rounded-2xl border border-brand-border-opacity-10 bg-brand-surface p-4 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <p className="text-[9px] font-black text-brand-primary opacity-40 uppercase tracking-widest flex-1">{t('your_link')}</p>
          <span className="text-[8px] font-black text-brand-primary opacity-20 uppercase tracking-widest">+50 XP</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-brand-void/40 border border-brand-border-opacity-5 rounded-xl px-3 py-2.5 flex items-center overflow-hidden">
            <span className="font-mono text-[9px] font-bold text-brand-primary opacity-60 tracking-wider truncate">
              {code || 'Loading...'}
            </span>
          </div>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleCopy}
            className={`shrink-0 rounded-xl px-3 py-2.5 flex items-center gap-1.5 font-black text-[9px] uppercase tracking-wider transition-all
              ${copied ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400' : 'bg-brand-primary/10 border border-brand-border-opacity-10 text-brand-primary'}`}
          >
            {copied ? <FaCheck size={10} /> : <FaCopy size={10} />}
            {copied ? t('copied') : t('copy')}
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleShare}
            className="shrink-0 w-10 h-10 bg-brand-primary text-brand-void rounded-xl flex items-center justify-center shadow-premium"
          >
            <FaShareAlt size={12} />
          </motion.button>
        </div>
      </div>
    </div>
  );
}
