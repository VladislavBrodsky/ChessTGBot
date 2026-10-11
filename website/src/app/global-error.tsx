"use client";

import { useEffect } from "react";

/**
 * Last-resort boundary: it replaces the root layout, so it carries its own document and styles
 * (the app stylesheet and fonts are not loaded here). Keep it dependency-free.
 */
export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const button = {
    minHeight: 48,
    padding: "0 24px",
    borderRadius: 8,
    border: "1px solid #000",
    font: "600 16px/1 system-ui, sans-serif",
    cursor: "pointer",
  } as const;

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          padding: 24,
          background: "#e5e5e5",
          color: "#000",
          font: "400 18px/1.5 system-ui, sans-serif",
          textAlign: "center",
        }}
      >
        <title>Something went wrong · Web3Chess</title>
        <main style={{ maxWidth: 460 }}>
          <h1 style={{ margin: "0 0 12px", font: "800 40px/1.05 system-ui, sans-serif", letterSpacing: "-0.02em" }}>
            That move didn’t land
          </h1>
          <p style={{ margin: "0 0 24px", color: "#444" }}>
            Something went wrong while loading Web3Chess. Try again in a moment.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <button type="button" onClick={() => retry()} style={{ ...button, background: "#000", color: "#fff" }}>
              Try again
            </button>
            {/* A full page load is deliberate: the app shell failed, so the client router can't be trusted. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a
              href="/"
              style={{ ...button, display: "inline-flex", alignItems: "center", background: "transparent", color: "#000", textDecoration: "none" }}
            >
              Back to the website
            </a>
          </div>
          {error.digest && (
            <p style={{ marginTop: 24, color: "#444", font: "400 14px/1.4 ui-monospace, monospace" }}>
              Reference: {error.digest}
            </p>
          )}
        </main>
      </body>
    </html>
  );
}
