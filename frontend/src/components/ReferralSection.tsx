'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaUserPlus, FaCopy, FaShareAlt, FaCheck } from 'react-icons/fa';
import { apiFetch } from '@/lib/api';
import { telegramHaptic } from '@/lib/telegram';
import { copyToClipboard } from '@/lib/clipboard';

interface ReferralSectionProps {
 referralCode: string;
}

export default function ReferralSection({ referralCode }: ReferralSectionProps) {
 const [copied, setCopied] = useState(false);
 const [botUsername, setBotUsername] = useState("FinChess_bot");

 useEffect(() => {
   apiFetch("/api/v1/users/sync", { method: "POST" })
     .then(res => res.json())
     .then(data => {
       if (data && data.bot_username) {
         setBotUsername(data.bot_username);
       }
     })
     .catch(err => console.error("Failed to fetch bot username in ReferralSection:", err));
 }, []);

 const inviteLink = `https://t.me/${botUsername}?start=${referralCode}`;

 const handleCopy = () => {
 copyToClipboard(inviteLink).then((ok) => {
 if (!ok) return;
 setCopied(true);
 setTimeout(() => setCopied(false), 2000);
 telegramHaptic('success');
 });
 };

 const handleShare = () => {
    let success = false;
    if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp) {
      try {
        (window as any).Telegram.WebApp.switchInlineQuery(inviteLink, ["users", "groups", "channels"]);
        success = true;
      } catch (err) {
        console.warn("Telegram switchInlineQuery failed", err);
      }
    }
    if (!success) {
      copyToClipboard(inviteLink).then((ok) => {
        if (!ok) return;
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

 return (
 <div className="w-full space-y-4">
 <div className="flex flex-col items-center space-y-2 mb-2">
 <h3 className="text-xs font-black text-brand-primary tracking-tighter uppercase leading-none">Node Recruitment</h3>
 <div className="h-px w-6 bg-brand-bg-opacity-20" />
 </div>

 <div className="glass-panel p-5 rounded-3xl border-brand-border-opacity-10 bg-brand-bg-opacity-5 relative overflow-hidden group">
 {/* Background Decoration */}
 <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
 <FaUserPlus size={40} className="text-brand-primary" />
 </div>

 <div className="relative z-10 space-y-4">
 <div className="flex flex-col">
 <span className="text-[10px] font-black text-brand-primary uppercase tracking-[0.2em] mb-1">Referral Protocol</span>
 <p className="text-[10px] text-brand-primary opacity-40 font-bold uppercase leading-relaxed max-w-[80%]">
 Expand the FinChess network. Earn 50 XP and 10% Boost for every node synchronized via your code.
 </p>
 </div>

 <div className="flex items-center gap-2">
 <div className="flex-1 bg-brand-bg-opacity-10 border border-brand-border-opacity-5 rounded-2xl py-3 px-4 flex items-center justify-between">
 <span className="text-[10px] font-black text-brand-primary opacity-80 tracking-widest uppercase">
 {referralCode || "MATRIX-CORE"}
 </span>
 <button
 onClick={handleCopy}
 className="text-brand-primary hover:opacity-70 transition-all"
 >
 {copied ? <FaCheck size={12} className="text-emerald-500" /> : <FaCopy size={12} />}
 </button>
 </div>

 <motion.button
 whileTap={{ scale: 0.95 }}
 onClick={handleShare}
 className="bg-brand-primary text-brand-void p-3 rounded-2xl flex items-center justify-center shadow-premium"
 >
 <FaShareAlt size={14} />
 </motion.button>
 </div>
 </div>

 {/* Bottom Stats */}
 <div className="mt-4 pt-4 border-t border-brand-border-opacity-5 flex justify-between items-center">
 <div className="flex flex-col">
 <span className="text-[10px] font-black text-brand-primary opacity-20 uppercase tracking-widest">Nodes Recruited</span>
 <span className="text-[12px] font-black text-brand-primary ">0.00</span>
 </div>
 <div className="text-right flex flex-col">
 <span className="text-[10px] font-black text-brand-primary opacity-20 uppercase tracking-widest">Active Multiplier</span>
 <span className="text-[10px] font-black text-brand-primary tracking-tighter">1.0X ALPHA</span>
 </div>
 </div>
 </div>
 </div>
 );
}
