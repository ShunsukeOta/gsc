import type { Opportunity, PerformanceRow, Priority, SignalRow } from '@/lib/application-data';

export type GscDimension = 'date' | 'query' | 'page' | 'device' | 'country' | 'searchAppearance';
export type GscDevice = 'all' | 'MOBILE' | 'DESKTOP' | 'TABLET';
export type GscDataState = 'final' | 'all';

export type GscProperty = { siteUrl: string; permissionLevel: string };
export type GscRow = { keys?: string[]; clicks: number; impressions: number; ctr: number; position: number };
export type GscSearchAnalyticsResponse = {
  rows?: GscRow[];
  responseAggregationType?: string;
  metadata?: { first_incomplete_date?: string; first_incomplete_hour?: string };
};
export type GscFilter = {
  dimension: Exclude<GscDimension, 'date'>;
  operator?: 'contains' | 'equals' | 'notContains' | 'notEquals' | 'includingRegex' | 'excludingRegex';
  expression: string;
};
export type GscSearchRequest = {
  startDate: string;
  endDate: string;
  dimensions?: GscDimension[];
  type?: 'web' | 'image' | 'video' | 'news' | 'discover' | 'googleNews';
  dimensionFilterGroups?: Array<{ groupType: 'and'; filters: GscFilter[] }>;
  aggregationType?: 'auto' | 'byPage' | 'byProperty';
  rowLimit?: number;
  startRow?: number;
  dataState?: GscDataState;
};

export type DateRange = { startDate: string; endDate: string; previousStartDate: string; previousEndDate: string; days: number };
export type AnalysisThresholds = { growthPercent: number; declinePercent: number; minImpressions: number; opportunityMaxPosition: number };
export type DashboardMetric = { label: string; value: string; change: string; direction: 'up' | 'down'; note: string };
export type DailyPoint = { date: string; clicks: number; impressions: number; ctr: number; position: number };
export type DeviceDistributionItem = { label: string; value: number; clicks: number };
export type RankDistributionItem = { label: string; value: number; count: number };
export type DailyTask = { id: string; priority: number; title: string; detail: string; action: string };
export type CannibalizationGroup = {
  id: string;
  query: string;
  overlap: number;
  clicks: number;
  impressions: number;
  priority: Priority;
  pages: Array<{ url: string; clicks: number; position: number; share: number }>;
  recommendation: string;
};
export type DashboardInsight = { title: string; value: string; meta: string; action: string; tone: 'success' | 'warning' | 'danger' };
export type RelatedPerformance = { label: string; clicks: number; impressions: number; ctr: number; position: number };
export type GscRelations = { queryToPages: Record<string, RelatedPerformance[]>; pageToQueries: Record<string, RelatedPerformance[]> };

export type UrlVariantGroup = {
  canonicalUrl: string;
  variants: string[];
  fragmentVariants: number;
  clicks: number;
  impressions: number;
};

export type UrlNormalizationSummary = {
  affectedGroups: number;
  fragmentRows: number;
  collapsedPageRows: number;
  collapsedQueryPageRows: number;
  groups: UrlVariantGroup[];
  policy: 'fragment-only';
};

export type ProductionAnomalyKind = 'rank-loss' | 'ctr-loss' | 'demand-loss' | 'traffic-drop' | 'growth-breakout' | 'daily-drop';
export type ProductionAnomaly = {
  id: string;
  kind: ProductionAnomalyKind;
  scope: 'query' | 'page' | 'site';
  severity: 'critical' | 'warning' | 'info';
  label: string;
  title: string;
  summary: string;
  action: string;
  score: number;
  confidence: number;
  impressions: number;
  clickDelta: number;
  positionDelta?: number;
  ctrDelta?: number;
  evidence: string[];
};

export type DataQualitySummary = {
  score: number;
  level: 'excellent' | 'good' | 'caution';
  notes: string[];
  partialData: boolean;
  queryRowsTruncated: boolean;
  pageRowsTruncated: boolean;
  queryPageRowsTruncated: boolean;
  normalizedUrlGroups: number;
};

export type GscAnalysisBundle = {
  source: 'gsc';
  siteUrl: string;
  generatedAt: string;
  range: DateRange;
  partialDataFrom?: string;
  thresholds: AnalysisThresholds;
  metrics: DashboardMetric[];
  daily: DailyPoint[];
  queries: PerformanceRow[];
  pages: PerformanceRow[];
  opportunities: Opportunity[];
  growth: SignalRow[];
  declines: SignalRow[];
  ctr: SignalRow[];
  cannibalization: CannibalizationGroup[];
  devices: DeviceDistributionItem[];
  ranks: RankDistributionItem[];
  dailyTasks: DailyTask[];
  insights: DashboardInsight[];
  relations?: GscRelations;
  urlNormalization?: UrlNormalizationSummary;
  anomalies?: ProductionAnomaly[];
  dataQuality?: DataQualitySummary;
  diagnostics: {
    fetchedQueryRows: number;
    fetchedPageRows: number;
    fetchedQueryPageRows: number;
    normalizedPageRows?: number;
    normalizedQueryPageRows?: number;
    queryRowsTruncated?: boolean;
    pageRowsTruncated?: boolean;
    queryPageRowsTruncated?: boolean;
    cache: 'hit' | 'miss';
  };
};

export type GoogleSession = { accessToken: string; refreshToken: string; expiresAt: number; email?: string; scope?: string };
export type OAuthStatePayload = { state: string; verifier: string; returnTo: string; createdAt: number };
