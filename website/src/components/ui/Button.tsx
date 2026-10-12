import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { buttonStyles, buttonSizes, buttonClass } from "./button-styles";

export { buttonStyles, buttonSizes, buttonClass };

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
