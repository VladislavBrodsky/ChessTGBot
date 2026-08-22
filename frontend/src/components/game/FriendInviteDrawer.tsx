'use client';

import React, { useState } from "react";
import { FaShareAlt, FaCopy, FaCheck } from "react-icons/fa";
import { useTranslations } from "next-intl";
import { telegramHaptic } from "@/lib/telegram";
import { copyToClipboard } from "@/lib/clipboard";
import { Drawer } from "@/components/ui/Drawer";
import { Button } from "@/components/ui/Button";

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

  const shareInviteLink = () => {
    const shareUrl = inviteLink;
    const shareText = tg('share_msg', { time: timeControl / 60 });
    const fullUrl = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`;
   
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      try {
        window.Telegram.WebApp.openTelegramLink(fullUrl);
        telegramHaptic('medium');
      } catch (err) {
        console.warn("Telegram openTelegramLink failed", err);
        window.open(fullUrl, '_blank');
      }
    } else {
      window.open(fullUrl, '_blank');
    }
  };

  const handleCopyLink = () => {
    copyToClipboard(inviteLink).then((ok) => {
      if (!ok) return;
      setCopiedLink(true);
      telegramHaptic('light');
      setTimeout(() => setCopiedLink(false), 2000);
    });
  };

  return (
    <Drawer
      isOpen={true}
      onClose={onClose}
      title={tg('invite_link_title')}
      description={tg('invite_link_desc')}
    >
      <div className="space-y-4">
        <div className="w-full bg-brand-elevated rounded-2xl p-4 border border-brand-border space-y-2 text-center">
          <input
            readOnly
            type="text"
            value={inviteLink}
            onClick={(e) => (e.currentTarget as HTMLInputElement).select()}
            className="w-full py-2.5 px-3 rounded-xl bg-brand-surface border border-brand-border text-xs font-mono text-brand-primary text-center select-all focus:outline-none focus:border-brand-primary/40 shadow-inner"
          />
        </div>
        
        <div className="flex flex-col gap-2.5">
          <Button
            variant="primary"
            size="lg"
            onClick={shareInviteLink}
            className="w-full uppercase font-black tracking-wider flex items-center justify-center gap-2"
          >
            <FaShareAlt size={12} />
            <span>{tg('share_invite')}</span>
          </Button>
          
          <div className="grid grid-cols-2 gap-2.5 w-full">
            <Button
              variant="secondary"
              size="md"
              onClick={handleCopyLink}
              className="w-full flex items-center justify-center gap-2"
            >
              {copiedLink ? <FaCheck className="text-emerald-400" /> : <FaCopy />}
              <span>{copiedLink ? tg('copied_success') : tg('copy_code')}</span>
            </Button>
            
            <Button
              variant="outline"
              size="md"
              onClick={onClose}
              className="w-full"
            >
              {tIndex('back')}
            </Button>
          </div>
        </div>
      </div>
    </Drawer>
  );
}
