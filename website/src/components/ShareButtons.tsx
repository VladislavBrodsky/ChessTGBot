"use client";

import { useRef, useState, useEffect } from "react";
import { Icon } from "@/icons";
import { trackShareClick } from "@/lib/analytics";
import { Button, buttonClass } from "./ui/Button";
import { Input } from "./ui/Input";

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
  useEffect(() => {
    // A copied URL belongs to one position; clear it when the puzzle changes.
    if (timer.current) clearTimeout(timer.current);
    const frame = requestAnimationFrame(() => {
      setStatus("");
      setShowLink(false);
    });
    return () => cancelAnimationFrame(frame);
  }, [url]);
  const shareText = title + " — Web3Chess";
  async function copy() {
    trackShareClick("copy_link", compact ? "challenge" : "article", url);
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
      <p className="mb-3 text-caption font-medium text-fg-muted">
        {compact ? "Make it a friendly rivalry" : "Share this story"}
      </p>
      <div className="flex flex-wrap gap-2">
        <a
          href={`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(shareText)}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() =>
            trackShareClick("telegram", compact ? "challenge" : "article", url)
          }
          className={buttonClass("secondary", "", "sm")}
        >
          <Icon name="paper-plane-tilt" size={16} />
          {compact ? "Challenge a friend" : "Telegram"}
        </a>
        <Button
          variant="secondary"
          onClick={copy}
          size="sm"
        >
          <Icon name="copy" size={16} />
          Copy link
        </Button>
        {!compact && (
          <a
            href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(shareText)}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackShareClick("x", "article", url)}
            className={buttonClass("secondary", "", "sm")}
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
          <Input
            readOnly
            value={url}
            onFocus={(e) => e.target.select()}
            className="mt-1"
          />
        </label>
      )}
    </div>
  );
}
