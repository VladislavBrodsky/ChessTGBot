import { BrandMark } from "./BrandMark";
import { BRAND } from "@/lib/brand";
import { BrandWordmark } from "./BrandWordmark";

export function Logo({ inverse = false }: { inverse?: boolean }) {
  return (
    <span className="brand-lockup inline-flex min-w-0 items-center gap-2.5">
      <BrandMark
        inverse={inverse}
        className="size-10 shrink-0"
      />
      <span className="flex min-w-0 items-center">
        <span className="sr-only">{BRAND.wordmark}</span>
        <BrandWordmark className={`h-5 w-auto ${inverse ? "text-white" : "text-fg"}`} />
      </span>
    </span>
  );
}
