import { telegramLink } from "@/lib/config";
import { TelegramIcon } from "./icons";
import { buttonClass } from "./ui/Button";

type Props = {
  size?: "sm" | "md" | "lg";
  variant?: "primary" | "onDark" | "ghost";
  startapp?: "arena";
  label?: string;
  className?: string;
  pulsating?: boolean;
};

export function PlayButton({
  size = "md",
  variant = "primary",
  startapp,
  label = "Play in Telegram",
  className = "",
  pulsating = false,
}: Props) {
  return (
    <a
      href={telegramLink(startapp)}
      target="_blank"
      rel="noopener noreferrer"
      className={`relative ${buttonClass(variant === "ghost" ? "secondary" : "primary", className, size)}`}
    >
      <TelegramIcon className={size === "lg" ? "size-5" : "size-4"} />
      <span className="relative z-10">{label}</span>
      {pulsating && (
        <span
          className="pointer-events-none absolute inset-0 -z-10 rounded-[inherit] animate-[pulse-ring_2.4s_cubic-bezier(0.4,0,0.6,1)_infinite] bg-emerald-500/35"
          aria-hidden="true"
        />
      )}
    </a>
  );
}
