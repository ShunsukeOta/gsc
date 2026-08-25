import type { GscProperty, GscSearchAnalyticsResponse, GscSearchRequest } from './types';

const API_ROOT = 'https://www.googleapis.com/webmasters/v3';

export class GscApiError extends Error {
  constructor(message: string, public status: number, public details?: unknown) {
    super(message);
    this.name = 'GscApiError';
  }
}

async function readGoogleResponse<T>(response: Response): Promise<T> {
  const data = await response.json().catch(() => null) as { error?: { message?: string } } | T | null;
  if (!response.ok) {
    const message = data && typeof data === 'object' && 'error' in data ? data.error?.message : undefined;
    throw new GscApiError(message || `Search Console API request failed (${response.status})`, response.status, data);
  }
  return (data ?? {}) as T;
}

export async function listGscProperties(accessToken: string): Promise<GscProperty[]> {
  const response = await fetch(`${API_ROOT}/sites`, {
    headers: { authorization: `Bearer ${accessToken}` },
    cache: 'no-store',
  });
  const data = await readGoogleResponse<{ siteEntry?: GscProperty[] }>(response);
  return (data.siteEntry ?? []).sort((a, b) => a.siteUrl.localeCompare(b.siteUrl));
}

export async function querySearchAnalytics(accessToken: string, siteUrl: string, request: GscSearchRequest) {
  const response = await fetch(`${API_ROOT}/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${accessToken}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify(request),
    cache: 'no-store',
  });
  return readGoogleResponse<GscSearchAnalyticsResponse>(response);
}

export async function queryAllSearchAnalytics(
  accessToken: string,
  siteUrl: string,
  request: GscSearchRequest,
  maxRows: number,
) {
  const rows = [] as NonNullable<GscSearchAnalyticsResponse['rows']>;
  let startRow = 0;
  let metadata: GscSearchAnalyticsResponse['metadata'];
  const pageSize = Math.min(25_000, Math.max(1, maxRows));

  while (rows.length < maxRows) {
    const remaining = maxRows - rows.length;
    const response = await querySearchAnalytics(accessToken, siteUrl, {
      ...request,
      rowLimit: Math.min(pageSize, remaining),
      startRow,
    });
    const page = response.rows ?? [];
    if (!metadata && response.metadata) metadata = response.metadata;
    rows.push(...page);
    if (page.length < Math.min(pageSize, remaining)) break;
    startRow += page.length;
    if (page.length === 0) break;
  }

  return { rows, metadata };
}
