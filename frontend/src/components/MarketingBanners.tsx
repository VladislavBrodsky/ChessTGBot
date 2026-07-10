'use client';

import { motion } from 'framer-motion';
import { FaCrown, FaCoins, FaUsers, FaArrowRight } from 'react-icons/fa';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { telegramHaptic } from '@/lib/telegram';

export default function MarketingBanners() {
 const locale = useLocale();
 const tm = useTranslations('MarketingBanners');

 const BANNERS = [
  {
  id: 1,
  title: tm('banner1_title'),
  subtitle: tm('banner1_desc'),
  cta: tm('banner1_cta'),
  link: "/membership",
  color: "from-indigo-600 via-purple-600 to-pink-500",
  icon: <FaCoins className="text-4xl text-yellow-400 drop-shadow-xl animate-pulse" />,
  decoration: (
  <div style={{ backgroundColor: 'rgba(250, 204, 21, 0.2)' }} className="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 rounded-full blur-3xl animate-pulse" />
  )
  },
  {
  id: 2,
  title: tm('banner2_title'),
  subtitle: tm('banner2_desc'),
  cta: tm('banner2_cta'),
  link: "/membership",
  color: "from-blue-600 via-cyan-500 to-emerald-500",
  icon: <FaCrown className="text-4xl text-brand-primary drop-shadow-xl" />,
  decoration: (
  <div className="absolute bottom-0 left-0 -ml-10 -mb-10 w-40 h-40 bg-brand-bg-opacity-20 rounded-full blur-3xl animate-pulse" />
  )
  }
 ];

 const handleHaptic = () => {
 telegramHaptic('medium');
 };

 return (
 <div className="w-full space-y-2 px-1" style={{ perspective: '1000px' }}>
 {BANNERS.map((banner, idx) => (
 <motion.div
 key={banner.id}
 onClick={handleHaptic}
 initial={{ opacity: 0, rotateX: 20, y: 20 }}
 animate={{ opacity: 1, rotateX: 0, y: 0 }}
 whileHover={{ scale: 1.02, rotateY: 2, rotateX: -2 }}
 transition={{ delay: idx * 0.1, type: "spring", stiffness: 300, damping: 20 }}
 className={`relative overflow-hidden rounded-xl p-4 bg-linear-to-br ${banner.color} shadow-2xl group cursor-pointer`}
 >
 {/* Noise Overlay */}
 <div className="absolute inset-0 opacity-[0.12] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-repeat mix-blend-overlay" />

 {/* Glassmorphism Shine */}
 <div style={{ backgroundImage: 'linear-gradient(to top right, rgba(255,255,255,0.2), transparent, transparent)' }} className="absolute inset-0 pointer-events-none" />

 {banner.decoration}

 <div className="relative z-10 flex items-center justify-between">
 <div className="flex-1 space-y-2">
 <div className="flex items-center gap-3">
 <motion.div
 whileHover={{ scale: 1.1, rotate: 5 }}
 style={{ backgroundColor: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.2)' }}
 className="p-2 rounded-xl backdrop-blur-md border shadow-lg"
 >
 {banner.icon}
 </motion.div>
 <h3 className="text-xl font-black tracking-tighter text-white uppercase drop-shadow-md">
 {banner.title}
 </h3>
 </div>
 <p className="text-[12px] font-bold text-white opacity-90 leading-snug max-w-[220px] drop-shadow-sm">
 {banner.subtitle}
 </p>
 <Link href={`/${locale}${banner.link}`}>
 <motion.div
 whileHover={{ x: 5, scale: 1.05 }}
 whileTap={{ scale: 0.95 }}
 style={{ boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04), 0 0 0 2px rgba(255, 255, 255, 0.1)' }}
 className="inline-flex items-center gap-2 mt-3 px-4 py-2 rounded-lg bg-white text-brand-void text-[10px] font-black uppercase tracking-widest"
 >
 {banner.cta}
 <FaArrowRight fontSize={10} />
 </motion.div>
 </Link>
 </div>

 {/* 3D-like Float Asset Placeholder */}
 <motion.div
 animate={{
 y: [0, -15, 0],
 rotateZ: [0, 8, 0],
 scale: [1, 1.1, 1]
 }}
 transition={{
 duration: 5,
 repeat: Infinity,
 ease: "easeInOut"
 }}
 className="hidden xs:flex w-24 h-24 items-center justify-center relative"
 >
 <div className="absolute inset-0 bg-white opacity-10 rounded-full blur-2xl animate-pulse" />
 <div 
 style={{ background: 'linear-gradient(to bottom right, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.05))', borderColor: 'rgba(255, 255, 255, 0.3)' }}
 className="w-16 h-16 rounded-full backdrop-blur-3xl border flex items-center justify-center shadow-[inset_0_0_15px_rgba(255,255,255,0.4)]"
 >
 <FaUsers className="text-3xl text-white opacity-40 drop-shadow-glow" />
 </div>
 </motion.div>
 </div>
 </motion.div>
 ))}
 </div>
 );
}
