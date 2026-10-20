import { Icon } from "@/icons";
import { CurrencyBadge } from "./ui/CurrencyBadge";

export function HeroPaymentCaption() {
  return (
    <div className="hero-payment-support">
      <span className="hero-payment-label"><Icon name="lightning" size={16} />Reward balances</span>
      <span className="hero-payment-currencies">
        <CurrencyBadge asset="gram" />
        <span>&amp;</span>
        <CurrencyBadge asset="usdt" />
        <span>in app</span>
      </span>
      <span className="hero-payment-note">Withdrawals are separate · No download required</span>
    </div>
  );
}
