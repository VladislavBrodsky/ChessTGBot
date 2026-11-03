"use client";

import { BentoGrid } from "./magicui/bento-grid";
import { Card } from "@/components/ui/Card";
import { FeatureCardIntro } from "@/components/ui/FeatureCardIntro";
import { Icon } from "@/icons";
import { IconCloud } from "./magicui/icon-cloud";
import { SettlementExample } from "./SettlementExample";
import { SETTLEMENT } from "@/lib/config";

const stakes = [
  { stake: "$5", pace: "3 min Blitz", payout: "$9.50", featured: false },
  { stake: "$25", pace: "10 min Rapid", payout: "$47.50", featured: true },
  { stake: "$100", pace: "30 min Classical", payout: "$190", featured: false },
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
        <FeatureCardIntro id="settlement-card-title" label="Settlement example" status="Illustrative math" icon="lightning" title="95% Winner Share" body="Both players commit equal USDT before the match. After a decided result, the winner receives 95% of the combined pot in their app balance." href="/how-it-works" action="Explore payout rules" />
        <div className="reward-demo settlement-demo"><SettlementExample /></div>
      </Card>
      <Card className="reward-panel reward-vault" data-interactive-workspace role="article" aria-labelledby="vault-card-title">
        <FeatureCardIntro id="vault-card-title" label="Free Mystery Box" status="One per account" icon="gift" title="Play 3 games, earn a box" body="Finish three qualifying games to claim one free box. The current box awards XP, a 24-hour XP boost, or a profile border." href="/how-it-works" action="Explore box rules" />
        <div className="reward-demo vault-demo">
          <IconCloud center={<div className="vault-core"><svg viewBox="0 0 24 24" className="size-7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 2v3M10.5 3.5h3M7 8c1.2 1 2 1.5 5 1.5s3.8-.5 5-1.5c.8 3-1 5.5-1.5 7.5h-7C8 13.5 6.2 11 7 8zM6.5 17h11M5.5 20h13" /></svg></div>}>
            <span className="vault-reward-icon"><Icon name="lightning" size={20} /></span><span className="vault-reward-icon"><Icon name="sparkle" size={20} /></span><span className="vault-reward-icon"><Icon name="crown-simple" size={20} /></span><span className="vault-reward-icon"><Icon name="gift" size={20} /></span>
          </IconCloud>
          <ul className="vault-asset-legend" aria-label="Current Mystery Box rewards"><li>XP</li><li>XP boost</li><li>Profile border</li></ul>
        </div>
      </Card>
      <Card className="reward-panel" role="article" aria-labelledby="stakes-card-title">
        <FeatureCardIntro id="stakes-card-title" label="Stake Ladder" status="From $1" icon="lightning" title="Play Any Stake Level" body="$1 micro-duels up to $500 high-roller classics. Winner receives 95% in their app balance." href="/wagers" action="View tiers" />
        <div className="reward-demo">
          <div className="demo-heading"><span>Stake Ladder</span><span>$1–$500</span></div>
          <ul className="stake-preview-list">{stakes.map((row) => <li key={row.stake} data-featured={row.featured || undefined}>
            <div><strong>{row.stake}</strong><span>{row.pace}</span></div>
            <div className="stake-preview-value">{row.featured && <span className="preview-highlight">Example</span>}<strong>→ {row.payout}</strong></div>
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
        <FeatureCardIntro id="economics-card-title" label="Pot Split" status="Decided Matches" icon="lightning" title="Know the Pot Before You Play" body="For an eligible, decided USDT match, the winner receives 95% of the combined pot in their app balance. The remaining 5% covers platform and referral fees." href="/wagers" action="See payout math" />
        <div className="reward-demo">
          <div className="demo-heading"><span>Combined pot</span><span>95% / 5%</span></div>
          <ul className="economics-preview-list">
            <li data-featured="true"><Icon name="check" size={18} /><div><strong>Winner credit</strong><span>Includes the original stake</span></div><strong className="economics-share">{SETTLEMENT.winnerPercent}%</strong></li>
            <li><Icon name="scales" size={18} /><div><strong>Platform and referrals</strong><span>{SETTLEMENT.platformFeePercent}% platform · {SETTLEMENT.referralFeePercent}% referral</span></div><strong className="economics-share">{SETTLEMENT.platformFeePercent + SETTLEMENT.referralFeePercent}%</strong></li>
          </ul>
          <p className="demo-note demo-note-split"><span>Winner share:</span><strong>{SETTLEMENT.winnerPercent}% of the pot</strong></p>
        </div>
      </Card>
    </BentoGrid>
  );
}
