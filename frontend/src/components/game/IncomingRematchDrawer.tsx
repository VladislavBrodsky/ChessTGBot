'use client';

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";

interface IncomingRematchDrawerProps {
  incomingRematch: {
    challenger_name: string;
    wager: number;
    double_stakes: boolean;
  };
  onAccept: () => void;
  onDecline: () => void;
}

export default function IncomingRematchDrawer({
  incomingRematch,
  onAccept,
  onDecline,
}: IncomingRematchDrawerProps) {
  const tg = useTranslations('Game');

  return (
    <div className="bottom-drawer-backdrop z-[110]">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }} 
        onClick={onDecline}
        className="absolute inset-0 bg-[rgba(0,0,0,0.5)]" 
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
          <h2 className="text-xl font-black uppercase tracking-widest mb-1 text-orange-400 animate-pulse">
            {tg('rematch_dialog_title')}
          </h2>
          <p className="text-[10px] font-bold text-brand-primary opacity-40 uppercase tracking-[0.2em] mb-6">
            {tg('challenger_offered_rematch', { name: incomingRematch.challenger_name })}
          </p>
        </div>
        
        <div className="w-full bg-brand-surface rounded-2xl p-5 border border-brand-border-opacity-10 mb-4 text-center shadow-sm">
          <span className="text-[8px] font-black text-brand-primary opacity-40 uppercase tracking-widest block mb-1">{tg('proposed_wager')}</span>
          <span className="text-2xl font-black text-brand-primary">
            ${((incomingRematch.wager) / 100).toFixed(2)} USDT
          </span>
          {incomingRematch.double_stakes && (
            <span className="text-[8px] font-black text-orange-400 uppercase tracking-widest block mt-1">{tg('double_stakes_active')}</span>
          )}
        </div>
        
        <div className="w-full flex flex-col gap-3">
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={onAccept}
            className="w-full bg-brand-primary text-brand-void py-4 rounded-xl flex items-center justify-center gap-3 text-xs uppercase font-black tracking-[0.2em] cursor-pointer shadow-sm"
          >
            <span>{tg('accept_play')}</span>
          </motion.button>
          
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={onDecline}
            className="w-full bg-brand-rose-opacity-10 border border-brand-rose-opacity-20 text-rose-400 py-3 rounded-xl flex items-center justify-center gap-2 text-[10px] uppercase font-bold tracking-widest cursor-pointer shadow-sm"
          >
            <span>{tg('decline')}</span>
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
