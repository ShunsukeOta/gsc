import type { PerformanceRow } from '@/lib/application-data';
import type {
  AnalysisThresholds,
  DataQualitySummary,
  GscAnalysisBundle,
  ProductionAnomaly,
  ProductionAnomalyKind,
  UrlNormalizationSummary,
} from './types';

const clamp = (value: number, min = 0, max = 100) => Math.min(max, Math.max(min, value));

function confidenceFromImpressions(impressions: number) {
  if (impressions <= 0) return 0;
  return Math.round(clamp(35 + Math.log10(impressions + 1) * 14));
}

function anomalyId(scope: 'query' | 'page' | 'site', kind: ProductionAnomalyKind, label: string) {
  let hash = 0;
  const source = `${scope}:${kind}:${label}`;
  for (let index = 0; index < source.length; index += 1) hash = ((hash << 5) - hash + source.charCodeAt(index)) | 0;
  return `a-${Math.abs(hash).toString(36)}`;
}

function classifyRow(
  row: PerformanceRow,
  scope: 'query' | 'page',
  thresholds: AnalysisThresholds,
): ProductionAnomaly | null {
  if (row.impressions < thresholds.minImpressions) return null;

  const confidence = confidenceFromImpressions(row.impressions);
  const severeDecline = Math.min(thresholds.declinePercent * 1.8, -25);
  const strongGrowth = Math.max(thresholds.growthPercent * 1.8, 30);

  let kind: ProductionAnomalyKind | null = null;
  let title = '';
  let summary = '';
  let action = '';
  const evidence: string[] = [];
  let rawScore = 0;

  if (row.positionDelta >= 2 && row.clickDelta <= thresholds.declinePercent) {
    kind = 'rank-loss';
    title = '順位低下が流入減の主因候補';
    summary = `平均順位が${row.positionDelta.toFixed(1)}悪化し、クリックは${row.clickDelta.toFixed(1)}%変化しています。`;
    action = 'SERP上位との差分、内容鮮度、内部リンク、競合更新を確認';
    evidence.push(`順位 ${row.positionDelta >= 0 ? '+' : ''}${row.positionDelta.toFixed(1)}`);
    evidence.push(`クリック ${row.clickDelta.toFixed(1)}%`);
    rawScore = 72 + Math.min(18, row.positionDelta * 4) + Math.min(10, Math.abs(row.clickDelta) / 5);
  } else if (row.ctrDelta <= -0.45 && Math.abs(row.positionDelta) < 1.5 && row.clickDelta <= thresholds.declinePercent) {
    kind = 'ctr-loss';
    title = '順位は維持しているのにCTRが低下';
    summary = `順位変化は${row.positionDelta.toFixed(1)}に留まる一方、CTRが${row.ctrDelta.toFixed(2)}pt低下しています。`;
    action = 'title / description / SERP機能 / 競合スニペットを比較';
    evidence.push(`CTR ${row.ctrDelta.toFixed(2)}pt`);
    evidence.push(`順位変化 ${row.positionDelta.toFixed(1)}`);
    rawScore = 70 + Math.min(20, Math.abs(row.ctrDelta) * 18);
  } else if (row.impressionDelta <= -25 && Math.abs(row.positionDelta) < 1.5) {
    kind = 'demand-loss';
    title = '検索需要または露出量の低下';
    summary = `順位は大きく変わっていませんが、表示回数が${row.impressionDelta.toFixed(1)}%減少しています。`;
    action = '季節性・トレンド・検索意図変化・関連クエリの需要を確認';
    evidence.push(`表示回数 ${row.impressionDelta.toFixed(1)}%`);
    evidence.push(`順位変化 ${row.positionDelta.toFixed(1)}`);
    rawScore = 65 + Math.min(25, Math.abs(row.impressionDelta) / 2);
  } else if (row.clickDelta <= severeDecline) {
    kind = 'traffic-drop';
    title = '大幅なクリック減少を検出';
    summary = `前期間比でクリックが${row.clickDelta.toFixed(1)}%減少しています。原因を早めに切り分ける価値があります。`;
    action = '順位・CTR・表示回数の3要因を順番に確認';
    evidence.push(`クリック ${row.clickDelta.toFixed(1)}%`);
    evidence.push(`表示回数 ${row.impressionDelta.toFixed(1)}%`);
    rawScore = 75 + Math.min(20, Math.abs(row.clickDelta) / 4);
  } else if (row.clickDelta >= strongGrowth && row.impressionDelta >= 10) {
    kind = 'growth-breakout';
    title = '成長ブレイクアウトを検出';
    summary = `クリック+${row.clickDelta.toFixed(1)}%、表示回数${row.impressionDelta >= 0 ? '+' : ''}${row.impressionDelta.toFixed(1)}%で伸びています。`;
    action = '関連クエリ・関連記事・内部リンクを追加して成長を拡張';
    evidence.push(`クリック +${row.clickDelta.toFixed(1)}%`);
    evidence.push(`表示回数 +${row.impressionDelta.toFixed(1)}%`);
    rawScore = 60 + Math.min(25, row.clickDelta / 3);
  }

  if (!kind) return null;
  const score = Math.round(clamp(rawScore * (0.72 + confidence / 360)));
  const severity: ProductionAnomaly['severity'] = score >= 86 ? 'critical' : score >= 70 ? 'warning' : 'info';

  return {
    id: anomalyId(scope, kind, row.label),
    kind,
    scope,
    severity,
    label: row.label,
    title,
    summary,
    action,
    score,
    confidence,
    impressions: row.impressions,
    clickDelta: row.clickDelta,
    positionDelta: row.positionDelta,
    ctrDelta: row.ctrDelta,
    evidence,
  };
}

