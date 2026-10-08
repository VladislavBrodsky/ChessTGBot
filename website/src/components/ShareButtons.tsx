"use client";

import { useRef, useState, useEffect } from "react";
import { Icon } from "@/icons";
import { Button, buttonClass } from "./ui/Button";

export function ShareButtons({
  title,
  url,
  compact = false,
}: {
  title: string;
  url: string;
  compact?: boolean;
}) {
  const [status, setStatus] = useState("");
  const [showLink, setShowLink] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  const shareText = title + " — Web3Chess";
  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setStatus("Link copied. Your friend is up next.");
      setShowLink(false);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setStatus(""), 4000);
    } catch {
      setShowLink(true);
      setStatus("Select and copy the link below.");
    }
  }
  return (
    <div className="border-t border-line pt-4">
      <p className="mb-3 font-mono text-overline uppercase">
        {compact ? "Make it a friendly rivalry" : "Share this story"}
      </p>
      <div className="flex flex-wrap gap-2">
        <a
          href={`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(shareText)}`}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonClass("secondary", "px-3! text-caption!")}
        >
          <Icon name="paper-plane-tilt" size={16} />
          {compact ? "Challenge a friend" : "Telegram"}
        </a>
        <Button
          variant="secondary"
          onClick={copy}
          className="px-3! text-caption!"
        >
          <Icon name="copy" size={16} />
          Copy link
        </Button>
        {!compact && (
          <a
            href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(shareText)}`}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonClass("secondary", "px-3! text-caption!")}
          >
            Share on X
          </a>
        )}
      </div>
      {status && (
        <p role="status" className="mt-2 text-caption">
          {status}
        </p>
      )}
      {showLink && (
        <label className="mt-3 block text-caption">
          Challenge link
          <input
            readOnly
            value={url}
            onFocus={(e) => e.target.select()}
            className="mt-1 min-h-11 w-full rounded-control border border-line-strong bg-surface px-3 text-body"
          />
        </label>
      )}
    </div>
  );
}
