'use client';

import { motion } from "framer-motion";
import LayoutWrapper from "@/components/LayoutWrapper";
import LessonCard from "@/components/Academy/LessonCard";
import { FaBrain, FaChessKnight, FaChessRook, FaChessBishop, FaFire } from "react-icons/fa";
import Link from "next/link";
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';

export default function AcademyPage() {
 const locale = useLocale();
 const t = useTranslations('Academy');
 const router = useRouter();

 return (
 <LayoutWrapper className="pb-32 pt-6">
 <div className="w-full max-w-sm mx-auto px-4 space-y-8">

 {/* Header */}
 <div className="flex flex-col items-center w-full mb-8">
 <motion.div
 initial={{ opacity: 0, y: -10 }}
 animate={{ opacity: 1, y: 0 }}
 className="flex items-center gap-3 text-brand-primary text-3xl font-black tracking-tighter select-none"
 >
 <FaBrain className="text-2xl opacity-80" />
 {t('title')}
 </motion.div>
 <div className="h-px w-10 bg-brand-border-opacity-10 my-2" />
 <span className="text-[8px] font-bold uppercase tracking-[0.4em] text-brand-primary opacity-30">{t('subtitle')}</span>
 </div>

 {/* Daily Challenge Section */}
 <motion.div
 initial={{ opacity: 0, scale: 0.95 }}
 animate={{ opacity: 1, scale: 1 }}
 className="w-full glass-panel p-6 rounded-3xl border border-brand-border-opacity-10 bg-brand-surface relative overflow-hidden group hover:bg-brand-bg-opacity-5 transition-all cursor-pointer shadow-sm"
 >
 <div className="absolute top-0 right-0 w-48 h-48 bg-brand-bg-opacity-5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />

 <div className="relative z-10">
 <div className="flex justify-between items-start mb-4">
 <span className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-brand-primary opacity-60 bg-brand-bg-opacity-5 px-2.5 py-1.5 rounded-full border border-brand-border-opacity-10">
 <FaFire className="text-brand-primary opacity-80" /> {t('daily_challenge')}
 </span>
 <span className="text-xs font-bold text-brand-primary">+50 XP</span>
 </div>

 <h2 className="text-2xl font-black tracking-tight text-brand-primary uppercase mb-2">{t('mate_in_2')}</h2>
 <p className="text-sm text-brand-primary opacity-60 font-medium mb-6">{t('puzzle_desc')}</p>

 <Link href={`/${locale}/academy/puzzle`}>
 <button className="w-full py-3 rounded-xl bg-brand-primary text-brand-void font-black uppercase tracking-widest text-xs cursor-pointer shadow-sm">
 {t('start_puzzle')}
 </button>
 </Link>
 </div>
 </motion.div>

 {/* Mastery Tracks Grid */}
 <div className="space-y-6">
 <div className="flex items-center gap-2 mb-2 px-1">
 <FaChessKnight className="text-brand-primary opacity-40" />
 <h3 className="text-xs font-black uppercase tracking-widest text-brand-primary opacity-60">{t('mastery_tracks')}</h3>
 </div>

 <div className="grid grid-cols-1 gap-4">
 <LessonCard
 title={t('opening_title')}
 description={t('opening_desc')}
 progress={30}
 difficulty={t('beginner')}
 duration="10 min"
 onClick={() => router.push(`/${locale}/academy/lesson/opening-principles`)}
 />
 <LessonCard
 title={t('tactics_title')}
 description={t('tactics_desc')}
 progress={0}
 difficulty={t('intermediate')}
 duration="15 min"
 onClick={() => router.push(`/${locale}/academy/lesson/tactical-patterns`)}
 />
 <LessonCard
 title={t('endgame_title')}
 description={t('endgame_desc')}
 progress={0}
 difficulty={t('advanced')}
 duration="20 min"
 locked={true}
 />
 </div>
 </div>

 {/* Recent Analysis */}
 <div className="opacity-50">
 <div className="flex items-center gap-2 mb-2 px-1">
 <FaChessBishop className="text-brand-primary opacity-40" />
 <h3 className="text-xs font-black uppercase tracking-widest text-brand-primary opacity-60">{t('recent_analysis')}</h3>
 </div>
 <div className="w-full p-4 rounded-2xl border border-brand-border-opacity-10 bg-brand-surface flex items-center justify-center h-24 text-[10px] uppercase tracking-widest text-brand-primary opacity-30 font-bold shadow-sm">
 {t('no_analysis')}
 </div>
 </div>

 </div>
 </LayoutWrapper>
 );
}
