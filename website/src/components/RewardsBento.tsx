"use client";

import { BentoGrid } from "./magicui/bento-grid";
import { Card } from "@/components/ui/Card";
import { FeatureCardIntro } from "@/components/ui/FeatureCardIntro";
import { Icon } from "@/icons";
import { IconCloud } from "./magicui/icon-cloud";
import { LiveSettlementFeed } from "./LiveSettlementFeed";

// ── Modern 2D/3D Tokens for Vault Drop Sphere ──────────────────────────────
function GramToken({ className = "size-6.5 sm:size-8.5" }: { className?: string }) {
  return (
    <div
      className={`flex ${className} items-center justify-center rounded-full bg-gradient-to-br from-[#0098EA] via-[#0088d6] to-[#005fa8] text-white shadow-none border border-white/60 `}
      title="GRAM"
    >
      <svg viewBox="0 0 32 32" fill="none" className="size-3.5 sm:size-4.5" aria-label="GRAM">
        <path
          d="M16 6.5L7.5 11.5L16 25.5L24.5 11.5L16 6.5ZM14.8 8.8L16 8.1L17.2 8.8L21.5 11.3L16 12.7L10.5 11.3L14.8 8.8ZM9.8 12.8L15.3 14.2V22.4L9.8 12.8ZM16.7 22.4V14.2L22.2 12.8L16.7 22.4Z"
          fill="white"
        />
      </svg>
    </div>
  );
}

function BtcToken({ className = "size-6.5 sm:size-8.5" }: { className?: string }) {
  return (
    <div
      className={`flex ${className} items-center justify-center rounded-full bg-gradient-to-br from-[#F7931A] via-[#f59e0b] to-[#b45309] text-white shadow-none border border-white/60 `}
      title="Bitcoin"
    >
      <svg viewBox="0 0 32 32" fill="none" className="size-3.5 sm:size-4.5" aria-label="BTC">
        <path
          d="M22.5 13.6c.3-2.1-1.3-3.2-3.5-4l.7-2.9-1.8-.4-.7 2.8c-.5-.1-1-.2-1.5-.3l.7-2.9-1.8-.4-.7 2.9c-.4-.1-.8-.2-1.2-.3l-2.4-.6-.5 1.9s1.3.3 1.3.3c.7.2.8.7.8 1.1l-.8 3.2c.1 0 .1 0 .2.1l-.2-.1-1.1 4.5c-.1.2-.3.6-.8.4 0 0-1.3-.3-1.3-.3l-.9 2.1 2.3.6c.4.1.9.2 1.3.3l-.7 2.9 1.8.4.7-2.8c.5.1 1 .2 1.5.3l-.7 2.9 1.8.4.7-2.9c3.1.6 5.4.3 6.4-2.4.8-2.2 0-3.5-1.6-4.3 1.1-.3 2-1 2.2-2.4zm-4 5.3c-.6 2.3-4.4 1.1-5.6.8l1-4c1.2.3 5.2.9 4.6 3.2zm.5-5.4c-.5 2.1-3.7 1-4.7.8l.9-3.7c1 .2 4.3.7 3.8 2.9z"
          fill="white"
        />
      </svg>
    </div>
  );
}

function UsdtToken({ className = "size-6.5 sm:size-8.5" }: { className?: string }) {
  return (
    <div
      className={`flex ${className} items-center justify-center rounded-full bg-gradient-to-br from-[#26A17B] via-[#10b981] to-[#047857] text-white shadow-none border border-white/60 `}
      title="Tether USDT"
    >
      <svg viewBox="0 0 32 32" fill="none" className="size-3.5 sm:size-4.5" aria-label="USDT">
        <path
          d="M17.9 12.3v-2h6.1V7H8v3.3h6.1v2C7.9 12.6 3 13.9 3 15.5c0 1.6 4.9 2.9 11.1 3.2v7.3h3.8v-7.3c6.2-.3 11.1-1.6 11.1-3.2 0-1.6-4.9-2.9-11.1-3.2zm-1.9 4.6c-5 0-9.2-.8-10-1.9.8-1.1 5-1.9 10-1.9s9.2.8 10 1.9c-.8 1.1-5 1.9-10 1.9z"
          fill="white"
        />
      </svg>
    </div>
  );
}

function KingChessToken({ className = "size-6.5 sm:size-8.5" }: { className?: string }) {
  return (
    <div
      className={`flex ${className} items-center justify-center rounded-full bg-gradient-to-br from-[#8b5cf6] via-[#7c3aed] to-[#581c87] text-white shadow-none border border-caution/50 `}
      title="Chess King"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="size-3.5 sm:size-4.5 text-white"
        aria-label="King Chess"
      >
        <path d="M12 2v4M10 4h4" />
        <path
          d="M6.5 8.5C8 9.5 9 10 12 10s4-.5 5.5-1.5c.8 3.5-1 6.5-1.5 8.5h-8C7.5 15 5.7 12 6.5 8.5z"
          fill="currentColor"
          fillOpacity="0.25"
        />
        <path d="M6 17h12M5 20h14" />
      </svg>
    </div>
  );
}

