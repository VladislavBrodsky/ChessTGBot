import { telegramLink } from "@/lib/config";
import { TelegramIcon } from "./icons";

type Props = {
  size?: "sm" | "md" | "lg";
  variant?: "primary" | "onDark" | "ghost";
  startapp?: "arena";
  label?: string;
  className?: string;
};

const sizes = {
  sm: "min-h-10 px-4 text-[14px] gap-2 rounded-[6px]",
  md: "min-h-12 px-6 text-[16px] gap-2.5 rounded-[8px]",
  lg: "min-h-14 px-8 text-[18px] gap-3 rounded-[8px]",
} as const;

export function PlayButton({
  size = "md",
  variant = "primary",
  startapp,
  label = "Play in Telegram",
  className = "",
}: Props) {
  const skins = {
    primary: "bg-[#000000] text-[#ffffff] hover:opacity-90",
    onDark: "bg-[#ffffff] text-[#000000] hover:bg-[#f3f3f3]",
    ghost: "bg-transparent border border-[#444444] text-[#444444] hover:text-[#000000] hover:border-[#000000]",
  };

  return (
    <a
      href={telegramLink(startapp)}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center justify-center whitespace-nowrap font-medium transition-all duration-150 active:scale-[.98] ${sizes[size]} ${skins[variant]} ${className}`}
    >
      <TelegramIcon className={size === "lg" ? "size-5" : "size-4"} />
      {label}
    </a>
  );
}
