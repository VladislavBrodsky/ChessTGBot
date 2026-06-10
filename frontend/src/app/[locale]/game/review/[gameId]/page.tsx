import GameReviewClient from "./GameReviewClient";

export function generateStaticParams() {
  return [
    { gameId: 'placeholder' }
  ];
}

interface PageProps {
  params: Promise<{ gameId: string }>;
}

export default async function Page({ params }: PageProps) {
  const { gameId } = await params;
  return <GameReviewClient gameId={gameId} />;
}
