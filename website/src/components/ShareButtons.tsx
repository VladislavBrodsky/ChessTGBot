"use client";

import { useState } from "react";
import { Icon } from "@/icons";

interface ShareButtonsProps {
  title: string;
  url: string;
}

export function ShareButtons({ title, url }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  const telegramShareUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title + " — Web3Chess")}`;
  const xShareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title + " via @Web3Chess")}`;

  return (
    <div className="flex flex-wrap items-center gap-2 pt-6 border-t border-[#e5e5e5]">
      <span className="inline-flex items-center gap-1.5 font-mono text-[12px] font-bold uppercase tracking-wider text-[#979797] mr-2">
        <Icon name="share-network" size={14} />
        <span>Share:</span>
      </span>

      <button
        type="button"
        onClick={handleCopy}
        className="inline-flex items-center gap-1.5 rounded-[8px] border border-[#c6c6c6] bg-white px-4 py-2 font-mono text-[12px] font-medium uppercase tracking-wider text-[#000000] transition-colors hover:border-[#000000] hover:bg-[#f3f3f3]"
      >
        {copied ? <Icon name="check" size={14} className="text-[#047857]" /> : <Icon name="copy" size={14} />}
        <span>{copied ? "Copied Link" : "Copy Link"}</span>
      </button>

      <a
        href={telegramShareUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 rounded-[8px] border border-[#c6c6c6] bg-white px-4 py-2 font-mono text-[12px] font-medium uppercase tracking-wider text-[#000000] transition-colors hover:border-[#000000] hover:bg-[#f3f3f3]"
      >
        <Icon name="paper-plane-tilt" size={14} />
        <span>Telegram</span>
      </a>

      <a
        href={xShareUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 rounded-[8px] border border-[#c6c6c6] bg-white px-4 py-2 font-mono text-[12px] font-medium uppercase tracking-wider text-[#000000] transition-colors hover:border-[#000000] hover:bg-[#f3f3f3]"
      >
        <span>X (Twitter)</span>
      </a>
    </div>
  );
}
