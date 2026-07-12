'use client';

import { useState, useEffect } from "react";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";

interface RematchChoiceDrawerProps {
  wagerAmount: number;
  onClose: () => void;
  onSendRematchOffer: (doubleStakes: boolean) => void;
}

export default function RematchChoiceDrawer({
  wagerAmount,
  onClose,
  onSendRematchOffer,
}: RematchChoiceDrawerProps) {
  const tg = useTranslations('Game');
  const [canClose, setCanClose] = useState<boolean>(false);

  // Cooldown to prevent double-clicks/mouseup race conditions on desktop from closing drawer instantly on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setCanClose(true);
    }, 250);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="bottom-drawer-backdrop z-[110]">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }} 
        onClick={() => { if (canClose) onClose(); }}
        className="absolute inset-0 bg-[rgba(0,0,0,0.5)]" style={{ touchAction: 'none' }}
      />
      <motion.div 
        initial={{ y: "100%" }} 
        animate={{ y: 0 }} 
        exit={{ y: "100%" }} 
        transition={{ type: "spring", damping: 30, stiffness: 350 }}
        className="bottom-drawer-sheet relative z-20"
      >
        <div className="bottom-drawer-handle" />
        
        <div className="flex flex-col items-center text-center mt-2">
          <h2 className="text-xl font-black uppercase tracking-widest mb-1 text-brand-primary">
            {tg('revenge_match')}
          </h2>
          <p className="text-[10px] font-bold text-brand-primary opacity-40 uppercase tracking-[0.2em] mb-6">
            {tg('invite_revenge_desc')}
          </p>
        </div>
        
        <div className="w-full flex flex-col gap-3">
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => onSendRematchOffer(false)}
            className="w-full bg-brand-primary text-brand-void py-4 rounded-xl flex flex-col items-center justify-center gap-1 cursor-pointer shadow-sm"
          >
            <span className="text-xs uppercase font-black tracking-[0.2em]">{tg('same_stakes')}</span>
            <span className="text-[10px] font-bold opacity-80">${((wagerAmount || 0) / 100).toFixed(2)} USDT</span>
          </motion.button>
          
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => onSendRematchOffer(true)}
            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-brand-void py-4 rounded-xl flex flex-col items-center justify-center gap-1 cursor-pointer shadow-sm relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.15),transparent)] -translate-x-full animate-shimmer" />
            <span className="text-xs uppercase font-black tracking-[0.2em] flex items-center gap-1">
              {tg('double_stakes_choice')}
            </span>
            <span className="text-[10px] font-bold opacity-90">${(((wagerAmount || 0) * 2) / 100).toFixed(2)} USDT</span>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={onClose}
            className="w-full glass-panel py-3 rounded-xl flex items-center justify-center gap-2 text-[10px] uppercase font-bold tracking-widest cursor-pointer shadow-sm"
          >
            <span>{tg('cancel')}</span>
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
