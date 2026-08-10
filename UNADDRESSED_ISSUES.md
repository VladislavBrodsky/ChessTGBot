# Unaddressed issues

Open problems found but **not** fixed. Each entry records the evidence so the next
person doesn't have to re-derive it. Delete an entry when it ships; move it to
`CLAUDE.md` if it turns into a durable convention.

Last reviewed: 2026-08-10 (log analysis window: Aug 3–10, Railway `production`).

---

## 1. Redis forks and writes an RDB snapshot every 60 seconds

**Severity: low.**

Redis service logs show `1 changes in 60 seconds. Saving...` → fork → `DB saved on disk`,
once a minute, continuously, on a 0.8 GB volume. That is the Railway template's
`save 60 1` default.

The data is ephemeral game state under a 24h TTL that reconnect/self-heal paths rebuild
anyway, so this is constant disk churn for little benefit. Loosening the save policy is a
cheap win.

---

## 2. A transiently-failed Telegram notification is dropped

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
