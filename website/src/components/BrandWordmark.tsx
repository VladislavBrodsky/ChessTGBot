import { BRAND_LETTERING } from "@/lib/brand-lettering";

/** Outlined lettering keeps the lockup identical before and after font loading. */
export function BrandWordmark({
  className,
  style,
  foreground = "currentColor",
}: {
  className?: string;
  style?: React.CSSProperties;
  foreground?: string;
}) {
  const { wordmark } = BRAND_LETTERING;
  return (
    <svg
      className={className}
      style={style}
      viewBox={`0 0 ${wordmark.width} ${wordmark.height}`}
      width={wordmark.width}
      height={wordmark.height}
      fill={foreground}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
    >
      <path d={wordmark.path} />
    </svg>
  );
}
