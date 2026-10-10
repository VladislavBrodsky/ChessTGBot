import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

export const buttonStyles = {
  primary: "site-button-primary",
  secondary: "site-button-secondary",
  soft: "site-button-soft",
  ghost: "site-button-ghost",
} as const;

export const buttonSizes = { sm: "site-button-sm", md: "site-button-md", lg: "site-button-lg" } as const;

export function buttonClass(
  variant: keyof typeof buttonStyles = "primary",
  className = "",
  size: keyof typeof buttonSizes = "md",
) {
  return `site-button ${buttonSizes[size]} ${buttonStyles[variant]} ${className}`;
}

type ButtonProps = ComponentProps<"button"> & {
  variant?: keyof typeof buttonStyles;
  size?: keyof typeof buttonSizes;
};

export function Button({ variant, size, className = "", ...props }: ButtonProps) {
  return (
    <button
      type="button"
      className={buttonClass(variant, className, size)}
      {...props}
    />
  );
}

export function ButtonLink({
  href,
  children,
  variant,
  size,
  className = "",
}: {
  href: string;
  children: ReactNode;
  variant?: keyof typeof buttonStyles;
  className?: string;
  size?: keyof typeof buttonSizes;
}) {
  if (href.startsWith("#")) {
    return (
      <a href={href} className={buttonClass(variant, className, size)}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={buttonClass(variant, className, size)}>
      {children}
    </Link>
  );
}
