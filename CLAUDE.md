# ChessTGBot

Telegram Mini App chess game. Next.js frontend + FastAPI backend.

## Production topology (verified 2026-07)

Two separate Railway services, auto-deployed from this repo on push to `main`:

- **Frontend**: `https://chesstgbot-frontend-production.up.railway.app` — runs `next start` (NOT the static export). Built from `frontend/`. This is what the Telegram Mini App loads.
- **Backend**: `https://chesstgbot-backend-production.up.railway.app` — FastAPI + Socket.IO, built from `backend/` (no `static_frontend` inside; its SPA-serving code path is inactive there).
- The monolith URL `chesstgbot-production.up.railway.app` (default `WEBAPP_URL` in `backend/app/core/config.py`) is DEAD — do not test against it. `frontend/src/lib/api.ts` maps the frontend host to the backend host at runtime.

So: **frontend fixes ship by pushing `frontend/src` to main** (Railway rebuilds the frontend service). To verify what production actually runs, curl the frontend URL and grep the served HTML/chunks — don't assume.

## backend/static_frontend

A committed static export used only when deploying as a single monolith container (root `Dockerfile` also rebuilds it fresh). Keep it in sync after frontend changes with:

```bash
cd frontend && npm run build:static
```

then commit the result. A stale committed export has caused confusion during debugging before. CI enforces this: the `static-export-fresh` job fails a PR that changes `frontend/src` (or frontend config) without a rebuilt `backend/static_frontend`. Run the check locally with `bash scripts/check-static-export-fresh.sh`.

## CI & tests

`.github/workflows/ci.yml` runs on every PR and push to `main`:
- **frontend**: `npm ci` → `npm run build` (static export) → `npm run test:ci` (jest) → `npm run lint` (non-blocking).
- **backend**: `pip install` → import check (`python -c "import app.main"`) → `python -m pytest`.
- **static-export-fresh**: the staleness guard above (PRs only).

Run locally: `cd frontend && npm test` and `cd backend && python -m pytest` (on Windows use the project venv: `./venv/Scripts/python -m pytest`). The main suite is `backend/tests/` (~260 tests, needs the docker-compose Postgres for the `_test` database); `backend/app/tests/` holds a few pure-unit tests plus manual live-server scripts excluded via `backend/pytest.ini`.

## iOS Telegram gotchas (hard-won)

- The app calls `tg.requestFullscreen()` (Bot API 8.0+) — on iOS the WebView covers the whole screen and Telegram defines `--tg-content-safe-area-inset-bottom: 0px`. A `var()` fallback chain therefore short-circuits at 0px and never reaches `env(safe-area-inset-bottom)`. Bottom insets MUST be combined with `max()`, not `var()` fallbacks — see `--app-safe-bottom` in `frontend/src/app/globals.css`. Every fixed bottom element must use `--app-safe-bottom`.
- `viewport-fit=cover` is required (`frontend/src/app/[locale]/layout.tsx`) so iOS exposes non-zero `env(safe-area-inset-*)`.
- The bottom navbar is NEVER hidden on main dashboard pages (`shouldHideNavbar` in `frontend/src/components/LayoutWrapper.tsx`). Do not add conditional hides there — overlays cover it with z-index >= 100 instead. Past conditional hides (CSS `:has()` rules, stale `activeGameId`, context hides) repeatedly stranded users with no menu.

## Money & bot conventions (hard-won)

- **HTML-escape every user-controlled string** (Telegram display names above all) before it enters a `parse_mode="HTML"` message — bot replies, referral notifications, admin alerts. A name containing `<` crashed `/start` for weeks (`BadRequest: Can't parse entities`), and the HTML error-reply-with-exception pattern made it unreportable. Alert tracebacks are tail-truncated and escaped for the same reason.
- **Bot handler errors** must log via the `app.bot.errors` logger, not the module logger — `app.services.telegram_bot` is excluded from admin alerts to prevent notification loops, so errors logged there are invisible.
- **Admin alerts** are attributed to named systems (GAME CLIENT / CORE API / TREASURY / REALTIME / SECURITY) via the logger-prefix map in `backend/app/core/alerts.py`; new money/security modules should be added to that map. Alert fingerprinting dedupes on the message's FIRST line — keep distinguishing detail there.
- **Withdrawals** below the review threshold are held as `pending_confirmation` until the owner taps Confirm in the bot chat (HMAC nonce in callback_data; `backend/app/services/withdrawal_confirmation.py`). Never blind-refund a withdrawal in `processing_payout` or with a broadcast-timeout — the transfer may have hit the chain; check tonviewer first.
- **The platform's only money entry** is the USDT deposit transfer to the master wallet with a `ref_` comment. Transak (and any future on-ramp/swap flow — the STON.fi in-app swap was removed 2026-07-16) delivers to the USER's wallet; keep it that way — don't add credit paths without dedup keys or credit from third-party status.
- **Debugging production client alerts**: match the alert's `/_next/static/chunks/*` hashes and timestamp against the deploy timeline before reading code — with several sessions pushing to `main`, the crash is often in an already-replaced build. Commits carry mixed timezones (-04:00/-06:00); compare in UTC.

## Structure

- `frontend/` — Next.js 16 (App Router, next-intl locales, Tailwind 4, framer-motion).
- `backend/` — FastAPI + Socket.IO + SQLAlchemy/Alembic (Postgres), Redis.
- `docker-compose.yml` — local Postgres + Redis only.

## Caching

The FastAPI static server sends HTML with `Cache-Control: no-cache, must-revalidate` and hashed `/_next/static/*` as `immutable`. Do not remove — Telegram's iOS WKWebView heuristically caches HTML without explicit headers.
