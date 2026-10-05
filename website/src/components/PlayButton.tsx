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
  sm: "min-h-10 px-5 text-[14px] gap-2 rounded-full font-medium tracking-tight",
  md: "min-h-12 px-6 text-[15px] gap-2.5 rounded-full font-semibold tracking-tight",
  lg: "min-h-14 px-8 text-[17px] gap-3 rounded-full font-semibold tracking-tight",
} as const;

export function PlayButton({
  size = "md",
  variant = "primary",
  startapp,
  label = "Play in Telegram",
  className = "",
}: Props) {
  const skins = {
    primary: "bg-[#20294C] text-[#ffffff] hover:bg-[#0A2D67] hover:-translate-y-0.5 shadow-[0_4px_14px_rgba(32,41,76,0.18)] hover:shadow-[0_6px_20px_rgba(32,41,76,0.28)]",
    onDark: "bg-[#ffffff] text-[#20294C] hover:bg-[#f3f4f8] hover:-translate-y-0.5 shadow-[0_4px_14px_rgba(0,0,0,0.15)]",
    ghost: "bg-white/80 backdrop-blur-sm border border-[#c7cbdb] text-[#20294C] hover:bg-white hover:border-[#20294C] hover:-translate-y-0.5 shadow-[0_2px_8px_rgba(32,41,76,0.06)]",
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
