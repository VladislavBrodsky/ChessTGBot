import type { ReactNode } from "react";
import { Badge } from "./ui/Badge";
import { FeatureList } from "./ui/FeatureList";
import { ButtonLink } from "./ui/Button";
import { Icon } from "@/icons";
import { PlayButton } from "./PlayButton";

export function ArenaSection({ visual }: { visual: ReactNode }) {
  return (
    <section id="play" className="shell-wide home-section showcase-section" aria-labelledby="play-heading">
      <div className="section-index"><span>02 / Worldwide live matchmaking</span><span>120+ countries · Sub-second pairing</span></div>
      <div className="showcase-section-layout">
        <div className="showcase-section-copy">
          <div className="showcase-section-intro">
            <div className="showcase-section-meta"><Badge tone="accent" icon="lightning">Global Arena</Badge><span>Sub-second pairing across 120+ nations</span></div>
            <h2 id="play-heading" className="editorial-title">Challenge rivals worldwide <span>Matched in seconds</span></h2>
            <p>Stake USDT with confidence. Automated escrow locks both deposits until checkmate, with Stockfish 16 move telemetry and millisecond FIDE clock sync.</p>
          </div>
          <FeatureList items={[
            { icon: "lock", title: "Instant Escrow", body: "Stakes lock at move 1. 95% pot released automatically upon checkmate." },
            { icon: "shield-check", title: "Anti-Cheat Engine", body: "Stockfish 16 audits move timing and correlation. Instant refund on foul play." },
            { icon: "lightning", title: "FIDE Server Clocks", body: "Authoritative server timestamps with lag compensation. Zero ping abuse." },
          ]} />
          <dl className="showcase-facts"><div><dd>3,840+</dd><dt>in duels</dt></div><div><dd>&lt; 2.4s</dd><dt>avg queue</dt></div><div><dd>120+</dd><dt>countries</dt></div></dl>
          <div className="showcase-actions"><PlayButton size="md" pulsating trackingLocation="facts_banner" /><ButtonLink href="/how-it-works" variant="ghost">How matchmaking works<Icon name="arrow-right" size={18} /></ButtonLink></div>
        </div>
        <div className="showcase-section-visual">{visual}</div>
      </div>
    </section>
  );
}

export function InfrastructureSection({ visual }: { visual: ReactNode }) {
  return (
    <section id="infrastructure" className="shell-wide home-section showcase-section" aria-labelledby="infrastructure-heading">
      <div className="section-index"><span>03 / Web3 &amp; GRAM infrastructure</span><span>Zero friction · Instant on-chain rails</span></div>
      <div className="showcase-section-layout">
        <div className="showcase-section-copy">
          <div className="showcase-section-intro">
            <div className="showcase-section-meta"><Badge tone="accent" icon="cpu">Direct Telegram Rails</Badge><span>Sub-second finality</span></div>
            <h2 id="infrastructure-heading" className="editorial-title">Play seamlessly with GRAM and USDT</h2>
            <p>No seed phrases to export, no browser extensions. Web3Chess launches with one tap directly inside Telegram, connects to your GRAM wallet, and settles match pots directly to your balance.</p>
          </div>
          <FeatureList items={[
            { icon: "lightning", title: "USDT on GRAM Rail", status: "< 3.2s · $0.005 Gas", body: "Instant non-custodial deposits and automated match pot escrow with sub-cent network fees on GRAM blockchain." },
            { icon: "telegram-logo", title: "Native Telegram App", status: "Zero Passwords", body: "Launch in 1 tap from any Telegram chat. Zero registration friction, no seed phrase backups, no browser extensions." },
            { icon: "shield-check", title: "HMAC-Secured Payouts", status: "Instant On-Chain", body: "Withdraw directly to your personal wallet in seconds, authenticated with 1-tap HMAC nonces inside Telegram bot chat." },
          ]} />
          <div className="showcase-actions"><PlayButton size="md" pulsating trackingLocation="infrastructure" /><ButtonLink href="/how-it-works" variant="ghost">See how it works<Icon name="arrow-right" size={18} /></ButtonLink></div>
        </div>
        <div className="showcase-section-visual">{visual}</div>
      </div>
    </section>
  );
}
