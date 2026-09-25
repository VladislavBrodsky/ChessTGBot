"use client";

import { useState } from "react";
import { Share2, Check, Copy, Send } from "lucide-react";

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
        <Share2 className="size-3.5" />
        <span>Share:</span>
      </span>

      <button
        type="button"
        onClick={handleCopy}
        className="inline-flex items-center gap-1.5 rounded-full border border-line bg-card px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-ink transition-colors hover:border-ink hover:bg-mist"
      >
        {copied ? <Check className="size-3.5 text-win" /> : <Copy className="size-3.5" />}
        <span>{copied ? "Copied Link" : "Copy Link"}</span>
      </button>

      <a
        href={telegramShareUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 rounded-full border border-line bg-card px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-ink transition-colors hover:border-ink hover:bg-mist"
      >
        <Send className="size-3.5" />
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
