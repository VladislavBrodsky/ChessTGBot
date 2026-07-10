'use client';

import { motion } from 'framer-motion';
import { FaCheck, FaTimes, FaShieldAlt, FaGamepad, FaTrophy, FaPalette, FaDownload } from 'react-icons/fa';
import { useTranslations } from 'next-intl';

export default function TierComparison() {
 const tc = useTranslations('TierComparison');

 const COMPARISON_DATA = [
  { feature: tc('feat_p2e'), basic: false, premium: true, icon: <FaShieldAlt /> },
  { feature: tc('feat_ranking'), basic: true, premium: true, icon: <FaTrophy /> },
  { feature: tc('feat_skins'), basic: false, premium: true, icon: <FaPalette /> },
  { feature: tc('feat_downloads'), basic: false, premium: true, icon: <FaDownload /> },
  { feature: tc('feat_matchmaking'), basic: false, premium: true, icon: <FaGamepad /> },
  { feature: tc('feat_ads'), basic: false, premium: true, icon: <FaShieldAlt /> },
 ];

  return (
   <div className="w-full space-y-6 mt-12 pb-12">
   <div className="flex flex-col items-center space-y-2 mb-8">
   <h3 className="text-sm font-black text-brand-primary tracking-tighter uppercase leading-none">{tc('title')}</h3>
   <div className="h-px w-8 bg-brand-border-opacity-20" />
   <span className="text-[8px] font-bold text-brand-primary opacity-35 tracking-[0.4em] uppercase">{tc('subtitle')}</span>
   </div>

   <div className="w-full glass-panel bg-brand-surface border border-brand-border-opacity-10 rounded-[24px] overflow-hidden shadow-sm">
   {/* Table Header */}
   <div className="grid grid-cols-6 p-4 border-b border-brand-border-opacity-10 bg-brand-primary/5">
   <div className="col-span-4 text-[9px] font-black uppercase text-brand-primary opacity-40 tracking-widest">{tc('capability')}</div>
   <div className="col-span-1 text-center text-[9px] font-black uppercase text-brand-primary opacity-40 tracking-widest">{tc('base')}</div>
   <div className="col-span-1 text-center text-[9px] font-black uppercase text-brand-primary tracking-widest">{tc('elite')}</div>
   </div>

   {/* Table Rows */}
   <div className="divide-y divide-brand-border-opacity-5">
   {COMPARISON_DATA.map((row, idx) => (
   <motion.div
   key={idx}
   initial={{ opacity: 0, y: 5 }}
   animate={{ opacity: 1, y: 0 }}
   transition={{ delay: idx * 0.05 }}
   className="grid grid-cols-6 p-4 items-center group hover:bg-brand-primary/5 transition-colors"
   >
   <div className="col-span-4 flex items-center gap-3">
   <div className="text-brand-primary opacity-25 group-hover:opacity-60 transition-colors">
   {row.icon}
   </div>
   <span className="text-[10px] font-bold text-brand-primary opacity-60 uppercase tracking-tight">
   {row.feature}
   </span>
   </div>
   <div className="col-span-1 flex justify-center">
   {row.basic ? (
   <FaCheck className="text-emerald-500 opacity-50" fontSize={10} />
   ) : (
   <FaTimes className="text-brand-primary opacity-20" fontSize={10} />
   )}
   </div>
   <div className="col-span-1 flex justify-center">
   {row.premium ? (
   <FaCheck className="text-brand-primary" fontSize={10} />
   ) : (
   <FaTimes className="text-brand-primary opacity-20" fontSize={10} />
   )}
   </div>
   </motion.div>
   ))}
   </div>
   </div>

   {/* Bottom Insight */}
   <div className="p-4 rounded-2xl bg-brand-primary/5 border border-brand-border-opacity-10 text-center">
   <p className="text-[9px] font-black text-brand-primary uppercase tracking-widest">
   {tc('bottom_insight')}
   </p>
   </div>
   </div>
  );
}
