# ChessTGBot

Telegram Mini App chess game. Next.js static-export frontend + FastAPI backend (unified monolith on Railway).

## CRITICAL: frontend changes do not ship until the static export is rebuilt

Production serves the **committed** `backend/static_frontend/` directory (see `backend/app/main.py`), NOT a live build of `frontend/src`.

After ANY change under `frontend/src`, `frontend/public`, or frontend config, you MUST:

```bash
cd frontend && npm run build:static
```

then commit the resulting `backend/static_frontend/` changes together with the source change. A source-only commit silently deploys nothing — this caused the "missing bottom navbar on iOS Telegram" incident (fixes existed in `frontend/src` for 5 commits while production kept serving a stale build).

Quick staleness check: `git log -1 --oneline -- backend/static_frontend` should not be older than the last commit touching `frontend/src`.

## Structure

- `frontend/` — Next.js 16 (App Router, next-intl locales, Tailwind 4, framer-motion). `STATIC_EXPORT=true` enables `output: 'export'`.
- `backend/` — FastAPI + Socket.IO + SQLAlchemy/Alembic (Postgres), Redis. Serves the static frontend and the API from one app.
- `docker-compose.yml` — local Postgres + Redis only.

## Caching

HTML is served with `Cache-Control: no-cache, must-revalidate`; hashed `/_next/static/*` assets are `immutable`. Do not remove these headers — Telegram's iOS WKWebView heuristically caches HTML without them and users get stuck on stale builds.
