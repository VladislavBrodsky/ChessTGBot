import { BRAND } from "@/lib/brand";
import { BrandWordmark } from "./BrandWordmark";

export function Logo({ inverse = false }: { inverse?: boolean }) {
  return (
    <span className="brand-lockup inline-flex shrink-0 items-center">
      <span className="sr-only">{BRAND.wordmark} — {BRAND.tagline}</span>
      <BrandWordmark className={`h-[45px] w-auto ${inverse ? "text-white" : "text-fg"}`} />
    </span>
  );
}
