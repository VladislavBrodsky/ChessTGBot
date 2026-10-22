import type { ReactNode } from "react";
import { Badge } from "./ui/Badge";
import { FeatureList } from "./ui/FeatureList";
import { ButtonLink } from "./ui/Button";
import { Icon } from "@/icons";
import { PlayButton } from "./PlayButton";

export function ArenaSection({ visual }: { visual: ReactNode }) {
  return (
    <section id="play" className="shell-wide home-section showcase-section" aria-labelledby="play-heading">
      <div className="section-index"><span>02 / Online chess matchmaking</span><span>Choose your pace · See the rules</span></div>
      <div className="showcase-section-layout">
        <div className="showcase-section-copy">
          <div className="showcase-section-intro">
            <div className="showcase-section-meta"><Badge tone="accent" icon="lightning">Global Arena</Badge><span>Online opponents · optional USDT stakes</span></div>
            <h2 id="play-heading" className="editorial-title">Challenge rivals worldwide <span>Play at your pace</span></h2>
            <p>Choose a time control and an available stake before an optional wager match. Both stakes are held during play; the result determines a winner credit or a refund.</p>
          </div>
          <FeatureList items={[
            { icon: "lock", title: "Equal stakes", body: "Both players commit the same USDT amount before a wager match begins." },
            { icon: "shield-check", title: "Server-validated moves", body: "The game server validates moves and records the match result." },
            { icon: "lightning", title: "Clear settlement", body: "A decided match credits the winner’s in-app balance with 95% of the combined pot." },
          ]} />
          <dl className="showcase-facts"><div><dd>1 USDT</dd><dt>minimum stake</dt></div><div><dd>95%</dd><dt>winner share</dt></div><div><dd>Free</dd><dt>Free Coach practice</dt></div></dl>
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
      <div className="section-index"><span>03 / Telegram and wallet infrastructure</span><span>In-app balances · Separate withdrawals</span></div>
      <div className="showcase-section-layout">
        <div className="showcase-section-copy">
          <div className="showcase-section-intro">
            <div className="showcase-section-meta"><Badge tone="accent" icon="cpu">Telegram Mini App</Badge><span>Play without a separate download</span></div>
            <h2 id="infrastructure-heading" className="editorial-title">Play in Telegram, track rewards in app</h2>
            <p>Open Web3Chess in Telegram without a separate download. Follow the wallet instructions for USDT deposits; match settlement updates your app balance, while withdrawals use a separate confirmation flow.</p>
          </div>
          <FeatureList items={[
            { icon: "lightning", title: "USDT deposits", status: "Follow the reference instructions", body: "Send the supported asset with the unique reference shown in Wallet so the platform can identify your deposit." },
            { icon: "telegram-logo", title: "Telegram access", status: "No separate app download", body: "Open the chess Mini App from Telegram and start with Free Coach practice." },
            { icon: "shield-check", title: "Withdrawal confirmation", status: "Check status in Wallet", body: "Withdrawals follow a separate request and confirmation process; an in-app winner credit is not an on-chain transfer." },
          ]} />
          <div className="showcase-actions"><PlayButton size="md" pulsating trackingLocation="infrastructure" /><ButtonLink href="/how-it-works" variant="ghost">See how it works<Icon name="arrow-right" size={18} /></ButtonLink></div>
        </div>
        <div className="showcase-section-visual">{visual}</div>
      </div>
    </section>
  );
}
