import type { Opportunity, PerformanceRow, Priority, SignalRow } from '@/lib/analysis-types';
import type {
  AnalysisThresholds,
  CannibalizationGroup,
  DashboardInsight,
  DashboardMetric,
  DailyPoint,
  DailyTask,
  DateRange,
  DeviceDistributionItem,
  GscAnalysisBundle,
  GscRow,
  GscSearchType,
  RankDistributionItem,
} from './types';

type AnalysisEngineInput = {
  siteUrl: string;
  searchType: GscSearchType;
  range: DateRange;
  thresholds: AnalysisThresholds;
  currentTotal?: GscRow;
  previousTotal?: GscRow;
  currentQueries: GscRow[];
  previousQueries: GscRow[];
  currentPages: GscRow[];
  previousPages: GscRow[];
  queryPages: GscRow[];
  devices: GscRow[];
  daily: GscRow[];
  partialDataFrom?: string;
};

type ExpectedCtr = Map<string, number>;

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const pct = (current: number, previous: number) => previous > 0 ? ((current - previous) / previous) * 100 : current > 0 ? 100 : 0;
const round = (value: number, digits = 1) => Number(value.toFixed(digits));
const format = (value: number) => new Intl.NumberFormat('ja-JP', { maximumFractionDigits: 0 }).format(value);
const ctrPercent = (row?: GscRow) => (row?.ctr ?? 0) * 100;

