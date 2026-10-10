import { telegramLink } from "@/lib/config";
import { TelegramIcon } from "./icons";
import { buttonClass } from "./ui/Button";

type Props = {
  size?: "sm" | "md" | "lg";
  variant?: "primary" | "onDark" | "ghost";
  startapp?: "arena";
  label?: string;
  className?: string;
};

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
      className={buttonClass(variant === "ghost" ? "secondary" : "primary", className, size)}
    >
      <TelegramIcon className={size === "lg" ? "size-5" : "size-4"} />
      {label}
    </a>
  );
}
