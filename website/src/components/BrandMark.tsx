import { BRAND } from "@/lib/brand";

type BrandMarkProps = {
  className?: string;
  style?: React.CSSProperties;
  src?: string;
};

/** Pre-sized artwork avoids an image-optimization request for the tiny brand mark. */
export function BrandMark({
  className,
  style,
  src = BRAND.symbolAsset,
}: BrandMarkProps) {
  return (
    // This same primitive accepts an embedded PNG for ImageResponse.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      className={className}
      style={style}
      width={128}
      height={128}
      alt=""
      aria-hidden="true"
    />
  );
}
