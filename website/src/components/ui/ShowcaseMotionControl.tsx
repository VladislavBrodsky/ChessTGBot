import { Button } from "./Button";

export function ShowcaseMotionControl({ paused, onToggle, name }: { paused: boolean; onToggle: () => void; name: string }) {
  return (
    <Button variant="ghost" size="sm" className="showcase-motion-control" aria-label={`${paused ? "Resume" : "Pause"} ${name} animation`} aria-pressed={paused} onClick={onToggle}>
      <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
        {paused ? <path d="m9 5 11 7-11 7z" /> : <path d="M7 5h3v14H7zm7 0h3v14h-3z" />}
      </svg>
    </Button>
  );
}
