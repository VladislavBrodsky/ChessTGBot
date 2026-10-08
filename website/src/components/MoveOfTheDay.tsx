"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { Card } from "./ui/Card";
import { ChallengePlaceholder } from "./ChallengePlaceholder";
import { ChallengeBoundary } from "./ChallengeBoundary";
const Challenge = dynamic(
  () => import("./ChessChallenge").then((m) => m.ChessChallenge),
  { ssr: false, loading: () => <ChallengePlaceholder /> },
);

/** Defer the rules engine and board until this section approaches the viewport. */
export function MoveOfTheDay() {
  const ref = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (!("IntersectionObserver" in window)) {
      const fallback = setTimeout(() => setReady(true), 0);
      return () => clearTimeout(fallback);
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setReady(true);
          observer.disconnect();
        }
      },
      { rootMargin: "250px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return (
    <Card className="challenge-card min-w-0 p-4! sm:p-6! lg:p-8!" data-interactive-workspace>
      <div ref={ref}>
        <ChallengeBoundary>
          {ready ? <Challenge /> : <ChallengePlaceholder />}
        </ChallengeBoundary>
      </div>
    </Card>
  );
}
