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
cd website && npm ci --include=optional && npm run dev
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

Premium and Trust pages, i18n (the app ships 10 languages; the site is English only), analytics with
consent, real Mini App screenshots and commissioned illustrations. See DESIGN.md §14.3.

## Gotchas (each one cost a debugging session)

- **Never put a Tailwind display utility (`block`, `flex`, `grid`…) on an element whose `display` a
  `.component` class toggles.** `globals.css` keeps component rules in `@layer components`; utilities live
  in a later layer and win regardless of specificity or media queries. This is how the blog's mobile
  `<select>` and desktop chips both rendered on desktop. Keep such elements free of display utilities.
- **No `loading.tsx` anywhere under `src/app`.** It wraps every child segment in a Suspense boundary that
  flushes before `notFound()` runs, so an unknown `/blog/<slug>` returns **200** instead of 404 (a soft 404).
  `dynamicParams` must stay `true` for scheduled articles, so the boundary can't be worked around. Pages are
  prerendered, so route skeletons would add nothing anyway. Use `loading-sheen` on genuinely async UI.
- **`error.tsx` / `global-error.tsx` receive `retry`, not `reset`** in this Next release (check
  `node_modules/next/dist/docs` before copying patterns from older versions).
- **Run automated accessibility checks with `reducedMotion: "reduce"`** if scroll-driven animation is ever
  added: text caught mid-fade is reported as a contrast failure.