function median(values: number[]) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function buildDailyDrop(bundle: GscAnalysisBundle): ProductionAnomaly | null {
  const stableDaily = bundle.daily.filter((point) => !bundle.partialDataFrom || point.date < bundle.partialDataFrom);
  if (stableDaily.length < 8) return null;
  const latest = stableDaily.at(-1);
  if (!latest) return null;
  const baselinePoints = stableDaily.slice(-8, -1).map((point) => point.clicks);
  const baseline = median(baselinePoints);
  if (baseline < 10) return null;
  const delta = ((latest.clicks - baseline) / baseline) * 100;
  if (delta > -35) return null;

  const confidence = Math.round(clamp(55 + Math.log10(baseline + 1) * 13));
  return {
    id: anomalyId('site', 'daily-drop', latest.date),
    kind: 'daily-drop',
    scope: 'site',
    severity: delta <= -55 ? 'critical' : 'warning',
    label: latest.date,
    title: '直近日のクリック数が通常レンジを下回っています',
    summary: `確定済み直近7日中央値${Math.round(baseline)}クリックに対し、${latest.date}は${latest.clicks}クリックです。`,
    action: 'サイト全体の障害・インデックス・順位変動・計測遅延を確認',
    score: Math.round(clamp(72 + Math.abs(delta) / 3)),
    confidence,
    impressions: latest.impressions,
    clickDelta: Number(delta.toFixed(1)),
    evidence: [`直近7日中央値 ${Math.round(baseline)}`, `当日 ${latest.clicks}`, `差 ${delta.toFixed(1)}%`],
  };
}

export function buildProductionAnomalies(bundle: GscAnalysisBundle): ProductionAnomaly[] {
  const rows = [
    ...bundle.pages.map((row) => classifyRow(row, 'page', bundle.thresholds)),
    ...bundle.queries.map((row) => classifyRow(row, 'query', bundle.thresholds)),
  ].filter((item): item is ProductionAnomaly => Boolean(item));

  const daily = buildDailyDrop(bundle);
  if (daily) rows.push(daily);

  return rows
    .sort((a, b) => b.score - a.score || b.impressions - a.impressions)
    .slice(0, 150);
}

export function buildDataQualitySummary(input: {
  bundle: GscAnalysisBundle;
  queryRowsTruncated: boolean;
  pageRowsTruncated: boolean;
  queryPageRowsTruncated: boolean;
  normalization?: UrlNormalizationSummary;
}): DataQualitySummary {
  const notes: string[] = [];
  let score = 100;

  if (input.bundle.partialDataFrom) {
    score -= 15;
    notes.push(`${input.bundle.partialDataFrom} 以降はGoogle側で未確定のため、異常検知では確定済み日を優先します。`);
  }
  if (input.queryRowsTruncated) {
    score -= 12;
    notes.push('クエリ取得件数が設定上限に到達しています。ロングテールの一部が分析対象外の可能性があります。');
  }
  if (input.pageRowsTruncated) {
    score -= 12;
    notes.push('ページ取得件数が設定上限に到達しています。GSC_MAX_ROWSの見直しを検討してください。');
  }
  if (input.queryPageRowsTruncated) {
    score -= 16;
    notes.push('query×page取得件数が上限に到達しているため、カニバリ・関連ページ分析は保守的に解釈してください。');
  }
  if (input.normalization?.affectedGroups) {
    notes.push(`${input.normalization.affectedGroups}件のURLグループでフラグメントを除外し、同一ページとして集約しました。`);
  }
  notes.push('Search Analytics APIはGoogle側の上位行制限を受けるため、取得件数未満でも完全な全行データを保証するものではありません。');

  score = Math.round(clamp(score));
  const level: DataQualitySummary['level'] = score >= 90 ? 'excellent' : score >= 72 ? 'good' : 'caution';
  return {
    score,
    level,
    notes,
    partialData: Boolean(input.bundle.partialDataFrom),
    queryRowsTruncated: input.queryRowsTruncated,
    pageRowsTruncated: input.pageRowsTruncated,
    queryPageRowsTruncated: input.queryPageRowsTruncated,
    normalizedUrlGroups: input.normalization?.affectedGroups ?? 0,
  };
}
