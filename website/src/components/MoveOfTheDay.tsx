"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { Card } from "./ui/Card";
import { ChallengeIntro } from "./ChallengeIntro";

function ChallengePlaceholder() {
  return (
    <div className="challenge-layout" aria-busy="true">
      <ChallengeIntro />
      <div className="challenge-board">
        <div className="mx-auto w-full max-w-100">
          <div className="mb-3 h-5 w-40 rounded-control bg-canvas" />
          <div className="aspect-square w-full rounded-media bg-canvas" />
          <p className="mt-3 text-caption text-center text-fg-muted">
            Loading the interactive board…
          </p>
        </div>
      </div>
      <div className="challenge-controls space-y-5" aria-hidden="true">
        <div className="h-24 rounded-control bg-inset sm:h-11 md:h-24 xl:h-11" />
        <div className="h-32 rounded-control bg-inset sm:h-20 md:h-32 xl:h-20" />
        <div className="h-5 w-3/4 rounded-control bg-inset" />
        <div className="h-28 rounded-control bg-inset sm:h-12" />
        <div className="h-32 border-t border-line pt-4 sm:h-24" />
      </div>
    </div>
  );
}
const Challenge = dynamic(
  () => import("./ChessChallenge").then((m) => m.ChessChallenge),
  { ssr: false, loading: ChallengePlaceholder },
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
    <Card className="min-w-0 p-4! sm:p-8!">
      <div ref={ref}>{ready ? <Challenge /> : <ChallengePlaceholder />}</div>
    </Card>
  );
}
