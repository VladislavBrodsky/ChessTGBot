/**
 * Local mock of the backend API for developer mode (`npm run dev:mock`).
 * Serves realistic, clearly fake data so every Mini App page renders without Telegram auth, Postgres or Redis.
 * Never used in production: it only runs when you start it, and the frontend only talks to it through the dev
 * server's /api rewrite (BACKEND_URL).
 */
import http from 'node:http';

const user = {
  telegram_id: 123456789, first_name: 'Alexandra', last_name: 'Rivera', username: 'alexandra',
  elo: 1450, level: 5, xp: 850, games_played: 28, wins: 16, losses: 10, draws: 2, win_rate: 57.1, draw_rate: 7.1, loss_rate: 35.7,
  current_streak: { count: 3, type: 'win' }, study_streak: 7, percentile: 82, global_rank: 127, total_score: 17, unlocked_items: [],
  recent_games: [
    { game_id: 'g1', result: 'win', elo_change: 12, opponent: { name: 'Mikhail Petrov', elo: 1520 } },
    { game_id: 'g2', result: 'loss', elo_change: -8, opponent: { name: 'A.I. Coach', elo: 1400 } },
  ],
  referral_code: 'dev-preview', is_premium: false, bot_username: 'chess_matbot', is_admin: false,
};
const names = ['Alexandra', 'Mikhail', 'Ana', 'Omar', 'Yuki', 'Lena', 'Diego', 'Priya'];
const players = names.map((first_name, i) => ({ ...user, rank: i + 1, telegram_id: 1000 + i, first_name, last_name: 'Demo', elo: 1600 - i * 25, xp: 5000 - i * 300 }));
let mockGramRewardsNano = BigInt(500000000);
let mockGramVisible = false;
const tasks = [
  { id: 1, task_id: 1, title_key: 'daily_play', progress: 2, target_count: 3, xp_reward: 50, completed: false, claimed: false },
  { id: 2, task_id: 2, title_key: 'daily_win', progress: 1, target_count: 1, xp_reward: 100, completed: true, claimed: false },
  { id: 3, task_id: 3, title_key: 'join_channel', progress: 0, target_count: 1, xp_reward: 200, completed: false, claimed: false },
];
const themes = [
  { id: 1, code: 'default', name: 'Classic', description: 'Standard board', price_xp: 0, owned: true, theme_type: 'board' },
  { id: 2, code: 'emerald', name: 'Emerald', description: 'Deep green marble', price_xp: 500, owned: false, theme_type: 'board' },
];
const achievements = [
  { id: 1, code: 'a', title: 'First Victory', description: 'Win your first game', icon: 'fa-trophy', xp_reward: 50, unlocked: true, unlocked_at: '2026-10-01T10:00:00Z' },
  { id: 2, code: 'b', title: 'Novice Victor', description: 'Win 10 games', icon: 'fa-star', xp_reward: 100, unlocked: false, unlocked_at: null },
];
const lessons = [
  { slug: 'piece-values', title: 'Piece Values', description: 'Learn what each piece is worth.', difficulty: 'Beginner', xp_reward: 50 },
  { slug: 'forks', title: 'Forks', description: 'Attack two pieces at once.', difficulty: 'Intermediate', xp_reward: 50 },
];
const review = {
  game_id: 'g1', white_player_id: 123456789, black_player_id: 2, winner: 'w', result_type: 'checkmate', white_name: 'Alexandra', black_name: 'Mikhail',
  white_elo_before: 1438, white_elo_after: 1450, black_elo_before: 1520, black_elo_after: 1508, total_moves: 7, final_fen: null,
  moves: ['e2e4', 'e7e5', 'd1h5', 'b8c6', 'f1c4', 'g8f6', 'h5f7'], game_type: 'online', ended_at: '2026-10-08T12:00:00Z',
};

