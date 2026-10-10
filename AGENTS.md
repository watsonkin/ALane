<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## 街拍摄影赛事聚合站

M0: Zod schema, `data/contests/*.yaml`, list and detail pages, small winner thumbs. Do not add ingest crawlers. Thumbs live only under `public/thumbs/{contest-id}/` with longest edge ≤ 400. `gallery_works[].source_page_url` is that work’s own page, and the thumb link uses it directly. Do not store or hotlink originals.

- Validate data with `npm run validate-data` before trusting a YAML edit.
- `prebuild` snapshots `data/contests` into `src/generated/contests.json`. Production reads that snapshot, not the YAML directory. Do not turn Cache Components back on; Next 16.4 plus OpenNext throws on `preview-props.json` unless the postinstall glob patch is present.
- Dev server: `npm run dev` on port 3847.
