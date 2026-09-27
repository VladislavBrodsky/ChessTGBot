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
    <div className="flex flex-wrap items-center gap-2 pt-6 border-t border-line">
      <span className="inline-flex items-center gap-1.5 font-mono text-xs font-bold uppercase tracking-widest text-fg-muted mr-2">
        <Icon name="share-network" size={14} />
        <span>Share:</span>
      </span>

      <button
        type="button"
        onClick={handleCopy}
        className="inline-flex items-center gap-1.5 rounded-full border border-line bg-card px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-ink transition-colors hover:border-ink hover:bg-mist"
      >
        {copied ? <Icon name="check" size={14} className="text-win" /> : <Icon name="copy" size={14} />}
        <span>{copied ? "Copied Link" : "Copy Link"}</span>
      </button>

      <a
        href={telegramShareUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 rounded-full border border-line bg-card px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-ink transition-colors hover:border-ink hover:bg-mist"
      >
        <Icon name="paper-plane-tilt" size={14} />
        <span>Telegram</span>
      </a>

      <a
        href={xShareUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 rounded-full border border-line bg-card px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-ink transition-colors hover:border-ink hover:bg-mist"
      >
        <span>X (Twitter)</span>
      </a>
    </div>
  );
}