async function route(path, method, requestBody = {}) {
  const now = Date.now();
  if (path.endsWith('/telemetry/log')) return { ok: true };
  if (path.endsWith('/daily-checkin/status')) return { can_claim: process.env.MOCK_CHECKIN === '1', streak: 3, claimed_today: process.env.MOCK_CHECKIN !== '1' };
  if (path.endsWith('/users/sync') || /\/users\/\d+$/.test(path)) return user;
  if (path.endsWith('/wallet/balance')) return { gram_rewards_nano: mockGramRewardsNano.toString(), gram_leaderboard_visible: mockGramVisible, balance: 1250, wallet_address: 'EQDevPreview0000000000000000000000000000000000' };
  if (path.endsWith('/wallet/gram-leaderboard-visibility') && method === 'PUT') {
    mockGramVisible = requestBody.visible === true;
    return { visible: mockGramVisible };
  }
  if (/\/gamification\/tasks\/\d+\/claim$/.test(path)) {
    const task = tasks.find(item => item.task_id === Number(path.split('/').at(-2)));
    if (task && task.completed && !task.claimed) { task.claimed = true; mockGramRewardsNano += BigInt(300000000); }
    return { status: 'success', gram_rewards_nano: mockGramRewardsNano.toString() };
  }
  if (path.endsWith('/wallet/gram-quote')) return getNativeGramQuote();
  if (path.endsWith('/wallet/prices')) return { TON: 5.4, USDT: 1 };
  if (path.endsWith('/wallet/transactions')) return [
    { id: 1, type: 'deposit', amount: 1250, fee: 65, status: 'completed', reference_id: 'p', created_at: '2026-10-07T12:00:00Z' },
    { id: 2, type: 'withdrawal', amount: -500, fee: 20, status: 'completed', reference_id: 'q', created_at: '2026-10-08T12:00:00Z' },
  ];
  if (path.endsWith('/gamification/tasks')) return tasks.map(task => ({ ...task, gram_reward_nano: task.title_key === 'join_channel' ? '500000000' : '300000000', gram_reward_mode: 'claim' }));
  if (path.endsWith('/gamification/engagement/status')) return { enabled: false };
  if (path.endsWith('/gamification/academy/state')) return {
    unlocked_lessons: ['piece-values', 'forks'], completed_lessons: ['piece-values'],
    // 100 tactical levels: three solved, one current, then sequential, XP and premium locks, so every state of the grid renders.
    puzzles: Array.from({ length: 100 }, (_, i) => ({
      id: i + 1, title: `${i < 5 ? 'Mate in 1' : 'Fork the king'} — Level ${i + 1}`, description: i < 5 ? 'Find the mating move.' : 'Win material with a tactic.', xp_reward: 50, xp_cost: i >= 10 && i < 29 ? 100 : undefined,
      is_solved: i < 3, is_sequential_locked: i > 3, is_premium_locked: i >= 29, is_xp_locked: i >= 10 && i < 29,
    })),
  };
  if (/\/academy\/puzzles\/\d+$/.test(path)) return { id: 1, title: 'Mate in 1', description: 'White to move.', fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4', move_count: 1, xp_reward: 50 };
  if (/\/academy\/puzzles\/\d+\/verify$/.test(path)) return { status: 'success', solved: true, new_xp: 900, new_elo: 1455, explanation: 'Qxf7# uses the queen and bishop together to give checkmate.' };
  if (/\/academy\/puzzles\/\d+\/hint$/.test(path)) return { from: 'h5', hint_text: 'Look for a check supported by your bishop on c4.' };
  if (path.endsWith('/content/lessons')) return lessons;
  if (/\/content\/lessons\/[\w-]+$/.test(path)) return { title: 'Opening Principles', track: 'Foundations', steps: [
    { id: 1, order_index: 1, content: '<h2>Develop with a purpose</h2><p>Bring knights and bishops into play, influence the centre and prepare to castle. Ask what each move improves.</p>' },
    { id: 2, order_index: 2, content: '<h2>Check your opponent’s threat</h2><p>Before choosing a move, look for checks, captures and threats from both sides.</p>' },
  ] };
  if (path.endsWith('/gamification/themes')) return themes;
  if (path.endsWith('/gamification/achievements')) return achievements;
  if (path.includes('/leaderboard')) return players;
  if (path.endsWith('/game/active')) return { active_game_id: null };
  if (path.endsWith('/game/lobby-stats')) return { searching: Number(process.env.MOCK_SEARCHING ?? 3), games_24h: Number(process.env.MOCK_GAMES_24H ?? 128), recent: [{ result_type: 'checkmate', elo_gain: 12, ended_at: new Date(now - 4 * 60e3).toISOString() }, { result_type: 'timeout', elo_gain: 9, ended_at: new Date(now - 19 * 60e3).toISOString() }, { result_type: 'resignation', elo_gain: null, ended_at: new Date(now - 52 * 60e3).toISOString() }], counted_at: Math.floor(now / 1000) };
  if (/\/game\/history\/[\w-]+$/.test(path)) return review;
  if (path.includes('/referrals/stats')) return { qualifying_min_moves: 10, gram_rewards_nano: '1000000000', gram_rewarded_referrals: 1, total_referrals: 3, active_referrals: 2, total_earnings_usdt: 1.25, earnings_chart: [] };
  if (path.endsWith('/arena/status')) return {
    status: 'scheduled', starts_at: new Date(now + 3600e3).toISOString(), ends_at: new Date(now + 7200e3).toISOString(), server_now: new Date(now).toISOString(),
    prizes_xp: [500, 300, 100], participation_xp: 25, participants: 0, standings: [], me: null, in_pool: false,
  };
  return method === 'GET' ? {} : { ok: true };
}

export function startMockApi(port = 8124) {
  const server = http.createServer(async (req, res) => {
    const path = new URL(req.url, 'http://localhost').pathname;
    let requestBody = {};
    if (req.method !== 'GET') {
      let raw = ''; for await (const chunk of req) raw += chunk;
      try { requestBody = raw ? JSON.parse(raw) : {}; } catch { requestBody = {}; }
    }
    const body = JSON.stringify(await route(path, req.method, requestBody));
    res.writeHead(200, { 'content-type': 'application/json', 'cache-control': 'no-store' });
    res.end(body);
  });
  return new Promise(resolve => server.listen(port, '127.0.0.1', () => resolve(server)));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const port = Number(process.env.MOCK_API_PORT || 8124);
  await startMockApi(port);
  console.log(`[mock-api] listening on http://127.0.0.1:${port}`);
}

// Even local estimates use a public current native-coin quote, never fake prices.
let nativeQuote;
let nativeQuoteRetry = 0;
async function getNativeGramQuote() {
  if (nativeQuote && Date.now() - Date.parse(nativeQuote.fetched_at) < 300000) return { available: true, quote: nativeQuote };
  if (Date.now() < nativeQuoteRetry) return { available: false, quote: null };
  try {
    const master = 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs';
    const response = await fetch(`https://tonapi.io/v2/rates?tokens=ton,${master}&currencies=usd`, { signal: AbortSignal.timeout(3000) });
    if (!response.ok) throw new Error('Quote unavailable');
    const { rates } = await response.json();
    const native = (rates.GRAM || rates.TON)?.prices?.USD;
    const usdt = rates[master]?.prices?.USD;
    if (!(native > 0 && usdt > 0)) throw new Error('Invalid quote');
    nativeQuote = { gram_per_usdt: String(usdt / native), fetched_at: new Date().toISOString(), provider: 'TonAPI', stale: false, display_only: true };
    return { available: true, quote: nativeQuote };
  } catch { nativeQuoteRetry = Date.now() + 60000; return { available: false, quote: null }; }
}
