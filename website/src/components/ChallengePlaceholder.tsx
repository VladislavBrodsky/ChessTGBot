import { ChallengeIntro } from "./ChallengeIntro";
import { StaticChessBoard } from "./StaticChessBoard";
import { Button } from "./ui/Button";
import { Icon } from "@/icons";
import { CHALLENGES } from "@/content/challenges";

/** Match the loaded workspace instead of guessing heights with blank bars. */
export function ChallengePlaceholder({ error = false }: { error?: boolean }) {
  const puzzle = CHALLENGES[0];
  return (
    <div className="challenge-layout" aria-busy={!error}>
      <ChallengeIntro />
      <div className="challenge-board">
        <div className="mx-auto min-w-0 w-full max-w-100">
          <div className="challenge-board-heading"><span>{puzzle.name}</span><span>01 / 03</span></div>
          <StaticChessBoard fen={puzzle.fen} label={puzzle.label} />
          <p className="mt-3 text-caption text-center text-fg-muted" role="status">
            {error ? "The interactive controls could not load." : "Loading the interactive controls…"}
          </p>
        </div>
      </div>
      {error ? (
        <div className="challenge-controls space-y-4">
          <h3 className="text-heading-sm font-medium">Let’s try that again.</h3>
          <p className="text-body text-fg-muted">Your board is here. Reload to try the move controls again.</p>
          <Button onClick={() => window.location.reload()}>Reload challenge<Icon name="arrow-counter-clockwise" size={16} /></Button>
        </div>
      ) : (
        <div className="challenge-controls challenge-loading-controls space-y-4" aria-hidden="true" inert>
          <div className="challenge-progress">
            <p className="flex flex-wrap items-baseline justify-between gap-2 text-body-sm"><span className="font-semibold">Your progress</span><span className="font-mono tabular-nums">0 / 3 solved</span></p>
            <div className="mt-2 flex gap-2">{CHALLENGES.map(item => <span key={item.id} className="h-1 flex-1 rounded-pill bg-line-strong" />)}</div>
          </div>
          <div className="flex flex-wrap gap-2">{CHALLENGES.map((item, i) => <button key={item.id} disabled className={`min-h-11 rounded-control border px-3 text-caption font-medium ${i === 0 ? "border-line-strong bg-inverse text-fg-inverse" : "border-line bg-inset"}`}>{item.name}</button>)}</div>
          <div className="space-y-2">
            <p className="text-caption font-semibold">Your move in chess notation</p>
            <div className="grid min-w-0 gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
              <div className="flex min-h-12 items-center rounded-control border border-line-strong bg-surface px-3 font-mono text-body text-fg-muted">e.g. Ra8</div>
              <Button disabled className="w-full sm:w-auto">Play move<Icon name="arrow-right" size={16} /></Button>
            </div>
          </div>
          <p className="text-body-sm font-medium">White to move. Find checkmate in one.</p>
          <div className="flex flex-wrap gap-2"><Button disabled variant="soft">Give me a hint</Button><Button disabled variant="soft">Show solution</Button></div>
          <div className="border-t border-line pt-4">
            <p className="mb-3 font-mono text-overline uppercase">Make it a friendly rivalry</p>
            <div className="flex flex-wrap gap-2"><Button disabled variant="secondary" className="px-3! text-caption!"><Icon name="paper-plane-tilt" size={16} />Challenge a friend</Button><Button disabled variant="secondary" className="px-3! text-caption!"><Icon name="copy" size={16} />Copy link</Button></div>
          </div>
        </div>
      )}
    </div>
  );
}
