'use client';

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { FaShareAlt } from "react-icons/fa";
import { useTranslations } from "next-intl";

interface FriendInviteDrawerProps {
  inviteLink: string;
  timeControl: number;
  onClose: () => void;
}

export default function FriendInviteDrawer({
  inviteLink,
  timeControl,
  onClose,
}: FriendInviteDrawerProps) {
  const tg = useTranslations('Game');
  const tIndex = useTranslations('Index');
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [canClose, setCanClose] = useState<boolean>(false);

  // Cooldown to prevent double-clicks/mouseup race conditions on desktop from closing drawer instantly on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setCanClose(true);
    }, 250);
    return () => clearTimeout(timer);
  }, []);

  const shareInviteLink = () => {
    const shareUrl = inviteLink;
    const shareText = tg('share_msg', { time: timeControl / 60 });
    const fullUrl = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`;
   
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      try {
        window.Telegram.WebApp.openTelegramLink(fullUrl);
        if (window.Telegram.WebApp.HapticFeedback) {
          try {
            window.Telegram.WebApp.HapticFeedback.impactOccurred('medium');
          } catch {}
        }
      } catch (err) {
        console.warn("Telegram openTelegramLink failed", err);
        window.open(fullUrl, '_blank');
      }
    } else {
      window.open(fullUrl, '_blank');
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopiedLink(true);
    if (typeof window !== 'undefined' && window.Telegram?.WebApp?.HapticFeedback) {
      try {
        window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
      } catch {}
    }
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="bottom-drawer-backdrop z-[100]">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }} 
        onClick={() => { if (canClose) onClose(); }}
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
            {tg('invite_link_title')}
          </h2>
          <p className="text-[10px] font-bold text-brand-primary opacity-40 uppercase tracking-[0.2em] mb-6">
            {tg('invite_link_desc')}
          </p>
        </div>
        
        <div className="w-full bg-brand-surface rounded-2xl p-5 border border-brand-border-opacity-10 mb-4 space-y-4 shadow-sm">
          <input
            readOnly
            type="text"
            value={inviteLink}
            onClick={(e) => (e.currentTarget as HTMLInputElement).select()}
            className="w-full py-2.5 px-4 rounded-xl bg-brand-void border border-brand-border-opacity-10 text-[11px] font-mono text-brand-primary opacity-80 text-center select-all focus:outline-none focus:border-brand-primary/20 shadow-inner"
          />
        </div>
        
        <div className="w-full flex flex-col gap-3">
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={shareInviteLink}
            className="w-full bg-brand-primary text-brand-void py-4 rounded-xl flex items-center justify-center gap-3 text-xs uppercase font-black tracking-[0.2em] cursor-pointer shadow-sm"
          >
            <FaShareAlt size={12} />
            <span>{tg('share_invite')}</span>
          </motion.button>
          
          <div className="grid grid-cols-2 gap-3 w-full">
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={handleCopyLink}
              className="w-full action-button py-3 rounded-xl flex items-center justify-center gap-2 text-[10px] cursor-pointer shadow-sm"
            >
              <span>{copiedLink ? tg('copied_success') : tg('copy_code')}</span>
            </motion.button>
            
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={onClose}
              className="w-full glass-panel py-3 rounded-xl flex items-center justify-center gap-2 text-[10px] uppercase font-bold tracking-widest cursor-pointer shadow-sm"
            >
              <span>{tIndex('back')}</span>
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
