export const WEB_ANALYTICS_BEACON_SRC: string;

export function isRealWebAnalyticsToken(value: unknown): boolean;

export function isProductionAnalyticsHost(hostname: string): boolean;

export function isAnalyticsExcludedPath(pathname: string): boolean;

export function shouldInjectWebAnalytics(input: {
  hostname: string;
  pathname: string;
  contentType: string | null;
  token: unknown;
  method?: string;
  status?: number;
}): boolean;

export function webAnalyticsBeaconHtml(token: string): string;

export function injectWebAnalyticsHtml(html: string, token: string): string;

export function injectWebAnalyticsResponse(
  request: Request,
  response: Response,
  token: unknown,
): Promise<Response>;
