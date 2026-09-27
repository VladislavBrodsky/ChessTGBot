import { ICON_PATHS, type IconName } from "./generated";

export type { IconName };

type IconProps = {
  name: IconName;
  /** Pixel size; icons are square. 20 inline, 24 standalone (DESIGN.md §6.1). */
  size?: number;
  className?: string;
  /** Set only when the icon carries meaning on its own; otherwise it stays decorative. */
  label?: string;
};

/**
 * Vendored Phosphor icon (regular weight — a 1.5px stroke at 24px, per DESIGN.md §6.1).
 * Colour comes from `currentColor`: set it with `text-icon` or inherit from a button.
 */
export function Icon({ name, size = 20, className, label }: IconProps) {
  return (
    <svg
      viewBox="0 0 256 256"
      width={size}
      height={size}
      fill="currentColor"
      className={className}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
      dangerouslySetInnerHTML={{ __html: ICON_PATHS[name] }}
    />
  );
}
