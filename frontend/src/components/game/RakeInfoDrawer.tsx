'use client';

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";

interface RakeInfoDrawerProps {
  onClose: () => void;
}

export default function RakeInfoDrawer({ onClose }: RakeInfoDrawerProps) {
  const tg = useTranslations('Game');

  return (
    <div className="bottom-drawer-backdrop z-[100]">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }} 
        onClick={onClose}
        className="absolute inset-0 bg-[rgba(0,0,0,0.4)]" style={{ touchAction: 'none' }}
      />
      <motion.div 
        initial={{ y: "100%" }} 
        animate={{ y: 0 }} 
        exit={{ y: "100%" }} 
        transition={{ type: "spring", damping: 30, stiffness: 350 }}
        className="bottom-drawer-sheet relative z-10"
      >
        <div className="bottom-drawer-handle" />
        
        <div className="flex flex-col items-center text-center mt-2">
          <h2 className="text-xl font-black uppercase tracking-widest mb-1 text-brand-primary">
            {tg('platform_commission')}
          </h2>
          <p className="text-[10px] font-bold text-brand-primary opacity-40 uppercase tracking-[0.2em] mb-6">
            {tg('sustain_ecosystem')}
          </p>
        </div>
        
        <div className="w-full bg-brand-surface rounded-2xl p-5 border border-brand-border-opacity-10 mb-4 space-y-3.5 shadow-sm text-xs font-bold text-brand-primary/80 leading-relaxed">
          <p>
            {tg('rake_desc1')}
          </p>
          <p>
            {tg('rake_desc2')}
          </p>
          <div className="h-px w-full bg-brand-border-opacity-10 my-2" />
          <p className="text-[10px] text-brand-primary/50 uppercase tracking-wider">
            {tg('where_rake_goes')}
          </p>
          <ul className="list-disc pl-4 space-y-1 text-[11px] text-brand-primary/60">
            <li>{tg('rake_li1')}</li>
            <li>{tg('rake_li2')}</li>
            <li>{tg('rake_li3')}</li>
          </ul>
        </div>
        
        <div className="w-full flex flex-col gap-3">
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={onClose}
            className="w-full bg-brand-primary text-brand-void py-4 rounded-xl flex items-center justify-center gap-3 text-xs uppercase font-black tracking-[0.2em] cursor-pointer shadow-sm"
          >
            <span>{tg('got_it')}</span>
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
