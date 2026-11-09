/**
 * OpenNext's worker template only exports fetch. Cron triggers need scheduled.
 * The handler POSTs /api/internal/reminders/digest through WORKER_SELF_REFERENCE
 * so the Next route runs inside the same worker. Idempotent.
 *
 * Patches the package template (so the next build copies it) and, when present,
 * the built `.open-next/worker.js`.
 */
import fs from "node:fs";

const SCHEDULED = `
    async scheduled(_event, env, ctx) {
        const secret = env.REMINDERS_CRON_SECRET;
        if (!secret || !env.WORKER_SELF_REFERENCE) return;
        const request = new Request("https://alane.photography/api/internal/reminders/digest", {
            method: "POST",
            headers: {
                authorization: "Bearer " + secret,
                "content-type": "application/json",
            },
        });
        ctx.waitUntil(env.WORKER_SELF_REFERENCE.fetch(request));
    },
`;

function patchWorkerSource(source) {
  if (source.includes("async scheduled(") && source.includes("/api/internal/reminders/digest")) {
    return { source, changed: false };
  }
  if (!source.includes("async fetch(") || !source.includes("export default {")) {
    throw new Error("Could not patch OpenNext worker: fetch export shape changed.");
  }
  const closing = "\n};";
  const index = source.lastIndexOf(closing);
  if (index === -1) {
    throw new Error("Could not patch OpenNext worker: missing default export close.");
  }
  return {
    source: `${source.slice(0, index)}\n${SCHEDULED}};${source.slice(index + closing.length)}`,
    changed: true,
  };
}

const targets = [
  new URL("../node_modules/@opennextjs/cloudflare/dist/cli/templates/worker.js", import.meta.url),
  new URL("../.open-next/worker.js", import.meta.url),
];

let seen = 0;
for (const target of targets) {
  if (!fs.existsSync(target)) continue;
  seen += 1;
  const result = patchWorkerSource(fs.readFileSync(target, "utf8"));
  if (result.changed) {
    fs.writeFileSync(target, result.source);
    process.stdout.write(`patched scheduled handler in ${target.pathname}\n`);
  } else {
    process.stdout.write(`scheduled handler already present in ${target.pathname}\n`);
  }
}

if (seen === 0) {
  throw new Error("No OpenNext worker template found to patch.");
}
