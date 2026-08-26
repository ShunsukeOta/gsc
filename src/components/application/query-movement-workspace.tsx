'use client';

import Link from 'next/link';
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Copy,
  Download,
  Search,
  ShieldAlert,
  Trophy,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Badge, Button, Card, CardHeader, EmptyState } from '@/components/ui';
import type { QueryMovementKind, QueryMovementRow } from '@/lib/gsc/types';
import { DataSourceStatus, searchTypeLabel } from './live-workspaces';
import { useGscWorkspace } from './gsc-context';

const PAGE_SIZE = 50;

type KindFilter = 'all' | QueryMovementKind;
type SortMode = 'score' | 'impressions' | 'clicks';

const KIND_META: Record<QueryMovementKind, { label: string; short: string; className: string }> = {
  new: { label: 'New Query', short: '新規', className: 'is-new' },
  lost: { label: 'Lost Query', short: '消失', className: 'is-lost' },
  'top10-entry': { label: 'TOP10入り', short: 'TOP10入り', className: 'is-entry' },
  'top10-exit': { label: 'TOP10脱落', short: 'TOP10脱落', className: 'is-exit' },
};

const priorityTone = (priority: QueryMovementRow['priority']) => priority === '高' ? 'danger' as const : priority === '中' ? 'warning' as const : 'neutral' as const;
const formatNumber = (value?: number | null) => typeof value === 'number' ? value.toLocaleString() : '-';
const formatCtr = (value?: number | null) => typeof value === 'number' ? `${value.toFixed(2)}%` : '-';
const formatPosition = (value?: number | null) => typeof value === 'number' ? value.toFixed(1) : '-';

function positionChange(value: number | null) {
  if (value === null) return '-';
  if (value < 0) return `${Math.abs(value).toFixed(1)}改善`;
  if (value > 0) return `${value.toFixed(1)}悪化`;
  return '±0.0';
}

