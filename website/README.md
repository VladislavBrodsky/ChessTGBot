# Web3Chess marketing website

Public site for Web3Chess. Separate Next.js app from `frontend/` (the Telegram Mini App), so
the Mini App's invariants (safe areas, navbar rules, static-export CI guard) are untouched.

- **Design system:** [`design-system/website/DESIGN.md`](../design-system/website/DESIGN.md) — "Fog Board".
  Tokens come from `design-system/website/theme.css`, imported by `src/app/globals.css`.
  **The app imports CSS from outside its own folder**, so the bundler root and the Docker build
  context are both the repo root (see `next.config.ts` and `Dockerfile`).
- **Copy:** all home-page text is in [`src/content/home.ts`](src/content/home.ts). Translating the
  site means translating that file; i18n wiring (next-intl, 10 locales) is the next step.
- **Product facts:** [`src/lib/config.ts`](src/lib/config.ts) holds the bot username, the deep-link
  rules and the settlement split. Settlement values mirror `backend/app/services/settlement.py`.

## Develop

```bash
cd website && npm install && npm run dev
```

## Checks

```bash
npm run build && npm run typecheck && npm run lint
```

## Deep links — read before adding a CTA

The Mini App treats any `start_param` that is not `ref_…` or `arena` as a **game id** and navigates
to `/game?id=…` (`frontend/src/app/[locale]/home/page.tsx`). A campaign parameter such as
`?startapp=site_hero` therefore sends players to a game that does not exist. Use `telegramLink()`
or `telegramLink("arena")` from `src/lib/config.ts` and nothing else.

The one exception is the marketing deep link the app already parses,
`mk_<card-id>_<channel>_<target>` (targets: `arena`, `academy`, `challenges`, `wallet`), which also
emits a `marketing_launch` telemetry event. Using it for website attribution requires a card id
reserved from the Marketing Content OS (`backend/app/services/marketing/`) — do not invent one.

## Deployment

Railway service **ChessTGBot - Website** in project `TGChessBot`, built from this repo's root with
`RAILWAY_DOCKERFILE_PATH=website/Dockerfile`. Pushing to `main` redeploys it.

Environment variables:

| Variable | Default | Purpose |
|---|---|---|
| `NEXT_PUBLIC_BOT_USERNAME` | `FinChess_bot` | Bot behind every CTA and QR code |
| `NEXT_PUBLIC_SITE_URL` | `https://web3chess.online` | Canonical URL for metadata, sitemap, robots |

## Not built yet

Blog, Academy/Premium/Trust/Fair-play pages, legal pages, i18n, analytics with consent, OG image
template, real app screenshots and commissioned illustrations. See DESIGN.md §14.3.
