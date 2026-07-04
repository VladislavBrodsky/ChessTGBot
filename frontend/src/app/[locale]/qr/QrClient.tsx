'use client';

import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { FaTrophy } from 'react-icons/fa';
import { useTranslations } from 'next-intl';

export default function QrClient() {
  const searchParams = useSearchParams();
  const t = useTranslations('Referral');
  
  const code = searchParams.get('code') || '';
  const bot = 'FinChess_bot';
  const inviteLink = `https://t.me/${bot}/app?startapp=ref_${code}`;

  return (
    <div className="min-h-screen bg-brand-void text-brand-primary flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-purple-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-cyan-500/10 blur-[120px] pointer-events-none" />

      {/* Styled glowing cyber card container */}
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", duration: 0.6 }}
        className="relative overflow-hidden w-full max-w-[320px] bg-brand-surface border border-purple-500/30 rounded-[36px] p-8 shadow-[0_0_60px_rgba(168,85,247,0.25)] flex flex-col items-center text-center space-y-6"
      >
        {/* Header */}
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-widest text-brand-primary opacity-60">
            {t('referral_protocol') || 'REFERRAL MATRIX'}
          </span>
        </div>

        {/* Title */}
        <div className="space-y-1">
          <h1 className="text-[14px] font-black text-brand-primary uppercase tracking-tight">FinChess Invite Matrix</h1>
          <p className="text-[8px] font-bold text-brand-primary opacity-40 uppercase tracking-widest">Wager • Play • Earn</p>
        </div>

        {/* Styled QR Image Wrapper */}
        <div className="relative p-3 bg-white rounded-[32px] border-2 border-purple-500/20 shadow-xl flex items-center justify-center shrink-0 w-48 h-48 transition-transform duration-300 hover:scale-[1.02]">
          {code ? (
            <img 
              src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(inviteLink)}&color=0f172a&bgcolor=ffffff`} 
              alt="Referral QR Code" 
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="text-zinc-400 text-xs font-bold uppercase tracking-wider">Invalid Code</div>
          )}
          
          {/* Central logo overlay (Framer Trophy icon) */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-9 h-9 bg-white rounded-full border border-purple-500/25 flex items-center justify-center shadow-md">
            <div className="w-7 h-7 bg-purple-500/10 rounded-full flex items-center justify-center border border-purple-500/10">
              <FaTrophy size={12} className="text-purple-600" />
            </div>
          </div>
        </div>

        {/* Footer text */}
        <div className="space-y-2">
          <p className="text-[10px] font-black text-brand-primary uppercase tracking-wider">Scan to Join</p>
          <p className="text-[9px] font-bold text-brand-primary opacity-50 uppercase leading-relaxed px-1">
            Point your phone camera at this QR code to join the Arena and get your 50 XP referral bonus.
          </p>
        </div>

        {/* Action Button: Open App directly */}
        <motion.a
          whileTap={{ scale: 0.95 }}
          href={inviteLink}
          className="w-full py-3 rounded-2xl bg-brand-primary text-brand-void text-[10px] font-black uppercase tracking-wider shadow-premium hover:opacity-90 transition-all block text-center"
        >
          Open Arena App
        </motion.a>
      </motion.div>
    </div>
  );
}
