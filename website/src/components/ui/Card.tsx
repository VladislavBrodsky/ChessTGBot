import type { ComponentProps } from "react";

export function Card({ className = "", ...props }: ComponentProps<"div">) {
  return (
    <div
      className={`rounded-card bg-surface p-6 sm:p-8 ${className}`}
      {...props}
    />
  );
}
