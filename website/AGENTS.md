<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Website design and component integration

- Read `../design-system/website/DESIGN.md` and `docs/MAGIC_UI_INTEGRATION.md` before changing visual components. Marketing uses the light website theme; never import Mini App tokens.
- Keep all owner-approved marketing modules and full copy. Production sync is additive; preserve the LIVE strip, avatars, feeds, vault, stakes, referrals, globe, ecosystem, Academy, and journal. Headings have no terminal periods.
- Use `src/components/ui/` primitives and the local adapters in `src/components/magicui/`. Registry demos are references; their fixed dimensions, default palette, and hover-only actions do not define our layout.
- Tailwind v4 clears the default color and shadow namespaces. Use the defined semantic utilities, including `text-fg`, `text-fg-win`, `bg-inset`, `bg-inverse`, and `text-title`. Do not construct utility names from runtime values.
- Run `npm run lint`, `npm run build`, and `npm run seo:check`. The build verifies source dependencies and actual generated CSS before and after compilation. Check phone and desktop layouts and native keyboard/pause interactions when changing component geometry.
- An isolated checkout with symlinked dependencies uses `npm run dev -- --webpack`; production builds also use webpack. Do not change the repository build configuration to work around the checkout's symlink.