function hashString(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

const rowId = (prefix: string, label: string) => `${prefix}-${hashString(label)}`;

function positionBucket(position: number) {
  if (position <= 3) return '1-3';
  if (position <= 5) return '4-5';
  if (position <= 10) return '6-10';
  if (position <= 20) return '11-20';
  return '21+';
}

function buildExpectedCtr(rows: GscRow[]): ExpectedCtr {
  const buckets = new Map<string, { clicks: number; impressions: number }>();
  let totalClicks = 0;
  let totalImpressions = 0;
  for (const row of rows) {
    const key = positionBucket(row.position);
    const current = buckets.get(key) ?? { clicks: 0, impressions: 0 };
    current.clicks += row.clicks;
    current.impressions += row.impressions;
    buckets.set(key, current);
    totalClicks += row.clicks;
    totalImpressions += row.impressions;
  }
  const fallback = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 2;
  const result = new Map<string, number>();
  for (const [key, value] of buckets) result.set(key, value.impressions > 0 ? (value.clicks / value.impressions) * 100 : fallback);
  result.set('fallback', fallback);
  return result;
}

function expectedCtrFor(position: number, expected: ExpectedCtr) {
  return expected.get(positionBucket(position)) ?? expected.get('fallback') ?? 2;
}

function makeSpark(previous: number, current: number, seedText: string) {
  const seed = Number.parseInt(hashString(seedText).slice(0, 6), 36) || 7;
  const start = Math.max(previous / 12, 1);
  const end = Math.max(current / 12, 1);
  return Array.from({ length: 12 }, (_, index) => {
    const progress = index / 11;
    const base = start + (end - start) * progress;
    const wave = (((seed >> (index % 12)) & 7) - 3) * 0.018;
    return Math.max(1, round(base * (1 + wave), 2));
  });
}

function priorityFromScore(score: number): Priority {
  if (score >= 80) return '高';
  if (score >= 65) return '中';
  return '低';
}

function topRelationMaps(rows: GscRow[]) {
  const topPageByQuery = new Map<string, { value: string; clicks: number }>();
  const topQueryByPage = new Map<string, { value: string; clicks: number }>();
  for (const row of rows) {
    const query = row.keys?.[0];
    const page = row.keys?.[1];
    if (!query || !page) continue;
    const queryCurrent = topPageByQuery.get(query);
    if (!queryCurrent || row.clicks > queryCurrent.clicks) topPageByQuery.set(query, { value: page, clicks: row.clicks });
    const pageCurrent = topQueryByPage.get(page);
    if (!pageCurrent || row.clicks > pageCurrent.clicks) topQueryByPage.set(page, { value: query, clicks: row.clicks });
  }
  return { topPageByQuery, topQueryByPage };
}

function buildPerformanceRows(
  kind: 'query' | 'page',
  currentRows: GscRow[],
  previousRows: GscRow[],
  expectedCtr: ExpectedCtr,
  relationMap: Map<string, { value: string; clicks: number }>,
  thresholds: AnalysisThresholds,
): PerformanceRow[] {
  const previous = new Map(previousRows.map((row) => [row.keys?.[0] ?? '', row]));
  const maxImpressions = Math.max(...currentRows.map((row) => row.impressions), 1);

  return currentRows.filter((row) => Boolean(row.keys?.[0])).map((row) => {
    const label = row.keys?.[0] ?? '';
    const old = previous.get(label);
    const clickDelta = pct(row.clicks, old?.clicks ?? 0);
    const impressionDelta = pct(row.impressions, old?.impressions ?? 0);
    const ctr = row.ctr * 100;
    const previousCtr = (old?.ctr ?? row.ctr) * 100;
    const ctrDelta = ctr - previousCtr;
    const positionDelta = row.position - (old?.position ?? row.position);
    const expected = expectedCtrFor(row.position, expectedCtr);
    const ctrGap = expected > 0 ? clamp((expected - ctr) / expected) : 0;
    const demandScore = clamp(Math.log10(row.impressions + 10) / Math.log10(maxImpressions + 10)) * 25;
    const rankScore = row.position <= 3 ? 7 : row.position <= 10 ? 19 : row.position <= thresholds.opportunityMaxPosition ? 30 : row.position <= 30 ? 16 : 5;
    const ctrScore = ctrGap * 25;
    const movementScore = clickDelta <= thresholds.declinePercent ? 20 : clickDelta >= thresholds.growthPercent ? 16 : 7;
    const riskBonus = positionDelta >= 1.5 ? 8 : 0;
    const score = Math.round(clamp((demandScore + rankScore + ctrScore + movementScore + riskBonus) / 100) * 100);
    const tags: string[] = [];
    if (clickDelta >= thresholds.growthPercent) tags.push('急上昇');
    if (clickDelta <= thresholds.declinePercent) tags.push('急落');
    if (row.position >= 10 && row.position <= thresholds.opportunityMaxPosition) tags.push('11〜20位');
    if (ctrGap >= 0.25 && row.position <= thresholds.opportunityMaxPosition) tags.push('CTR改善');
    if (row.impressions >= maxImpressions * 0.2) tags.push('高需要');
    if (positionDelta <= -1) tags.push('順位改善');
    if (positionDelta >= 1.5) tags.push('順位悪化');
    if (!tags.length) tags.push('安定');
    const related = relationMap.get(label)?.value;

    return {
      id: rowId(kind === 'query' ? 'q' : 'p', label),
      label,
      secondary: kind === 'query' ? related : related ? `主要クエリ: ${related}` : undefined,
      clicks: Math.round(row.clicks),
      impressions: Math.round(row.impressions),
      ctr: round(ctr, 2),
      position: round(row.position, 1),
      clickDelta: round(clickDelta, 1),
      impressionDelta: round(impressionDelta, 1),
      ctrDelta: round(ctrDelta, 2),
      positionDelta: round(positionDelta, 1),
      trend: clickDelta > 3 ? 'up' as const : clickDelta < -3 ? 'down' as const : 'flat' as const,
      priority: priorityFromScore(score),
      score,
      tags,
      spark: makeSpark(old?.clicks ?? row.clicks, row.clicks, label),
    };
  }).sort((a, b) => b.impressions - a.impressions);
}

function buildMetrics(current?: GscRow, previous?: GscRow): DashboardMetric[] {
  const clickDelta = pct(current?.clicks ?? 0, previous?.clicks ?? 0);
  const impressionDelta = pct(current?.impressions ?? 0, previous?.impressions ?? 0);
  const ctrDelta = ctrPercent(current) - ctrPercent(previous);
  const positionDelta = (current?.position ?? 0) - (previous?.position ?? 0);
  const improved = positionDelta <= 0;
  return [
    { label: '合計クリック数', value: format(current?.clicks ?? 0), change: `${clickDelta >= 0 ? '+' : ''}${round(clickDelta)}%`, direction: clickDelta >= 0 ? 'up' : 'down', note: '前期間比' },
    { label: '合計表示回数', value: format(current?.impressions ?? 0), change: `${impressionDelta >= 0 ? '+' : ''}${round(impressionDelta)}%`, direction: impressionDelta >= 0 ? 'up' : 'down', note: '前期間比' },
    { label: '平均CTR', value: `${round(ctrPercent(current), 2)}%`, change: `${ctrDelta >= 0 ? '+' : ''}${round(ctrDelta, 2)}pt`, direction: ctrDelta >= 0 ? 'up' : 'down', note: '前期間比' },
    { label: '平均掲載順位', value: round(current?.position ?? 0, 1).toFixed(1), change: improved ? `${Math.abs(round(positionDelta))}改善` : `${round(positionDelta)}悪化`, direction: improved ? 'up' : 'down', note: '前期間比' },
  ];
}

function buildDaily(rows: GscRow[]): DailyPoint[] {
  return rows.filter((row) => Boolean(row.keys?.[0])).map((row) => ({
    date: row.keys?.[0] ?? '', clicks: Math.round(row.clicks), impressions: Math.round(row.impressions), ctr: round(row.ctr * 100, 2), position: round(row.position, 1),
  }));
}

function buildSignals(rows: PerformanceRow[], expectedCtr: ExpectedCtr, thresholds: AnalysisThresholds) {
  const toSignal = (row: PerformanceRow, reason: string, action: string, metric: string): SignalRow => ({
    id: row.id, label: row.label, secondary: row.secondary ?? '-', primaryMetric: metric, delta: row.clickDelta, position: row.position, ctr: row.ctr, impressions: row.impressions, reason, action, severity: row.priority, spark: row.spark,
  });

  const eligible = rows.filter((row) => row.impressions >= thresholds.minImpressions);
  const growth = eligible.filter((row) => row.clickDelta >= thresholds.growthPercent).sort((a, b) => b.clickDelta - a.clickDelta).slice(0, 100).map((row) => toSignal(row, `クリック+${row.clickDelta.toFixed(1)}%、表示回数${row.impressionDelta >= 0 ? '+' : ''}${row.impressionDelta.toFixed(1)}%。成長トレンドを検出。`, row.position > 10 ? 'TOP10施策を追加' : '関連テーマを拡張', `+${row.clickDelta.toFixed(1)}% clicks`));
  const declines = eligible.filter((row) => row.clickDelta <= thresholds.declinePercent || row.positionDelta >= 1.5).sort((a, b) => a.clickDelta - b.clickDelta).slice(0, 100).map((row) => toSignal(row, `クリック${row.clickDelta.toFixed(1)}%、順位変化${row.positionDelta >= 0 ? '+' : ''}${row.positionDelta.toFixed(1)}。順位・CTR・需要の変化を確認。`, row.positionDelta >= 1.5 ? 'SERP差分を確認' : '需要とCTRを確認', `${row.clickDelta.toFixed(1)}% clicks`));
  const ctr = eligible.filter((row) => {
    const expected = expectedCtrFor(row.position, expectedCtr);
    return row.position <= thresholds.opportunityMaxPosition && row.ctr < expected * 0.75;
  }).sort((a, b) => b.impressions - a.impressions).slice(0, 100).map((row) => {
    const expected = expectedCtrFor(row.position, expectedCtr);
    return toSignal(row, `${positionBucket(row.position)}位帯の自サイトCTR基準 ${expected.toFixed(2)}% に対して ${row.ctr.toFixed(2)}%。`, 'title / description改善', `CTR ${row.ctr.toFixed(2)}%`);
  });
  return { growth, declines, ctr };
}

function impactFromImpressions(impressions: number, maxImpressions: number): Opportunity['impact'] {
  if (impressions >= maxImpressions * 0.2) return '大';
  if (impressions >= maxImpressions * 0.05) return '中';
  return '小';
}

function buildOpportunities(rows: PerformanceRow[], expectedCtr: ExpectedCtr, thresholds: AnalysisThresholds): Opportunity[] {
  const maxImpressions = Math.max(...rows.map((row) => row.impressions), 1);
  const candidates: Opportunity[] = [];
  const add = (row: PerformanceRow, type: Opportunity['type'], scoreAdjust: number, title: string, reason: string, action: string, effort: Opportunity['effort']) => {
    candidates.push({ id: `${row.id}-${type}`, type, target: row.label, title, reason, action, score: Math.min(100, Math.max(1, row.score + scoreAdjust)), impact: impactFromImpressions(row.impressions, maxImpressions), effort, impressions: row.impressions, position: row.position, delta: row.clickDelta });
  };

  for (const row of rows.filter((item) => item.impressions >= thresholds.minImpressions)) {
    const expected = expectedCtrFor(row.position, expectedCtr);
    if (row.position >= 8 && row.position <= thresholds.opportunityMaxPosition) add(row, '順位改善', 4, `${row.position.toFixed(1)}位からTOP10を狙う`, `表示回数${format(row.impressions)}。現在${row.position.toFixed(1)}位で、上位化した場合の増分余地が大きい候補です。`, '不足見出し・内部リンク・一次情報を追加', '中');
    if (row.position <= thresholds.opportunityMaxPosition && row.ctr < expected * 0.75) add(row, 'CTR改善', 6, '検索結果のCTRを改善', `自サイトの同順位帯CTR基準${expected.toFixed(2)}%に対して${row.ctr.toFixed(2)}%。`, 'title / descriptionをSERP競合と比較して改善', '低');
    if (row.clickDelta >= thresholds.growthPercent) add(row, '成長', 2, '伸びているテーマを拡張', `クリック+${row.clickDelta.toFixed(1)}%、表示回数${row.impressionDelta >= 0 ? '+' : ''}${row.impressionDelta.toFixed(1)}%。`, '関連クエリ・関連記事・内部リンクを追加', '低');
    if (row.clickDelta <= thresholds.declinePercent || row.positionDelta >= 1.5) add(row, '回復', 8, '下落を早期回復', `クリック${row.clickDelta.toFixed(1)}%、順位変化${row.positionDelta >= 0 ? '+' : ''}${row.positionDelta.toFixed(1)}。`, 'SERP変化・競合・内容鮮度を確認してリライト', '中');
    if (row.label.startsWith('http') && row.position >= 10 && row.position <= thresholds.opportunityMaxPosition) add(row, '内部リンク', 1, '内部リンクで評価を集める', `${row.position.toFixed(1)}位・表示回数${format(row.impressions)}。リンク追加だけで改善できる可能性があります。`, '関連上位ページから文脈リンクを追加', '低');
  }
  return candidates.sort((a, b) => b.score - a.score || b.impressions - a.impressions).slice(0, 120);
}

function buildCannibalization(rows: GscRow[], thresholds: AnalysisThresholds): CannibalizationGroup[] {
  const grouped = new Map<string, GscRow[]>();
  for (const row of rows) {
    const query = row.keys?.[0]; const page = row.keys?.[1];
    if (!query || !page) continue;
    const list = grouped.get(query) ?? []; list.push(row); grouped.set(query, list);
  }
  const result: CannibalizationGroup[] = [];
  for (const [query, groupRows] of grouped) {
    if (groupRows.length < 2) continue;
    const sorted = [...groupRows].sort((a, b) => b.clicks - a.clicks || b.impressions - a.impressions);
    const totalClicks = sorted.reduce((sum, row) => sum + row.clicks, 0);
    const totalImpressions = sorted.reduce((sum, row) => sum + row.impressions, 0);
    if (totalImpressions < thresholds.minImpressions) continue;
    const pages = sorted.slice(0, 5).map((row) => ({ url: row.keys?.[1] ?? '', clicks: Math.round(row.clicks), position: round(row.position, 1), share: Math.round((totalClicks > 0 ? row.clicks / totalClicks : row.impressions / totalImpressions) * 100) }));
    const topShare = pages[0]?.share ?? 100;
    const overlap = Math.round(clamp(((100 - topShare) * 1.35 + Math.max(0, pages.length - 2) * 8) / 100) * 100);
    if (overlap < 20) continue;
    const priority: Priority = overlap >= 55 && totalImpressions >= thresholds.minImpressions * 2 ? '高' : overlap >= 35 ? '中' : '低';
    const recommendation = topShare < 55 ? '複数URLの検索意図が近い可能性があります。統合または役割分担を明確化してください。' : '主URLは明確です。補助URLのtitle/H1と内部リンクで検索意図を分離してください。';
    result.push({ id: rowId('k', query), query, overlap, clicks: Math.round(totalClicks), impressions: Math.round(totalImpressions), priority, pages, recommendation });
  }
  return result.sort((a, b) => b.overlap - a.overlap || b.impressions - a.impressions).slice(0, 100);
}

function buildDeviceDistribution(rows: GscRow[]): DeviceDistributionItem[] {
  const totalClicks = rows.reduce((sum, row) => sum + row.clicks, 0);
  const labels: Record<string, string> = { MOBILE: 'モバイル', DESKTOP: 'デスクトップ', TABLET: 'タブレット' };
  return rows.filter((row) => Boolean(row.keys?.[0])).map((row) => ({ label: labels[row.keys?.[0] ?? ''] ?? row.keys?.[0] ?? 'その他', clicks: Math.round(row.clicks), value: totalClicks > 0 ? round((row.clicks / totalClicks) * 100, 1) : 0 })).sort((a, b) => b.value - a.value);
}

function buildRankDistribution(rows: PerformanceRow[]): RankDistributionItem[] {
  const buckets = [
    { label: '1〜3位', count: rows.filter((row) => row.position <= 3).length },
    { label: '4〜10位', count: rows.filter((row) => row.position > 3 && row.position <= 10).length },
    { label: '11〜20位', count: rows.filter((row) => row.position > 10 && row.position <= 20).length },
    { label: '21位以下', count: rows.filter((row) => row.position > 20).length },
  ];
  const total = Math.max(rows.length, 1);
  return buckets.map((item) => ({ ...item, value: Math.round((item.count / total) * 100) }));
}

function buildDailyTasks(opportunities: Opportunity[]): DailyTask[] {
  return opportunities.slice(0, 4).map((item) => ({ id: item.id, priority: item.score, title: item.title, detail: `${item.position.toFixed(1)}位 / ${format(item.impressions)} imp. / ${item.delta >= 0 ? '+' : ''}${item.delta.toFixed(1)}% clicks`, action: item.type === 'CTR改善' ? 'スニペット改善' : item.type === '回復' ? '原因を確認' : item.type === '内部リンク' ? 'リンク追加' : '詳しく見る' }));
}

function buildInsights(growth: SignalRow[], declines: SignalRow[], opportunities: Opportunity[]): DashboardInsight[] {
  const rankCount = opportunities.filter((item) => item.type === '順位改善').length;
  return [
    { title: '急上昇シグナル', value: `${growth.length}件`, meta: growth[0] ? `最大 +${growth[0].delta.toFixed(1)}%` : '大きな変化なし', action: '伸びているテーマを拡張', tone: 'success' },
    { title: '急落シグナル', value: `${declines.length}件`, meta: declines[0] ? `最大 ${declines[0].delta.toFixed(1)}%` : '大きな変化なし', action: '上位から原因を確認', tone: declines.length ? 'danger' : 'warning' },
    { title: 'TOP10候補', value: `${rankCount}件`, meta: '順位と表示回数から抽出', action: '内部リンク・内容追加', tone: 'warning' },
  ];
}

export function runAnalysisEngine(input: AnalysisEngineInput): GscAnalysisBundle {
  const expectedCtr = buildExpectedCtr(input.currentQueries);
  const relations = topRelationMaps(input.queryPages);
  const allQueries = buildPerformanceRows('query', input.currentQueries, input.previousQueries, expectedCtr, relations.topPageByQuery, input.thresholds);
  const allPages = buildPerformanceRows('page', input.currentPages, input.previousPages, expectedCtr, relations.topQueryByPage, input.thresholds);
  const signalSource = [...allQueries, ...allPages];
  const signals = buildSignals(signalSource, expectedCtr, input.thresholds);
  const opportunities = buildOpportunities(signalSource, expectedCtr, input.thresholds);
  const cannibalization = buildCannibalization(input.queryPages, input.thresholds);

  return {
    source: 'gsc',
    siteUrl: input.siteUrl,
    searchType: input.searchType,
    generatedAt: new Date().toISOString(),
    range: input.range,
    partialDataFrom: input.partialDataFrom,
    thresholds: input.thresholds,
    metrics: buildMetrics(input.currentTotal, input.previousTotal),
    daily: buildDaily(input.daily),
    queries: allQueries.slice(0, 1500),
    pages: allPages.slice(0, 1000),
    opportunities,
    growth: signals.growth,
    declines: signals.declines,
    ctr: signals.ctr,
    cannibalization,
    devices: buildDeviceDistribution(input.devices),
    ranks: buildRankDistribution(allQueries),
    dailyTasks: buildDailyTasks(opportunities),
    insights: buildInsights(signals.growth, signals.declines, opportunities),
    diagnostics: {
      fetchedQueryRows: input.currentQueries.length,
      fetchedPageRows: input.currentPages.length,
      fetchedQueryPageRows: input.queryPages.length,
      cache: 'miss',
    },
  };
}
