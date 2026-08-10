# Unaddressed issues

Open problems found but **not** fixed. Each entry records the evidence so the next
person doesn't have to re-derive it. Delete an entry when it ships; move it to
`CLAUDE.md` if it turns into a durable convention.

Last reviewed: 2026-08-10 (log analysis window: Aug 3–10, Railway `production`).

---

## 1. No alerting survives a full outage — 11.5h down on 2026-08-10, unreported

**Severity: high.** Production was completely down for ~11.5 hours and nothing told anyone.

Timeline (UTC, from Railway deploy logs + CPU/memory time series):

| Time | Event |
|---|---|
| 03:09 | Redis *and* Postgres connects begin timing out from backend container `b5380cc59c27` |
| 03:14–04:08 | 158 errors — leader election, stale-game sweeper, bot notifications, arena loop, deposit/withdrawal crawlers, Stripe reconciliation |
| 04:09:57 | `Stopping Container` (platform-issued, not a crash) |
| 04:12 → 15:40 | Backend CPU flatlined at exactly `0.0000`, memory frozen at 0.219 GB, zero log lines |
| 04:08 → 15:36 | Frontend CPU also flatlined at 0 — same window |
| 15:27 | All four services redeployed manually; backend CPU resumes 15:44 |

Redis, Postgres and DNS (`gaierror: Temporary failure in name resolution`) all failed
together, and every service stopped gracefully at once — that is a Railway
platform/private-network event or a plan suspension, not an application bug. The app
never restarted itself; the 15:27 redeploy did.

The reporting gap is the real issue: **admin alerts are sent by the backend, so when the
backend dies the alerts die with it.** The last thing owners saw were two CORE API pages
at 03:14 and 03:27 — then silence that looked like recovery.

Needs an external dead-man's-switch (uptime monitor on `/health` with a "no heartbeat in
N minutes" alert) hosted outside Railway. Decision needed on where it lives.

Also worth checking: whether Railway billing/usage shows a hobby-plan suspension around
03:00 UTC on 2026-08-10, which would fully explain the simultaneous graceful stop.

---

## 2. Socket.IO Redis pub/sub reconnects every 6 seconds

**Severity: medium** (log noise today, correctness bug the moment you scale).

Ran continuously from at least Aug 5 to Aug 10 04:08 at ~595 failures/hour — ~14,000/day,
4,867 of 5,000 sampled warnings. The cadence is exact: fail at `:09`, recover at `:10`,
fail at `:15`, recover at `:16`.

**Root cause:** redis-py 8.0 changed `DEFAULT_SOCKET_TIMEOUT` from `None` to `5`
(`redis/_defaults.py:7`). Socket.IO's listener calls `pubsub.listen()`, which blocks
waiting for messages, so with no chess events flowing it hits the 5s read timeout, tears
down and resubscribes — forever. `MonitoredAsyncRedisManager` in `backend/app/core/socket.py`
passes no `redis_options`, so it inherits that default. A blocking listener should never
carry a read timeout.

**Impact today is limited:** `AsyncPubSubManager.emit` delivers to local clients *before*
publishing to Redis, and the service runs `numReplicas: 1`, so no user-facing event loss.
But it consumed the log budget (it is what hit Railway's 500 logs/sec limit on Aug 6,
dropping 416 messages) and would cause ~17% cross-instance event loss with 2+ replicas.

**Fix:** pass explicit options when constructing the manager —
`redis_options={"socket_timeout": None, "socket_keepalive": True, "health_check_interval": 30}`.

**Note:** not currently reproducing. Zero failures on both deployments since the Redis
service restart at 15:27 on Aug 10. Pin it anyway — the default will bite again.

---

## 3. Redis forks and writes an RDB snapshot every 60 seconds

**Severity: low.**

Redis service logs show `1 changes in 60 seconds. Saving...` → fork → `DB saved on disk`,
once a minute, continuously, on a 0.8 GB volume. That is the Railway template's
`save 60 1` default.

The data is ephemeral game state under a 24h TTL that reconnect/self-heal paths rebuild
anyway, so this is constant disk churn for little benefit. Loosening the save policy is a
cheap win.

---

## 4. A transiently-failed Telegram notification is dropped

**Severity: low.** Known limitation of the retry added in `1d3b13b9`.

`TelegramService.send_notification` now retries once after a transient failure and logs at
WARNING if the retry also fails — deliberately, so a network blip stops paging admins. But
the notification is then gone. Durable delivery needs a queue with retry/backoff, which
was out of scope.

Matters most for money-path messages (withdrawal confirmations).

---

## Verified healthy (Aug 3–10)

Recorded so nobody re-investigates these:

- **Zero 5xx** across 11,199 requests for the week.
- No application crashes, unhandled exceptions, or money-path errors outside the Aug 10
  outage window.
- The Aug 6 16:00 traffic spike (7,843 requests vs. a normal 1–30/hour) served cleanly.

## How this was gathered

```bash
railway logs -d <deployment-id> --since 7d -n 5000 --filter "@level:error" --json
railway metrics --cpu --memory -S 7d --raw --json
railway deployment list --service <service-id> --json
```

Gotchas: `-n` caps at 5000 and returns the *most recent* lines, so page backwards with
`--until`; logs are per-deployment, and a `REMOVED` deployment's logs are gone, so list
deployments first to find which ones cover the window. `railway logs --http` returned
"Problem processing request" on CLI v5.29 — use `railway metrics --http` instead.
