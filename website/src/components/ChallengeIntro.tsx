export function ChallengeIntro({
  solved = false,
  explanation,
}: {
  solved?: boolean;
  explanation?: string;
}) {
  return (
    <div className="challenge-intro">
      <h2 id="challenge-title" className="editorial-title">
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
