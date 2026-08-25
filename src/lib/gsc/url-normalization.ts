import type { GscRow, UrlNormalizationSummary, UrlVariantGroup } from './types';

type AggregateResult = {
  rows: GscRow[];
  groups: UrlVariantGroup[];
  collapsedRows: number;
  fragmentRows: number;
};

type Accumulator = {
  keys: string[];
  clicks: number;
  impressions: number;
  weightedPosition: number;
  fallbackPosition: number;
  fallbackCount: number;
};

/**
 * Search Console can surface URL variants containing fragments (`#...`).
 * Fragments are client-side identifiers and are not part of the HTTP resource
 * sent to the server, so Phase 4 deliberately removes only the fragment.
 *
 * Query strings are preserved. They can represent genuinely different pages,
 * therefore stripping arbitrary parameters here would risk merging unrelated data.
 */
export function normalizeGscPageUrl(rawUrl: string) {
  const value = rawUrl.trim();
  const hashIndex = value.indexOf('#');
  if (hashIndex < 0) return value;
  const withoutFragment = value.slice(0, hashIndex);
  return withoutFragment || value;
}

export function hasGscFragment(rawUrl: string) {
  return rawUrl.includes('#');
}

function metricsFromAccumulator(value: Accumulator): GscRow {
  const impressions = value.impressions;
  const position = impressions > 0
    ? value.weightedPosition / impressions
    : value.fallbackCount > 0
      ? value.fallbackPosition / value.fallbackCount
      : 0;

  return {
    keys: value.keys,
    clicks: value.clicks,
    impressions,
    ctr: impressions > 0 ? value.clicks / impressions : 0,
    position,
  };
}

/**
 * Aggregates rows after normalizing the page dimension at pageKeyIndex.
 * Position is impression-weighted, CTR is recalculated from aggregated clicks /
 * impressions, and raw URL variants are retained for diagnostics/UI disclosure.
 */
export function aggregateGscPageRows(rows: GscRow[], pageKeyIndex: number): AggregateResult {
  const aggregated = new Map<string, Accumulator>();
  const variants = new Map<string, Set<string>>();
  const metricsByCanonical = new Map<string, { clicks: number; impressions: number }>();
  let fragmentRows = 0;

  for (const row of rows) {
    const keys = [...(row.keys ?? [])];
    const rawPage = keys[pageKeyIndex];
    if (!rawPage) continue;

    const canonicalPage = normalizeGscPageUrl(rawPage);
    if (canonicalPage !== rawPage) fragmentRows += 1;
    keys[pageKeyIndex] = canonicalPage;

    const key = JSON.stringify(keys);
    const current = aggregated.get(key) ?? {
      keys,
      clicks: 0,
      impressions: 0,
      weightedPosition: 0,
      fallbackPosition: 0,
      fallbackCount: 0,
    };

    current.clicks += Number.isFinite(row.clicks) ? row.clicks : 0;
    current.impressions += Number.isFinite(row.impressions) ? row.impressions : 0;
    if (Number.isFinite(row.position)) {
      if (row.impressions > 0) current.weightedPosition += row.position * row.impressions;
      else {
        current.fallbackPosition += row.position;
        current.fallbackCount += 1;
      }
    }
    aggregated.set(key, current);

    const set = variants.get(canonicalPage) ?? new Set<string>();
    set.add(rawPage);
    variants.set(canonicalPage, set);

    const metrics = metricsByCanonical.get(canonicalPage) ?? { clicks: 0, impressions: 0 };
    metrics.clicks += Number.isFinite(row.clicks) ? row.clicks : 0;
    metrics.impressions += Number.isFinite(row.impressions) ? row.impressions : 0;
    metricsByCanonical.set(canonicalPage, metrics);
  }

  const normalizedRows = [...aggregated.values()].map(metricsFromAccumulator);
  const groups: UrlVariantGroup[] = [];
  for (const [canonicalUrl, rawVariants] of variants) {
    const list = [...rawVariants];
    const changed = list.some((variant) => variant !== canonicalUrl);
    if (!changed && list.length <= 1) continue;
    const metrics = metricsByCanonical.get(canonicalUrl) ?? { clicks: 0, impressions: 0 };
    groups.push({
      canonicalUrl,
      variants: list.sort(),
      fragmentVariants: list.filter(hasGscFragment).length,
      clicks: Math.round(metrics.clicks),
      impressions: Math.round(metrics.impressions),
    });
  }

  groups.sort((a, b) => b.impressions - a.impressions || b.variants.length - a.variants.length);
  return {
    rows: normalizedRows,
    groups,
    collapsedRows: Math.max(0, rows.length - normalizedRows.length),
    fragmentRows,
  };
}

export function buildUrlNormalizationSummary(
  pageResult: AggregateResult,
  queryPageResult: AggregateResult,
): UrlNormalizationSummary {
  const merged = new Map<string, UrlVariantGroup>();
  for (const group of [...queryPageResult.groups, ...pageResult.groups]) {
    const current = merged.get(group.canonicalUrl);
    if (!current) {
      merged.set(group.canonicalUrl, { ...group, variants: [...group.variants] });
      continue;
    }
    current.variants = [...new Set([...current.variants, ...group.variants])].sort();
    current.fragmentVariants = current.variants.filter(hasGscFragment).length;
    // Page-level metrics are preferable because query×page data can omit long-tail rows.
    if (pageResult.groups.some((item) => item.canonicalUrl === group.canonicalUrl)) {
      const pageGroup = pageResult.groups.find((item) => item.canonicalUrl === group.canonicalUrl);
      if (pageGroup) {
        current.clicks = pageGroup.clicks;
        current.impressions = pageGroup.impressions;
      }
    }
  }

  const groups = [...merged.values()].sort((a, b) => b.impressions - a.impressions);
  return {
    affectedGroups: groups.length,
    fragmentRows: Math.max(pageResult.fragmentRows, queryPageResult.fragmentRows),
    collapsedPageRows: pageResult.collapsedRows,
    collapsedQueryPageRows: queryPageResult.collapsedRows,
    groups: groups.slice(0, 100),
    policy: 'fragment-only',
  };
}
