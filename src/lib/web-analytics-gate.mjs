/**
 * Official Cloudflare Web Analytics beacon gate.
 * scripts/patch-opennext-scheduled.mjs inlines this file into the OpenNext worker.
 * The gate decides whether a response may receive the beacon. It does not store
 * requests, cookies, or identifiers.
 */
export const WEB_ANALYTICS_BEACON_SRC = "https://static.cloudflareinsights.com/beacon.min.js";

const TOKEN_PATTERN = /^[0-9a-f]{32}$/i;
const PRODUCTION_HOSTS = new Set(["alane.photography", "www.alane.photography"]);

export function isRealWebAnalyticsToken(value) {
  return typeof value === "string" && TOKEN_PATTERN.test(value.trim());
}

export function isProductionAnalyticsHost(hostname) {
  const host = String(hostname || "")
    .trim()
    .toLowerCase()
    .replace(/\.$/, "");
  return PRODUCTION_HOSTS.has(host);
}

export function isAnalyticsExcludedPath(pathname) {
  const raw = String(pathname || "/").split("?")[0].split("#")[0].toLowerCase();
  let path = raw.startsWith("/") ? raw : `/${raw}`;
  if (path.length > 1) path = path.replace(/\/+$/, "");
  if (path.endsWith(".ics")) return true;
  if (path === "/calendar" || path.endsWith("/calendar")) return true;
  if (path === "/_next" || path.startsWith("/_next/")) return true;
  if (path === "/cdn-cgi" || path.startsWith("/cdn-cgi/")) return true;
  return false;
}

export function shouldInjectWebAnalytics(input) {
  const method = String(input.method || "GET").toUpperCase();
  if (method === "HEAD") return false;
  if (input.status === 204 || input.status === 205 || input.status === 304) return false;
  if (!isRealWebAnalyticsToken(input.token)) return false;
  if (!isProductionAnalyticsHost(input.hostname)) return false;
  if (isAnalyticsExcludedPath(input.pathname)) return false;
  const type = String(input.contentType || "")
    .split(";")[0]
    .trim()
    .toLowerCase();
  return type === "text/html";
}

export function webAnalyticsBeaconHtml(token) {
  if (!isRealWebAnalyticsToken(token)) return "";
  const payload = JSON.stringify({ token: token.trim() });
  return `<script type="module" src="${WEB_ANALYTICS_BEACON_SRC}" data-cf-beacon='${payload}'></script>`;
}

export function injectWebAnalyticsHtml(html, token) {
  const tag = webAnalyticsBeaconHtml(token);
  if (!tag || html.includes(WEB_ANALYTICS_BEACON_SRC)) return html;
  const matches = html.match(/<\/body\s*>/gi);
  if (!matches || matches.length === 0) return `${html}${tag}`;
  const close = matches[matches.length - 1];
  const at = html.lastIndexOf(close);
  if (at === -1) return `${html}${tag}`;
  return `${html.slice(0, at)}${tag}${html.slice(at)}`;
}

export async function injectWebAnalyticsResponse(request, response, token) {
  let url;
  try {
    url = new URL(request.url);
  } catch {
    return response;
  }
  if (
    !shouldInjectWebAnalytics({
      hostname: url.hostname,
      pathname: url.pathname,
      contentType: response.headers.get("content-type"),
      token,
      method: request.method,
      status: response.status,
    })
  ) {
    return response;
  }
  const html = await response.text();
  const headers = new Headers(response.headers);
  headers.delete("content-length");
  headers.delete("content-encoding");
  return new Response(injectWebAnalyticsHtml(html, token), {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
