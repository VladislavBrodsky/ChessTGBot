import { telegramLink } from "@/lib/config";
import { TelegramIcon } from "./icons";

type Props = {
  size?: "sm" | "md" | "lg";
  variant?: "primary" | "onDark";
  startapp?: "arena";
  label?: string;
  className?: string;
};

const sizes = {
  sm: "min-h-11 px-4 text-button-sm gap-2",
  md: "min-h-12 px-5 text-button gap-2",
  lg: "min-h-14 px-7 text-button-lg gap-3",
} as const;

export function PlayButton({
  size = "md",
  variant = "primary",
  startapp,
  label = "Play in Telegram",
  className = "",
}: Props) {
  const skin =
    variant === "primary"
      ? "bg-inverse text-fg-inverse hover:bg-royal"
      : "bg-white text-ink hover:bg-mist";
  return (
    <a
      href={telegramLink(startapp)}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center justify-center whitespace-nowrap rounded-pill font-semibold shadow-control transition-colors duration-150 active:scale-[.98] ${sizes[size]} ${skin} ${className}`}
    >
      <TelegramIcon className={size === "lg" ? "size-6" : "size-5"} />
      {label}
    </a>
  );
}