function csvCell(value: string | number | null | undefined) {
  const text = value === null || value === undefined ? '' : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

function downloadRows(rows: QueryMovementRow[], site: string, searchType: string) {
  const header = [
    'type', 'query', 'priority', 'score', 'confidence',
    'current_clicks', 'current_impressions', 'current_ctr_percent', 'current_position',
    'previous_clicks', 'previous_impressions', 'previous_ctr_percent', 'previous_position',
    'click_delta_percent', 'impression_delta_percent', 'position_delta', 'recommended_action',
  ];
  const lines = rows.map((row) => [
    row.kind, row.query, row.priority, row.score, row.confidence,
    row.current?.clicks, row.current?.impressions, row.current?.ctr, row.current?.position,
    row.previous?.clicks, row.previous?.impressions, row.previous?.ctr, row.previous?.position,
    row.clickDelta, row.impressionDelta, row.positionDelta, row.action,
  ].map(csvCell).join(','));
  const blob = new Blob([`\uFEFF${header.join(',')}\n${lines.join('\n')}`], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `query-movements-${searchType}-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
  void site;
}

function SummaryCard({ label, value, detail, tone, active, onClick }: { label: string; value: number; detail: string; tone: string; active: boolean; onClick: () => void }) {
  return (
    <button type="button" className={`p6-summary-card ${tone}${active ? ' is-active' : ''}`} onClick={onClick}>
      <span>{label}</span>
      <strong>{value.toLocaleString()}</strong>
      <small>{detail}</small>
    </button>
  );
}

export function QueryMovementWorkspace() {
  const workspace = useGscWorkspace();
  const analysis = workspace.analysis;
  const summary = analysis?.queryMovements;
  const [kind, setKind] = useState<KindFilter>('all');
  const [keyword, setKeyword] = useState('');
  const [minImpressions, setMinImpressions] = useState(10);
  const [sort, setSort] = useState<SortMode>('score');
  const [page, setPage] = useState(1);
  const [copiedId, setCopiedId] = useState('');

  const filtered = useMemo(() => {
    if (!summary) return [];
    const q = keyword.trim().toLowerCase();
    return summary.rows
      .filter((row) => kind === 'all' || row.kind === kind)
      .filter((row) => row.impactImpressions >= Math.max(0, minImpressions || 0))
      .filter((row) => !q || row.query.toLowerCase().includes(q))
      .sort((a, b) => {
        if (sort === 'impressions') return b.impactImpressions - a.impactImpressions || b.score - a.score;
        if (sort === 'clicks') return Math.max(b.current?.clicks ?? 0, b.previous?.clicks ?? 0) - Math.max(a.current?.clicks ?? 0, a.previous?.clicks ?? 0) || b.score - a.score;
        return b.score - a.score || b.impactImpressions - a.impactImpressions;
      });
  }, [kind, keyword, minImpressions, sort, summary]);

  useEffect(() => setPage(1), [kind, keyword, minImpressions, sort, workspace.searchType, workspace.selectedSite]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const visible = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const copy = async (row: QueryMovementRow) => {
    await navigator.clipboard.writeText(row.query);
    setCopiedId(row.id);
    window.setTimeout(() => setCopiedId(''), 1400);
  };

  return (
    <>
      <DataSourceStatus />
      {!analysis || !summary ? (
        <EmptyState title="クエリ変動 0件" text={workspace.analysisLoading ? '現期間と前期間のクエリを比較しています。' : 'GSCデータ取得後にNew / Lost・TOP10出入りを表示します。'} />
      ) : (
        <div className="p6-movement-workspace">
          <div className="p6-summary-grid">
            <SummaryCard label="New Queries" value={summary.counts.new} detail="前期間なし → 現期間あり" tone="is-new" active={kind === 'new'} onClick={() => setKind(kind === 'new' ? 'all' : 'new')} />
            <SummaryCard label="Lost Queries" value={summary.counts.lost} detail="前期間あり → 現期間なし" tone="is-lost" active={kind === 'lost'} onClick={() => setKind(kind === 'lost' ? 'all' : 'lost')} />
            <SummaryCard label="TOP10入り" value={summary.counts.top10Entries} detail="平均順位 >10 → ≤10" tone="is-entry" active={kind === 'top10-entry'} onClick={() => setKind(kind === 'top10-entry' ? 'all' : 'top10-entry')} />
            <SummaryCard label="TOP10脱落" value={summary.counts.top10Exits} detail="平均順位 ≤10 → >10" tone="is-exit" active={kind === 'top10-exit'} onClick={() => setKind(kind === 'top10-exit' ? 'all' : 'top10-exit')} />
          </div>

          <div className={`p6-reliability ${summary.reliability.level === 'caution' ? 'is-caution' : 'is-info'}`}>
            <ShieldAlert />
            <span>
              <strong>{summary.reliability.level === 'caution' ? 'New / Lostの判定に注意が必要です' : '比較期間ベースのクエリ変動です'}</strong>
              <small>{summary.reliability.note}{summary.capped ? ` 各タイプ上位${summary.rowCapPerType}件まで一覧表示しています。` : ''}</small>
            </span>
          </div>

          <Card padded={false} className="p6-movement-card">
            <div className="p6-toolbar">
              <div>
                <strong>クエリ変動一覧</strong>
                <span>{analysis.range.previousStartDate}〜{analysis.range.previousEndDate} → {analysis.range.startDate}〜{analysis.range.endDate} / {searchTypeLabel(analysis.searchType)}</span>
              </div>
              <div className="p6-toolbar__actions">
                <label className="p6-search"><Search /><input value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="クエリを検索" /></label>
                <label className="p6-mini-field"><span>最低表示回数</span><input type="number" min={0} value={minImpressions} onChange={(event) => setMinImpressions(Math.max(0, Number(event.target.value) || 0))} /></label>
                <label className="p6-mini-field"><span>並び順</span><select value={sort} onChange={(event) => setSort(event.target.value as SortMode)}><option value="score">重要度</option><option value="impressions">表示回数</option><option value="clicks">クリック数</option></select></label>
                <Button size="sm" variant="secondary" icon={<Download />} disabled={!filtered.length} onClick={() => downloadRows(filtered, analysis.siteUrl, analysis.searchType)}>CSV</Button>
              </div>
            </div>

            <div className="p6-filter-tabs" role="tablist" aria-label="クエリ変動フィルター">
              {([
                ['all', 'すべて'],
                ['new', 'New'],
                ['lost', 'Lost'],
                ['top10-entry', 'TOP10入り'],
                ['top10-exit', 'TOP10脱落'],
              ] as const).map(([value, label]) => <button key={value} type="button" className={kind === value ? 'is-active' : ''} onClick={() => setKind(value)}>{label}</button>)}
              <span>{filtered.length.toLocaleString()}件</span>
            </div>

            {!visible.length ? <EmptyState title="該当する変動はありません" text="フィルターまたは最低表示回数を変更してください。" /> : (
              <div className="p6-table-wrap">
                <table className="p6-table">
                  <thead><tr><th>変動</th><th>クエリ</th><th>現期間</th><th>前期間</th><th>順位変化</th><th>重要度</th><th>推奨アクション</th><th /></tr></thead>
                  <tbody>
                    {visible.map((row) => {
                      const meta = KIND_META[row.kind];
                      const currentQuery = analysis.queries.find((item) => item.label === row.query);
                      const relatedPage = analysis.relations?.queryToPages[row.query]?.[0]?.label;
                      return (
                        <tr key={row.id}>
                          <td><span className={`p6-kind ${meta.className}`}>{row.kind === 'top10-entry' ? <ArrowUpRight /> : row.kind === 'top10-exit' ? <ArrowDownRight /> : row.kind === 'new' ? <ArrowRight /> : <ArrowDownRight />}{meta.short}</span></td>
                          <td className="p6-query-cell"><strong>{row.query}</strong>{relatedPage && <small>{relatedPage}</small>}<button type="button" onClick={() => void copy(row)}><Copy />{copiedId === row.id ? 'コピー済み' : 'コピー'}</button></td>
                          <td className="p6-period-cell"><strong>{formatNumber(row.current?.clicks)} click</strong><span>{formatNumber(row.current?.impressions)} imp</span><span>CTR {formatCtr(row.current?.ctr)} / {formatPosition(row.current?.position)}位</span></td>
                          <td className="p6-period-cell"><strong>{formatNumber(row.previous?.clicks)} click</strong><span>{formatNumber(row.previous?.impressions)} imp</span><span>CTR {formatCtr(row.previous?.ctr)} / {formatPosition(row.previous?.position)}位</span></td>
                          <td><span className={`p6-position-change ${row.positionDelta !== null && row.positionDelta < 0 ? 'is-up' : row.positionDelta !== null && row.positionDelta > 0 ? 'is-down' : ''}`}>{positionChange(row.positionDelta)}</span></td>
                          <td><div className="p6-score"><Badge tone={priorityTone(row.priority)}>{row.priority}</Badge><strong>{row.score}</strong>{row.confidence === 'caution' && <small>参考</small>}</div></td>
                          <td className="p6-action-cell">{row.action}</td>
                          <td>{currentQuery ? <Link className="ui-button ui-button--ghost ui-button--sm" href={`/queries/${currentQuery.id}`}>詳細<ArrowRight /></Link> : <span className="p6-no-current">現在データなし</span>}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <div className="p6-pagination">
              <span>{filtered.length ? `${(safePage - 1) * PAGE_SIZE + 1}〜${Math.min(safePage * PAGE_SIZE, filtered.length)} / ${filtered.length.toLocaleString()}件` : '0件'}</span>
              <div><button type="button" disabled={safePage <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>前へ</button><strong>{safePage} / {totalPages}</strong><button type="button" disabled={safePage >= totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))}>次へ</button></div>
            </div>
          </Card>

          <Card className="p6-definition-card">
            <CardHeader title="判定仕様" description="New / Lostを過大解釈しないための定義" action={<Trophy />} />
            <div className="p6-definitions"><div><strong>New Query</strong><span>前期間のAPI返却行に存在せず、現期間の返却行に存在するクエリ。</span></div><div><strong>Lost Query</strong><span>前期間のAPI返却行に存在し、現期間の返却行に存在しないクエリ。</span></div><div><strong>TOP10出入り</strong><span>両期間に存在するクエリの平均掲載順位が10.0位の境界を跨いだ場合に検出。</span></div><div><strong>注意</strong><span>Search Consoleは匿名化・行上限があるため、Newは「サイト史上初」、Lostは「完全に検索から消えた」という意味ではありません。</span></div></div>
          </Card>
        </div>
      )}
    </>
  );
}
