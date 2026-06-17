'use client';

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useTranslations } from "next-intl";

import PlayLobby from "@/components/game/PlayLobby";
import ActiveGame from "@/components/game/ActiveGame";

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