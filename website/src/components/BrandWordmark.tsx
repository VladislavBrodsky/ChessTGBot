import { BRAND_LETTERING } from "@/lib/brand-lettering";

/** Outlined lettering keeps the lockup identical before and after font loading. */
export function BrandWordmark({
  className,
  style,
  foreground = "currentColor",
  showTagline = true,
}: {
  className?: string;
  style?: React.CSSProperties;
  foreground?: string;
  showTagline?: boolean;
}) {
  const { wordmark, tagline, lockup } = BRAND_LETTERING;

  if (!showTagline) {
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

  return (
    <svg
      className={className}
      style={style}
      viewBox={`0 0 ${lockup.width} ${lockup.height}`}
      width={lockup.width}
      height={lockup.height}
      fill={foreground}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
    >
      <path d={wordmark.path} />
      <path d={tagline.path} transform={`translate(0 ${lockup.taglineY})`} />
    </svg>
  );
}
