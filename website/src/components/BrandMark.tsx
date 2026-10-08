import { BRAND } from "@/lib/brand";

type BrandMarkProps = {
  className?: string;
  style?: React.CSSProperties;
  background?: string;
  foreground?: string;
  border?: string;
  variant?: "symbol" | "avatar";
};

/** Open crown for lockups; the contained avatar is reserved for icons. */
export function BrandMark({
  className,
  style,
  background = "var(--color-brand-tile)",
  foreground,
  border = "transparent",
  variant = "symbol",
}: BrandMarkProps) {
  const ink = foreground ?? (variant === "avatar"
    ? "var(--color-brand-crown)"
    : "var(--color-brand-ink)");
  return (
    <svg
      className={className}
      style={style}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
    >
      {variant === "avatar" && (
        <rect
          x="0.5"
          y="0.5"
          width="63"
          height="63"
          rx="15.5"
          fill={background}
          stroke={border}
        />
      )}
      <g transform={variant === "avatar" ? BRAND.avatarTransform : BRAND.symbolTransform}>
        <path
          d={BRAND.crownPath}
          stroke={ink}
          strokeWidth={BRAND.strokeWidth}
          strokeLinejoin="round"
        />
        <path
          d={BRAND.basePath}
          stroke={ink}
          strokeWidth={BRAND.strokeWidth}
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
}
