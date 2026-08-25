import type { GscRelations, GscRow, RelatedPerformance } from './types';

const normalize = (label: string, row: GscRow): RelatedPerformance => ({
  label,
  clicks: Math.round(row.clicks),
  impressions: Math.round(row.impressions),
  ctr: Number((row.ctr * 100).toFixed(2)),
  position: Number(row.position.toFixed(1)),
});

export function buildGscRelations(rows: GscRow[]): GscRelations {
  const queryToPages = new Map<string, Array<{ label: string; row: GscRow }>>();
  const pageToQueries = new Map<string, Array<{ label: string; row: GscRow }>>();

  for (const row of rows) {
    const query = row.keys?.[0];
    const page = row.keys?.[1];
    if (!query || !page) continue;
    const pages = queryToPages.get(query) ?? [];
    pages.push({ label: page, row });
    queryToPages.set(query, pages);
    const queries = pageToQueries.get(page) ?? [];
    queries.push({ label: query, row });
    pageToQueries.set(page, queries);
  }

  const convert = (map: Map<string, Array<{ label: string; row: GscRow }>>) => {
    const output: Record<string, RelatedPerformance[]> = {};
    for (const [key, values] of map) {
      output[key] = values
        .sort((a, b) => b.row.clicks - a.row.clicks || b.row.impressions - a.row.impressions)
        .slice(0, 12)
        .map(({ label, row }) => normalize(label, row));
    }
    return output;
  };

  return { queryToPages: convert(queryToPages), pageToQueries: convert(pageToQueries) };
}
