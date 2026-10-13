import type { CSSProperties } from "react";
import { UsdtIcon } from "../UsdtIcon";

const assets = {
  gram: { label: "GRAM", color: "#0098EA", ink: "#00649A" },
  usdt: { label: "USDT", color: "#26A17B", ink: "#065F46" },
} as const;

/** A currency identifier, not a button. Asset colors are reserved for the mark. */
export function CurrencyBadge({ asset }: { asset: keyof typeof assets }) {
  const { label, color, ink } = assets[asset];
  return (
    <span className="site-currency-badge" style={{ "--currency-color": color, "--currency-ink": ink } as CSSProperties}>
      <span className="site-currency-mark" aria-hidden="true">
        {asset === "usdt" ? <UsdtIcon /> : (
          <svg viewBox="0 0 32 32" fill="currentColor" aria-hidden="true">
            <path d="M16 6.5L7.5 11.5L16 25.5L24.5 11.5L16 6.5ZM14.8 8.8L16 8.1L17.2 8.8L21.5 11.3L16 12.7L10.5 11.3L14.8 8.8ZM9.8 12.8L15.3 14.2V22.4L9.8 12.8ZM16.7 22.4V14.2L22.2 12.8L16.7 22.4Z" />
          </svg>
        )}
      </span>
      {label}
    </span>
  );
}
