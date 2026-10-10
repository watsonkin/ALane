<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## 街拍摄影赛事聚合站

M0 only: Zod schema, `data/contests/*.yaml`, list and detail pages, CI stub. Do not add ingest, image mirroring, or ICS until a later milestone asks for them.

- Validate data with `npm run validate-data` before trusting a YAML edit.
- Contest pages read the filesystem through `src/lib/contests.ts` (`use cache`). A YAML edit ships with the next build.
- Dev server: `npm run dev` on port 3847.
