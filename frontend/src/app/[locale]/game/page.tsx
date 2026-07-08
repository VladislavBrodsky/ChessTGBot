'use client';

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";

import PlayLobby from "@/components/game/PlayLobby";

// ActiveGame pulls in react-chessboard + chess.js. Only an active game (a
// gameId in the URL) needs it, but a static import loaded that bundle for the
// lobby too — the first thing everyone browsing to /game sees. Lazy-load it so
// the board is fetched only when a game is actually in progress.
const ActiveGame = dynamic(() => import("@/components/game/ActiveGame"), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-brand-primary/20 border-t-brand-primary animate-spin" />
    </div>
  ),
});

function GameContent() {
  const searchParams = useSearchParams();
  const gameId = searchParams?.get("id") || "";

  return gameId ? (
    <ActiveGame key={gameId} gameId={gameId} />
  ) : (
    <PlayLobby />
  );
}

export default function GamePage() {
  const tg = useTranslations('Game');
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center text-brand-primary opacity-20 font-black uppercase tracking-[0.5em] animate-pulse">
        {tg('initializing_board')}
      </div>
    }>
      <GameContent />
    </Suspense>
  );
}