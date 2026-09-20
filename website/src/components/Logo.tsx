import { KingMark } from "./icons";

export function Logo({ inverse = false }: { inverse?: boolean }) {
  return (
    <span className="flex items-center gap-2">
      <span className="grid size-9 place-items-center rounded-[9px] bg-ink">
        <KingMark className="size-5" fill="#FFD700" />
      </span>
      <span
        className={`text-heading-sm ${inverse ? "text-white" : "text-fg"}`}
        style={{ fontWeight: 700 }}
      >
        web3chess
      </span>
    </span>
  );
}
