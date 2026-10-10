import type { ReactNode } from "react";
import { Button } from "./Button";

/** Immediate local selection with one consistent target, focus, and pressed state. */
export function SegmentedControl<T extends string | number>({
  label, options, value, onChange, renderLabel,
}: {
  label: string;
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
  renderLabel?: (value: T) => ReactNode;
}) {
  return (
    <div className="site-segmented" role="group" aria-label={label}>
      {options.map((option) => (
        <Button key={option} variant="soft" aria-pressed={value === option} onClick={() => onChange(option)}>
          {renderLabel ? renderLabel(option) : option}
        </Button>
      ))}
    </div>
  );
}
