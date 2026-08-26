import type { Priority } from '@/lib/analysis-types';
import type { GscRow, QueryMovementKind, QueryMovementPeriodMetrics, QueryMovementRow, QueryMovementSummary } from './types';

type MovementOptions = {
  currentRowsTruncated: boolean;
  previousRowsTruncated: boolean;
  partialData: boolean;
};

const ROW_CAP_PER_TYPE = 250;
const clamp = (value: number, min = 0, max = 100) => Math.min(max, Math.max(min, value));
const round = (value: number, digits = 1) => Number(value.toFixed(digits));
const pct = (current: number, previous: number) => previous > 0 ? ((current - previous) / previous) * 100 : current > 0 ? 100 : 0;

function hashString(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

function metrics(row?: GscRow): QueryMovementPeriodMetrics | null {
  if (!row) return null;
  return {
    clicks: Math.round(row.clicks),
    impressions: Math.round(row.impressions),
    ctr: round(row.ctr * 100, 2),
    position: round(row.position, 1),
  };
}

function movementAction(kind: QueryMovementKind) {
  switch (kind) {
    case 'new': return '流入先と検索意図を確認し、伸ばす価値があれば関連情報を補強';
    case 'lost': return '対象ページ・順位・インデックス状況を確認し、消失要因を切り分け';
    case 'top10-entry': return 'TOP10定着を狙い、関連見出し・内部リンク・一次情報を補強';
    case 'top10-exit': return '順位低下要因を確認し、重要クエリなら回復施策を優先';
  }
}

function priority(score: number): Priority {
  if (score >= 75) return '高';
  if (score >= 50) return '中';
  return '低';
}

function scoreMovement(kind: QueryMovementKind, current?: GscRow, previous?: GscRow) {
  const impressions = Math.max(current?.impressions ?? 0, previous?.impressions ?? 0);
  const clicks = Math.max(current?.clicks ?? 0, previous?.clicks ?? 0);
  const volumeScore = clamp(Math.log10(impressions + 1) / 5 * 50, 0, 50);
  const clickScore = clamp(Math.log10(clicks + 1) / 3 * 20, 0, 20);
  const kindBonus = kind === 'top10-exit' ? 30 : kind === 'lost' ? 26 : kind === 'top10-entry' ? 22 : 16;
  return Math.round(clamp(volumeScore + clickScore + kindBonus));
}

function confidenceFor(kind: QueryMovementKind, options: MovementOptions): QueryMovementRow['confidence'] {
  if (options.partialData) return 'caution';
  if (kind === 'new' && options.previousRowsTruncated) return 'caution';
  if (kind === 'lost' && options.currentRowsTruncated) return 'caution';
  return 'high';
}

function makeRow(kind: QueryMovementKind, query: string, current: GscRow | undefined, previous: GscRow | undefined, options: MovementOptions): QueryMovementRow {
  const currentMetrics = metrics(current);
  const previousMetrics = metrics(previous);
  const score = scoreMovement(kind, current, previous);
  const positionDelta = current && previous ? round(current.position - previous.position, 1) : null;
  return {
    id: `qm-${kind}-${hashString(query)}`,
    kind,
    query,
    current: currentMetrics,
    previous: previousMetrics,
    clickDelta: current && previous ? round(pct(current.clicks, previous.clicks), 1) : null,
    impressionDelta: current && previous ? round(pct(current.impressions, previous.impressions), 1) : null,
    positionDelta,
    impactImpressions: Math.round(Math.max(current?.impressions ?? 0, previous?.impressions ?? 0)),
    score,
    priority: priority(score),
    confidence: confidenceFor(kind, options),
    action: movementAction(kind),
  };
}

function queryMap(rows: GscRow[]) {
  const map = new Map<string, GscRow>();
  for (const row of rows) {
    const query = row.keys?.[0]?.trim();
    if (query) map.set(query, row);
  }
  return map;
}

export function buildQueryMovementSummary(currentRows: GscRow[], previousRows: GscRow[], options: MovementOptions): QueryMovementSummary {
  const current = queryMap(currentRows);
  const previous = queryMap(previousRows);
  const groups: Record<QueryMovementKind, QueryMovementRow[]> = {
    new: [],
    lost: [],
    'top10-entry': [],
    'top10-exit': [],
  };

  for (const [query, row] of current) {
    const old = previous.get(query);
    if (!old) {
      groups.new.push(makeRow('new', query, row, undefined, options));
      continue;
    }
    if (old.position > 10 && row.position <= 10) groups['top10-entry'].push(makeRow('top10-entry', query, row, old, options));
    if (old.position <= 10 && row.position > 10) groups['top10-exit'].push(makeRow('top10-exit', query, row, old, options));
  }

  for (const [query, old] of previous) {
    if (!current.has(query)) groups.lost.push(makeRow('lost', query, undefined, old, options));
  }

  const counts = {
    new: groups.new.length,
    lost: groups.lost.length,
    top10Entries: groups['top10-entry'].length,
    top10Exits: groups['top10-exit'].length,
  };
  const capped = Object.values(groups).some((rows) => rows.length > ROW_CAP_PER_TYPE);
  const rows = (Object.values(groups) as QueryMovementRow[][])
    .flatMap((items) => items.sort((a, b) => b.score - a.score).slice(0, ROW_CAP_PER_TYPE))
    .sort((a, b) => b.score - a.score || b.impactImpressions - a.impactImpressions);
  const caution = options.currentRowsTruncated || options.previousRowsTruncated || options.partialData;

  return {
    rows,
    counts,
    rowCapPerType: ROW_CAP_PER_TYPE,
    capped,
    reliability: {
      level: caution ? 'caution' : 'high',
      currentRowsTruncated: options.currentRowsTruncated,
      previousRowsTruncated: options.previousRowsTruncated,
      partialData: options.partialData,
      note: caution
        ? '取得上限または未確定データの影響があるため、特にNew / Lostは参考値として扱ってください。'
        : 'New / Lostは比較期間のSearch Console API返却行同士の差分です。サイト史上初・完全消失を意味するものではありません。',
    },
  };
}
