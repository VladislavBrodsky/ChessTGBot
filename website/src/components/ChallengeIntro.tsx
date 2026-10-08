export function ChallengeIntro({
  solved = false,
  explanation,
}: {
  solved?: boolean;
  explanation?: string;
}) {
  return (
    <div className="challenge-intro space-y-4">
      <span className="inline-flex items-center gap-2 font-mono text-overline uppercase text-fg-muted">
        <span className="size-2 rounded-full bg-voltage" aria-hidden="true" />
        The one-move challenge
      </span>
      <h2 className="editorial-title">
        {solved ? (
          <>
            That’s your
            <br />
            brilliant move.
          </>
        ) : (
          <>
            One move.
            <br />
            Big difference.
          </>
        )}
      </h2>
      <p className="max-w-[40ch] text-body text-fg-muted">
        {explanation ||
          "Three positions. One winning move each. Find it, then challenge a friend."}
      </p>
    </div>
  );
}
