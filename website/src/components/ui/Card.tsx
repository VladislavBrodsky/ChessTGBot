import type { ComponentProps } from "react";

export function Card({ className = "", ...props }: ComponentProps<"div">) {
  return (
    <div
      className={`site-card min-w-0 bg-surface ${className}`}
      {...props}
    />
  );
}
