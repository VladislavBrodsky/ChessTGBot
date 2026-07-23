import { requestBotRevengeGame } from '@/lib/botRevenge';

type Fetcher = (path: string, options?: RequestInit) => Promise<Response>;

const jsonResponse = (status: number, body: unknown): Response =>
  ({ ok: status >= 200 && status < 300, status, json: async () => body } as Response);

describe('requestBotRevengeGame', () => {
  it('returns the new game id on success and hits the computer-create endpoint', async () => {
    const calls: Array<{ path: string; options?: RequestInit }> = [];
    const fetcher: Fetcher = async (path, options) => {
      calls.push({ path, options });
      return jsonResponse(200, { game_id: 'abc123' });
    };

    const controller = new AbortController();
    const result = await requestBotRevengeGame(
      { timeControl: 300, difficulty: 'hard' },
      { signal: controller.signal, fetcher: fetcher as any },
    );

    expect(result).toEqual({ ok: true, gameId: 'abc123' });
    expect(calls).toHaveLength(1);
    expect(calls[0].path).toBe('/api/v1/game/create?type=computer&time_control=300&difficulty=hard');
    expect(calls[0].options?.method).toBe('POST');
    expect(calls[0].options?.signal).toBe(controller.signal);
  });

  it('reports failure (not aborted) on a non-2xx response — e.g. 429 rate limit', async () => {
    const fetcher: Fetcher = async () => jsonResponse(429, { detail: 'Too many requests' });
    const controller = new AbortController();

    const result = await requestBotRevengeGame(
      { timeControl: 600, difficulty: 'medium' },
      { signal: controller.signal, fetcher: fetcher as any },
    );

    expect(result).toEqual({ ok: false, aborted: false });
  });

  it('reports failure when the response body has no game_id', async () => {
    const fetcher: Fetcher = async () => jsonResponse(200, { invite_link: 'x' });
    const controller = new AbortController();

    const result = await requestBotRevengeGame(
      { timeControl: 600, difficulty: 'medium' },
      { signal: controller.signal, fetcher: fetcher as any },
    );

    expect(result).toEqual({ ok: false, aborted: false });
  });

  it('reports failure (not aborted) when the fetch throws for a network error', async () => {
    const fetcher: Fetcher = async () => {
      throw new TypeError('Failed to fetch');
    };
    const controller = new AbortController();

    const result = await requestBotRevengeGame(
      { timeControl: 600, difficulty: 'medium' },
      { signal: controller.signal, fetcher: fetcher as any },
    );

    expect(result).toEqual({ ok: false, aborted: false });
  });

  it('flags aborted=true when the signal was aborted (user navigated away / timeout)', async () => {
    const controller = new AbortController();
    const fetcher: Fetcher = async (_path, options) => {
      // Simulate fetch rejecting because the signal aborted mid-flight.
      controller.abort();
      const err = new DOMException('The operation was aborted.', 'AbortError');
      void options;
      throw err;
    };

    const result = await requestBotRevengeGame(
      { timeControl: 600, difficulty: 'medium' },
      { signal: controller.signal, fetcher: fetcher as any },
    );

    expect(result).toEqual({ ok: false, aborted: true });
  });
});
