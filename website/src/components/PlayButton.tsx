import { telegramLink } from "@/lib/config";
import { TelegramIcon } from "./icons";

type Props = {
  size?: "sm" | "md" | "lg";
  variant?: "primary" | "onDark" | "ghost";
  startapp?: "arena";
  label?: string;
  className?: string;
};

/* Dayos buttons: 8px radius, flat, no shadow, no blur. Press = scale(.98). */
const sizes = {
  sm: "min-h-10 px-4 text-[14px] gap-2",
  md: "min-h-12 px-5 text-button gap-2.5",
  lg: "min-h-14 px-7 text-[17px] gap-3",
} as const;

const skins = {
  primary: "bg-inverse text-fg-inverse hover:bg-graphite",
  onDark: "bg-white text-black hover:bg-mint",
  ghost: "border border-line-strong text-fg hover:bg-white",
} as const;

export function PlayButton({
  size = "md",
  variant = "primary",
  startapp,
  label = "Play in Telegram",
  className = "",
}: Props) {
  return (
    <a
      href={telegramLink(startapp)}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center justify-center whitespace-nowrap rounded-control font-semibold transition-colors duration-150 active:scale-[.98] ${sizes[size]} ${skins[variant]} ${className}`}
    >
      <TelegramIcon className={size === "lg" ? "size-5" : "size-4"} />
      {label}
    </a>
  );
}
