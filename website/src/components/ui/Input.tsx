import type { ComponentProps } from "react";

/** Pair with a visible label and associate feedback through aria-describedby. */
export function Input({ className = "", ...props }: ComponentProps<"input">) {
  return <input className={`site-input ${className}`} {...props} />;
}
