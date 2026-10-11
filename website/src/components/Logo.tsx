import { BRAND } from "@/lib/brand";
import { BrandWordmark } from "./BrandWordmark";

export function Logo({
  inverse = false,
  compact = false,
}: {
  inverse?: boolean;
  compact?: boolean;
}) {
  return (
    <span className="brand-lockup inline-flex shrink-0 items-center">
      <span className="sr-only">
        {BRAND.wordmark} {compact ? "" : `— ${BRAND.tagline}`}
      </span>
      <BrandWordmark
        showTagline={!compact}
        className={`${compact ? "h-[22px]" : "h-[45px]"} w-auto ${inverse ? "text-white" : "text-fg"}`}
      />
    </span>
  );
}
