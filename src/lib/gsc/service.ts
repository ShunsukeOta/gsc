import { queryAllSearchAnalytics, querySearchAnalytics } from './client';
import { buildDateRange } from './dates';
import { DEFAULT_THRESHOLDS, getGscRuntimeConfig } from './env';
import { runAnalysisEngine } from './analysis';
import { buildGscRelations } from './relations';
import type { AnalysisThresholds, GscAnalysisBundle, GscDevice, GscFilter, GscSearchRequest } from './types';

type AnalysisOptions = {
  days?: number;
  device?: GscDevice;
  thresholds?: Partial<AnalysisThresholds>;
  force?: boolean;
};

type CacheEntry = { expiresAt: number; value: GscAnalysisBundle };
const analysisCache = new Map<string, CacheEntry>();

function deviceFilters(device: GscDevice): GscFilter[] {
  return device === 'all' ? [] : [{ dimension: 'device', operator: 'equals', expression: device }];
}

function requestBase(startDate: string, endDate: string, device: GscDevice): GscSearchRequest {
  const filters = deviceFilters(device);
  return {
    startDate,
    endDate,
    type: 'web',
    dataState: getGscRuntimeConfig().dataState,
    ...(filters.length ? { dimensionFilterGroups: [{ groupType: 'and' as const, filters }] } : {}),
  };
}

const cacheKey = (siteUrl: string, days: number, device: GscDevice, thresholds: AnalysisThresholds) =>
  JSON.stringify([siteUrl, days, device, thresholds.growthPercent, thresholds.declinePercent, thresholds.minImpressions, thresholds.opportunityMaxPosition]);

export async function getGscAnalysis(accessToken: string, siteUrl: string, options: AnalysisOptions = {}) {
  const runtime = getGscRuntimeConfig();
  const range = buildDateRange(options.days ?? 28);
  const device = options.device ?? 'all';
  const thresholds: AnalysisThresholds = { ...DEFAULT_THRESHOLDS, ...options.thresholds };
  const key = cacheKey(siteUrl, range.days, device, thresholds);
  const cached = analysisCache.get(key);
  if (!options.force && cached && cached.expiresAt > Date.now()) {
    return { ...cached.value, diagnostics: { ...cached.value.diagnostics, cache: 'hit' as const } };
  }

  const currentBase = requestBase(range.startDate, range.endDate, device);
  const previousBase = requestBase(range.previousStartDate, range.previousEndDate, device);

  const [currentTotal, previousTotal, currentQueries, previousQueries, currentPages, previousPages, queryPages, devices, daily] = await Promise.all([
    querySearchAnalytics(accessToken, siteUrl, { ...currentBase, rowLimit: 1 }),
    querySearchAnalytics(accessToken, siteUrl, { ...previousBase, rowLimit: 1 }),
    queryAllSearchAnalytics(accessToken, siteUrl, { ...currentBase, dimensions: ['query'], aggregationType: 'auto' }, runtime.maxRows),
    queryAllSearchAnalytics(accessToken, siteUrl, { ...previousBase, dimensions: ['query'], aggregationType: 'auto' }, runtime.maxRows),
    queryAllSearchAnalytics(accessToken, siteUrl, { ...currentBase, dimensions: ['page'], aggregationType: 'byPage' }, runtime.maxRows),
    queryAllSearchAnalytics(accessToken, siteUrl, { ...previousBase, dimensions: ['page'], aggregationType: 'byPage' }, runtime.maxRows),
    queryAllSearchAnalytics(accessToken, siteUrl, { ...currentBase, dimensions: ['query', 'page'], aggregationType: 'auto' }, runtime.maxRows),
    querySearchAnalytics(accessToken, siteUrl, { ...currentBase, dimensions: ['device'], aggregationType: 'auto', rowLimit: 10 }),
    querySearchAnalytics(accessToken, siteUrl, { ...currentBase, dimensions: ['date'], aggregationType: 'auto', rowLimit: Math.max(100, range.days + 5) }),
  ]);

  const core = runAnalysisEngine({
    siteUrl,
    range,
    thresholds,
    currentTotal: currentTotal.rows?.[0],
    previousTotal: previousTotal.rows?.[0],
    currentQueries: currentQueries.rows,
    previousQueries: previousQueries.rows,
    currentPages: currentPages.rows,
    previousPages: previousPages.rows,
    queryPages: queryPages.rows,
    devices: devices.rows ?? [],
    daily: daily.rows ?? [],
    partialDataFrom: daily.metadata?.first_incomplete_date,
  });
  const bundle: GscAnalysisBundle = { ...core, relations: buildGscRelations(queryPages.rows) };

  if (runtime.cacheTtlMs > 0) {
    analysisCache.set(key, { value: bundle, expiresAt: Date.now() + runtime.cacheTtlMs });
    if (analysisCache.size > 24) {
      for (const [entryKey, entry] of analysisCache) {
        if (entry.expiresAt <= Date.now()) analysisCache.delete(entryKey);
      }
      if (analysisCache.size > 24) analysisCache.delete(analysisCache.keys().next().value as string);
    }
  }

  return bundle;
}
