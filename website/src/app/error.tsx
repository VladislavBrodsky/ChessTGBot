"use client";

import { useEffect } from "react";
import { Nav } from "@/components/Nav";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/icons";

/** Segment error boundary. In this Next release the recovery callback is `retry` (not `reset`). */
export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div>
      <Nav />
      <main id="main" className="shell-prose flex min-h-[70vh] flex-col items-center justify-center gap-6 py-16 text-center">
        <Icon name="clock" size={56} />
        <h1 className="poster text-heading-xl text-fg">That move didn’t land</h1>
        <p className="max-w-[44ch] text-body sm:text-lead text-fg-muted">
          Something went wrong while loading this page. Try again, or head back to the start.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button size="lg" onClick={() => retry()}>
            Try again
            <Icon name="arrow-counter-clockwise" size={18} />
          </Button>
          <ButtonLink href="/" variant="secondary" size="lg">
            Back to the website
          </ButtonLink>
        </div>
        {error.digest && (
          <p className="font-mono text-caption text-fg-muted">Reference: {error.digest}</p>
        )}
      </main>
    </div>
  );
}
