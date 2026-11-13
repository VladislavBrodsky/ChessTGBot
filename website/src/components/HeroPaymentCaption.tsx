import { Icon } from "@/icons";
import { CurrencyBadge } from "./ui/CurrencyBadge";
import { MetaLine } from "./ui/MetaLine";

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
      <MetaLine className="hero-payment-note" items="Withdrawals are separate · No download required" />
    </div>
  );
}
