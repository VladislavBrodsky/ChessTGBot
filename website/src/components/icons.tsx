export function TelegramIcon({ className = "size-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
      <path d="M21.94 4.3 19.2 19.06c-.2 1.1-.86 1.37-1.74.85l-4.82-3.55-2.33 2.24c-.26.26-.47.47-.96.47l.34-4.9 8.9-8.04c.39-.34-.08-.53-.6-.19L6.98 12.6l-4.74-1.48c-1.03-.32-1.05-1.03.21-1.52l18.53-7.14c.86-.31 1.61.2 1.33 1.44Z" />
    </svg>
  );
}

/** The brand king, same silhouette as the Mini App icon. */
export function KingMark({ className = "size-6", fill = "currentColor" }: { className?: string; fill?: string }) {
  return (
    <svg viewBox="0 0 512 512" aria-hidden="true" className={className} fill={fill}>
      <path d="M256 128c17.7 0 32-14.3 32-32s-14.3-32-32-32-32 14.3-32 32 14.3 32 32 32Z" />
      <path d="M256 150c-35.3 0-64 28.7-64 64v42h128v-42c0-35.3-28.7-64-64-64Z" />
      <path d="M192 270h128v40H192z" />
      <path d="M170 330l-20 90h212l-20-90H170Z" />
      <rect x="128" y="430" width="256" height="30" rx="10" />
    </svg>
  );
}
