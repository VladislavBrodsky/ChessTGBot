import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

export const buttonStyles = {
  primary: "bg-inverse text-fg-inverse hover:opacity-85",
  secondary: "border border-line-strong text-fg hover:bg-surface",
  soft: "bg-inset text-fg hover:bg-surface",
  ghost: "text-fg hover:bg-inset",
} as const;

export function buttonClass(
  variant: keyof typeof buttonStyles = "primary",
  className = "",
) {
  return `inline-flex min-h-12 items-center justify-center gap-2.5 rounded-control px-5 text-button font-semibold transition-[background-color,opacity,transform] duration-150 active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-45 ${buttonStyles[variant]} ${className}`;
}

type ButtonProps = ComponentProps<"button"> & {
  variant?: keyof typeof buttonStyles;
};

export function Button({ variant, className = "", ...props }: ButtonProps) {
  return (
    <button
      type="button"
      className={buttonClass(variant, className)}
      {...props}
    />
  );
}

export function ButtonLink({
  href,
  children,
  variant,
  className = "",
}: {
  href: string;
  children: ReactNode;
  variant?: keyof typeof buttonStyles;
  className?: string;
}) {
  if (href.startsWith("#")) {
    return (
      <a href={href} className={buttonClass(variant, className)}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={buttonClass(variant, className)}>
      {children}
    </Link>
  );
}
