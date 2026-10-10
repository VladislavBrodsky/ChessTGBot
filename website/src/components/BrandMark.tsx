import { BRAND } from "@/lib/brand";

type BrandMarkProps = {
  className?: string;
  style?: React.CSSProperties;
  src?: string;
  inverse?: boolean;
};

/** A tiny native vector stays sharp at every display size. */
export function BrandMark({
  className,
  style,
  inverse = false,
  src = inverse ? BRAND.inverseSymbolAsset : BRAND.symbolAsset,
}: BrandMarkProps) {
  return (
    // Also accepts the generated PNG for ImageResponse.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      className={className}
      style={style}
      width={64}
      height={64}
      alt=""
      aria-hidden="true"
    />
  );
}
