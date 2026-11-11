/**
 * OpenNext's worker template only exports fetch. Cron triggers need scheduled.
 * The handler POSTs /api/internal/reminders/digest through WORKER_SELF_REFERENCE
 * so the Next route runs inside the same worker. Idempotent.
 *
 * The same pass wraps fetch and appends the official Cloudflare Web Analytics
 * beacon to production HTML when CF_WEB_ANALYTICS_TOKEN matches a real token.
 * The gate lives in src/lib/web-analytics-gate.mjs and is inlined here.
 *
 * Patches the package template (so the next build copies it) and, when present,
 * the built `.open-next/worker.js`.
 */
import fs from "node:fs";
import { pathToFileURL } from "node:url";

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

const ANALYTICS_MARKER = "/* alane-web-analytics-wrap */";

function analyticsRuntimeSource() {
  const raw = fs.readFileSync(new URL("../src/lib/web-analytics-gate.mjs", import.meta.url), "utf8");
  const stripped = raw.replace(/^export /gm, "");
  if (/(^|\n)export\s/.test(stripped)) {
    throw new Error("Could not inline web analytics gate: an export remained.");
  }
  return stripped;
}

function wrapAnalytics(source) {
  const needle = "export default {";
  const index = source.indexOf(needle);
  if (index === -1 || !source.includes("async fetch(")) {
    throw new Error("Could not patch OpenNext worker: fetch export shape changed.");
  }
  if (source.indexOf(needle, index + needle.length) !== -1) {
    throw new Error("Could not patch OpenNext worker: multiple default exports.");
  }
  const renamed = `${source.slice(0, index)}const alaneOpenNextWorker = {${source.slice(index + needle.length)}`;
  return `${renamed}
${ANALYTICS_MARKER}
${analyticsRuntimeSource()}
export default {
    async fetch(request, env, ctx) {
        const response = await alaneOpenNextWorker.fetch(request, env, ctx);
        return injectWebAnalyticsResponse(request, response, env && env.CF_WEB_ANALYTICS_TOKEN);
    },
    async scheduled(event, env, ctx) {
        if (typeof alaneOpenNextWorker.scheduled !== "function") return;
        return alaneOpenNextWorker.scheduled(event, env, ctx);
    },
};
`;
}

export function patchWorkerSource(source) {
  let next = source;
  let changed = false;
  if (!(next.includes("async scheduled(") && next.includes("/api/internal/reminders/digest"))) {
    if (!next.includes("async fetch(") || !next.includes("export default {")) {
      throw new Error("Could not patch OpenNext worker: fetch export shape changed.");
    }
    const closing = "\n};";
    const index = next.lastIndexOf(closing);
    if (index === -1) {
      throw new Error("Could not patch OpenNext worker: missing default export close.");
    }
    next = `${next.slice(0, index)}\n${SCHEDULED}};${next.slice(index + closing.length)}`;
    changed = true;
  }
  if (!next.includes(ANALYTICS_MARKER)) {
    next = wrapAnalytics(next);
    changed = true;
  }
  return { source: next, changed };
}

const invokedDirectly = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (invokedDirectly) {
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
}
