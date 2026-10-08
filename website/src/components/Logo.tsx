import { BrandMark } from "./BrandMark";
import { BRAND } from "@/lib/brand";
import { BrandWordmark } from "./BrandWordmark";

export function Logo({ inverse = false }: { inverse?: boolean }) {
  return (
    <span className="brand-lockup inline-flex min-w-0 items-center gap-2.5">
      <BrandMark
        className="size-11 shrink-0 sm:size-12"
        foreground={inverse ? "var(--color-brand-symbol)" : undefined}
      />
      <span className="flex min-w-0 flex-col justify-center">
        <span className="sr-only">{BRAND.wordmark}</span>
        <BrandWordmark className={`h-[1.625rem] w-auto sm:h-7 ${inverse ? "text-white" : "text-fg"}`} />
        <span className="mt-1.5 font-sans text-overline font-normal leading-none tracking-[.035em] text-fg-muted">
          {BRAND.tagline}
        </span>
      </span>
    </span>
  );
}
