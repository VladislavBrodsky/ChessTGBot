import { apiFetch } from '@/lib/api';

export type RevengeResult =
  | { ok: true; gameId: string }
  | { ok: false; aborted: boolean };

/**
 * Requests a fresh computer game for a "revenge" rematch.
 *
 * Isolated from the component so the failure/abort branches are unit-testable:
 * the previous inline version swallowed every non-2xx and thrown error into a
 * bare `catch` that only logged, which left the modal stuck on
 * "creating match..." with no signal to the user. This returns a discriminated
 * result so the caller can show an error and let the user retry, and reports
 * `aborted` so the caller can stay silent when the abort came from the user
 * navigating away (unmount) rather than a real failure.
 */
export async function requestBotRevengeGame(
  params: { timeControl: number; difficulty: string },
  opts: { signal: AbortSignal; fetcher?: typeof apiFetch },
): Promise<RevengeResult> {
  const fetcher = opts.fetcher ?? apiFetch;
  const { timeControl, difficulty } = params;
  try {
    const res = await fetcher(
      `/api/v1/game/create?type=computer&time_control=${timeControl}&difficulty=${difficulty}`,
      { method: 'POST', signal: opts.signal },
    );
    if (!res.ok) return { ok: false, aborted: opts.signal.aborted };
    const data = await res.json();
    if (!data?.game_id) return { ok: false, aborted: opts.signal.aborted };
    return { ok: true, gameId: data.game_id };
  } catch {
    return { ok: false, aborted: opts.signal.aborted };
  }
}
