import { Icon } from "@/icons";
import { CurrencyBadge } from "./ui/CurrencyBadge";

export function HeroPaymentCaption() {
  return (
    <div className="hero-payment-support">
      <span className="hero-payment-label"><Icon name="lightning" size={16} />Instant on-chain</span>
      <span className="hero-payment-currencies">
        <CurrencyBadge asset="gram" />
        <span>&amp;</span>
        <CurrencyBadge asset="usdt" />
        <span>payouts</span>
      </span>
      <span className="hero-payment-note">No download required</span>
    </div>
  );
}
