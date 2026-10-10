import type { ComponentProps } from "react";

/** Native selection keeps the keyboard and mobile picker familiar. */
export function Select({ className = "", ...props }: ComponentProps<"select">) {
  return <select className={`site-input site-select ${className}`} {...props} />;
}