const stakes = [
  { stake: "$5", pace: "Blitz 3+2", payout: "$9.50" },
  { stake: "$25", pace: "Rapid 10+0", payout: "$47.50", popular: true },
  { stake: "$100", pace: "Classic 30+0", payout: "$190" },
];
const referrals = [
  { tier: "1", label: "Tier 1 Direct", share: "1.0%" },
  { tier: "2", label: "Tier 2 Friends", share: "0.4%" },
  { tier: "3–6", label: "Tiers 3–6", share: "0.6%" },
];

export function RewardsBento() {
  return (
    <BentoGrid>
      <Card className="reward-panel reward-settlements" role="article" aria-labelledby="settlement-card-title">
        <FeatureCardIntro id="settlement-card-title" label="Live Settlements" status="Real-time on-chain" icon="lightning" title="Instant 95% Winner Payouts" body="Both players lock equal USDT before move 1. The moment checkmate or resignation lands, 95% of the pot credits instantly to the winner’s balance." href="/how-it-works" action="Explore payout architecture" />
        <div className="reward-demo settlement-demo"><LiveSettlementFeed /></div>
      </Card>
      <Card className="reward-panel reward-vault" data-interactive-workspace role="article" aria-labelledby="vault-card-title">
        <FeatureCardIntro id="vault-card-title" label="Mystery Vaults" status="Daily Drops" icon="gift" title="Win up to 1,000 GRAM" body="Match XP unboxes King, Queen, and Knight chests with GRAM prizes & 2× boosts." href="/how-it-works" action="Explore Boxes" />
        <div className="reward-demo vault-demo">
          <IconCloud center={<div className="vault-core"><svg viewBox="0 0 24 24" className="size-7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 2v3M10.5 3.5h3M7 8c1.2 1 2 1.5 5 1.5s3.8-.5 5-1.5c.8 3-1 5.5-1.5 7.5h-7C8 13.5 6.2 11 7 8zM6.5 17h11M5.5 20h13" /></svg></div>}>
            <GramToken className="size-10" /><BtcToken className="size-10" /><UsdtToken className="size-10" /><KingChessToken className="size-10" />
          </IconCloud>
          <ul className="vault-asset-legend" aria-label="Vault assets"><li>GRAM</li><li>BTC</li><li>USDT</li><li>KING</li></ul>
        </div>
      </Card>
      <Card className="reward-panel" role="article" aria-labelledby="stakes-card-title">
        <FeatureCardIntro id="stakes-card-title" label="Stake Ladder" status="From $1" icon="lightning" title="Play Any Stake Level" body="$1 micro-duels up to $500 high-roller classics. Winner claims 95% on-chain." href="/wagers" action="View tiers" />
        <div className="reward-demo">
          <div className="demo-heading"><span>Stake Ladder</span><span>$1–$500</span></div>
          <ul className="stake-preview-list">{stakes.map((row) => <li key={row.stake} data-featured={row.popular || undefined}>
            <div><strong>{row.stake}</strong><span>{row.pace}</span></div>
            <div className="stake-preview-value">{row.popular && <span className="preview-highlight">Popular</span>}<strong>→ {row.payout}</strong></div>
          </li>)}</ul>
          <div className="stake-preview-rail"><span>$1 Micro</span><span className="stake-preview-track" aria-hidden="true"><i /></span><span>$500 Whale</span></div>
        </div>
      </Card>
      <Card className="reward-panel" role="article" aria-labelledby="referrals-card-title">
        <FeatureCardIntro id="referrals-card-title" label="Affiliate Engine" status="2.0% Total" icon="users-three" title="2% Lifetime Match Rake" body="Invite friends once. Earn passive USDT commissions across 6 referral tiers." href="/how-it-works" action="Referral rules" />
        <div className="reward-demo">
          <div className="demo-heading"><span>Referral Rake</span><span>2.0% Pool</span></div>
          <ul className="referral-preview-list">{referrals.map((row, i) => <li key={row.tier} data-featured={i === 0 || undefined}><span className="referral-marker">{row.tier}</span><span>{row.label}</span><strong>{row.share}</strong></li>)}</ul>
          <p className="demo-note">Instant credit when referrals compete</p>
        </div>
      </Card>
      <Card className="reward-panel" role="article" aria-labelledby="economics-card-title">
        <FeatureCardIntro id="economics-card-title" label="Modern Edge" status="Web3 vs 2" icon="lightning" title="Chess That Pays" body="Legacy chess keeps 100%. Web3Chess returns 95% of pot to winners." href="/fair-play" action="Fair-play" neutral />
        <div className="reward-demo">
          <div className="demo-heading"><span>Economics</span><span>95% vs 0%</span></div>
          <ul className="economics-preview-list">
            <li><span aria-hidden="true">×</span><div><strong>Legacy Chess</strong><span>Zero cash · Paywalls</span></div><strong className="economics-share">0%</strong></li>
            <li data-featured="true"><Icon name="check" size={18} /><div><strong>Web3Chess</strong><span>95% Winner Payout</span></div><strong className="economics-share">95%</strong></li>
          </ul>
          <p className="demo-note demo-note-split"><span>Winner Share:</span><strong>95% Guaranteed</strong></p>
        </div>
      </Card>
    </BentoGrid>
  );
}
