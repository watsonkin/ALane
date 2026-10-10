/**
 * Next.js 16.4 loads `.next/server/preview-props.json` from the server
 * constructor. OpenNext 1.20.x only inlines `*-manifest`, `required-server-files`,
 * and `prefetch-hints`, then throws on anything else (Workers error 1101).
 *
 * Upstream fix: opennextjs/opennextjs-cloudflare#1356 (not released as of 1.20.10).
 * This no-ops once the installed package already includes `preview-props`.
 */
import fs from "node:fs";

const target = new URL(
  "../node_modules/@opennextjs/cloudflare/dist/cli/build/patches/plugins/load-manifest.js",
  import.meta.url,
);

const needle = "**/{*-manifest,required-server-files,prefetch-hints}.json";
const replacement = "**/{*-manifest,required-server-files,prefetch-hints,preview-props}.json";

const source = fs.readFileSync(target, "utf8");

if (source.includes("preview-props")) {
  process.stdout.write("opennext load-manifest already includes preview-props\n");
  process.exit(0);
}

if (!source.includes(needle)) {
  throw new Error(
    "Could not patch @opennextjs/cloudflare load-manifest.js: glob pattern changed. " +
      "Check whether preview-props is inlined before removing this script.",
  );
}

fs.writeFileSync(target, source.replace(needle, replacement));
process.stdout.write("patched opennext load-manifest to inline preview-props.json\n");
