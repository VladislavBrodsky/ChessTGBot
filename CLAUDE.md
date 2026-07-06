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

Run locally: `cd frontend && npm test` and `cd backend && python -m pytest`. Backend tests live in `backend/app/tests/test_security.py` (pure-unit, no DB/network); `test_head_requests.py` and `verify_fix.py` there are manual live-server scripts, excluded from collection via `backend/pytest.ini`.

## iOS Telegram gotchas (hard-won)

- The app calls `tg.requestFullscreen()` (Bot API 8.0+) — on iOS the WebView covers the whole screen and Telegram defines `--tg-content-safe-area-inset-bottom: 0px`. A `var()` fallback chain therefore short-circuits at 0px and never reaches `env(safe-area-inset-bottom)`. Bottom insets MUST be combined with `max()`, not `var()` fallbacks — see `--app-safe-bottom` in `frontend/src/app/globals.css`. Every fixed bottom element must use `--app-safe-bottom`.
- `viewport-fit=cover` is required (`frontend/src/app/[locale]/layout.tsx`) so iOS exposes non-zero `env(safe-area-inset-*)`.
- The bottom navbar is NEVER hidden on main dashboard pages (`shouldHideNavbar` in `frontend/src/components/LayoutWrapper.tsx`). Do not add conditional hides there — overlays cover it with z-index >= 100 instead. Past conditional hides (CSS `:has()` rules, stale `activeGameId`, context hides) repeatedly stranded users with no menu.

## Structure

- `frontend/` — Next.js 16 (App Router, next-intl locales, Tailwind 4, framer-motion).
- `backend/` — FastAPI + Socket.IO + SQLAlchemy/Alembic (Postgres), Redis.
- `docker-compose.yml` — local Postgres + Redis only.

## Caching

The FastAPI static server sends HTML with `Cache-Control: no-cache, must-revalidate` and hashed `/_next/static/*` as `immutable`. Do not remove — Telegram's iOS WKWebView heuristically caches HTML without explicit headers.
