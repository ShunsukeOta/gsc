'use client';

import Link from 'next/link';
import { ArrowDownRight, ArrowLeft, ArrowUpRight, Download, ExternalLink, Search, Sparkles, Target } from 'lucide-react';
import { useState } from 'react';
import { MetricGrid } from '@/components/analytics';
import { Sparkline, MicroBars } from '@/components/application/visuals';
import { Badge, Button, Card, CardHeader, EmptyState, PageHead } from '@/components/ui';
import type { Priority, SignalRow } from '@/lib/analysis-types';
import type { PerformanceRow } from '@/lib/analysis-types';
import { DataSourceStatus, LiveWorkspaceToolbar, searchTypeLabel } from './live-workspaces';
import { SignalActionDrawer } from './action-center';
import { useGscWorkspace } from './gsc-context';

const priorityTone = (value: Priority) => value === '高' ? 'danger' as const : value === '中' ? 'warning' as const : 'neutral' as const;
const number = (value: number) => new Intl.NumberFormat('ja-JP').format(value);
const EMPTY_DETAIL_METRICS = [
  { label: 'クリック', value: '0', change: '-', direction: 'up' as const, note: '取得待ち' },
  { label: '表示回数', value: '0', change: '-', direction: 'up' as const, note: '取得待ち' },
  { label: 'CTR', value: '-', change: '-', direction: 'up' as const, note: '取得待ち' },
  { label: '平均順位', value: '-', change: '-', direction: 'up' as const, note: '取得待ち' },
];

function downloadPerformanceRow(row: PerformanceRow, kind: 'query' | 'page', searchType: string, endDate: string) {
  const values = {
    type: kind,
    search_type: searchType,
    target: row.label,
    secondary: row.secondary ?? '',
    clicks: row.clicks,
    impressions: row.impressions,
    ctr_percent: row.ctr,
    position: row.position,
    clicks_delta_percent: row.clickDelta,
    impressions_delta_percent: row.impressionDelta,
    ctr_delta_pt: row.ctrDelta,
    position_delta: row.positionDelta,
    opportunity_score: row.score,
    priority: row.priority,
    tags: row.tags.join('|'),
  };
  const headers = Object.keys(values);
  const escape = (value: unknown) => `"${String(value ?? '').replaceAll('"', '""')}"`;
  const csv = `${headers.map(escape).join(',')}\r\n${headers.map((key) => escape(values[key as keyof typeof values])).join(',')}`;
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `gsc-${searchType}-${kind}-${endDate}.csv`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function LiveGscSignalWorkspace({ mode }: { mode: 'growth' | 'decline' | 'ctr' }) {
  const workspace = useGscWorkspace();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<SignalRow | null>(null);
  const analysis = workspace.analysis;
  if (!analysis) return <><DataSourceStatus /><EmptyState title="シグナル 0件" text={workspace.analysisLoading ? '実GSCデータを取得して判定しています。' : 'GSC接続・データ取得後に実データだけを表示します。'} /></>;

  const source = mode === 'growth' ? analysis.growth : mode === 'decline' ? analysis.declines : analysis.ctr;
  const rows = source.filter((row) => `${row.label} ${row.secondary}`.toLowerCase().includes(search.toLowerCase()));
  const meta = {
    growth: { title: '急上昇シグナル', summary: `${searchTypeLabel(analysis.searchType)}でクリック増加率がしきい値を超えたクエリ・ページ`, tone: 'success' as const, Icon: ArrowUpRight },
    decline: { title: '急落シグナル', summary: `${searchTypeLabel(analysis.searchType)}でクリック減少または順位悪化を検出した候補`, tone: 'danger' as const, Icon: ArrowDownRight },
    ctr: { title: 'CTR改善候補', summary: `${searchTypeLabel(analysis.searchType)}で自サイトの同順位帯CTRベンチマークを下回る候補`, tone: 'warning' as const, Icon: Target },
  }[mode];

  return (
    <>
      <DataSourceStatus />
      <div className="p2-signal-layout p3-live-signal">
        <Card className="p2-signal-main" padded={false}>
          <div className="p2-signal-main__head"><div><h2>{meta.title}</h2><p>{meta.summary}</p></div><Badge tone={meta.tone}>{rows.length}件</Badge></div>
          <div className="p2-signal-filter"><label className="p2-search"><Search /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="クエリ・ページを検索..." /></label></div>
          {rows.length ? <div className="p2-signal-list">{rows.map((row) => <LiveSignalRow key={row.id} row={row} mode={mode} onAction={() => setSelected(row)} />)}</div> : <EmptyState title="該当シグナルはありません" text="現在の検索タイプ・期間・デバイス・分析しきい値では候補が検出されませんでした。" />}
        </Card>
        <aside className="p2-signal-side">
          <Card><CardHeader title="実データ判定ロジック" description={`${analysis.range.startDate} 〜 ${analysis.range.endDate} vs 直前${analysis.range.days}日`} /><div className="p2-rule-list"><div><span>検索タイプ</span><strong>{searchTypeLabel(analysis.searchType)}</strong></div><div><span>急上昇</span><strong>+{workspace.thresholds.growthPercent}%以上</strong></div><div><span>急落</span><strong>{workspace.thresholds.declinePercent}%以下</strong></div><div><span>最低表示回数</span><strong>{number(workspace.thresholds.minImpressions)}</strong></div><div><span>CTR基準</span><strong>自サイト順位帯別</strong></div><div><span>対象上限順位</span><strong>{workspace.thresholds.opportunityMaxPosition}位</strong></div></div></Card>
          <Card><CardHeader title="データ品質" description="Search Console API" /><div className="p2-rule-list"><div><span>Query rows</span><strong>{number(analysis.diagnostics.fetchedQueryRows)}</strong></div><div><span>Page rows</span><strong>{number(analysis.diagnostics.fetchedPageRows)}</strong></div><div><span>Query×Page</span><strong>{number(analysis.diagnostics.fetchedQueryPageRows)}</strong></div><div><span>API cache</span><strong>{analysis.diagnostics.cache.toUpperCase()}</strong></div></div></Card>
        </aside>
      </div>
      <SignalActionDrawer row={selected} mode={mode} onClose={() => setSelected(null)} />
    </>
  );
}

function LiveSignalRow({ row, mode, onAction }: { row: SignalRow; mode: 'growth' | 'decline' | 'ctr'; onAction: () => void }) {
  const Icon = mode === 'growth' ? ArrowUpRight : mode === 'decline' ? ArrowDownRight : Target;
  return <article className="p2-signal-row"><div className={`p2-signal-icon p2-signal-icon--${mode}`}><Icon /></div><div className="p2-signal-row__main"><strong>{row.label}</strong><span>{row.secondary}</span><p>{row.reason}</p></div><div className="p2-signal-row__chart"><Sparkline values={row.spark} positive={mode !== 'decline'} /></div><div className="p2-signal-row__metrics"><strong>{row.primaryMetric}</strong><span>{number(row.impressions)} imp.</span><span>{row.position.toFixed(1)}位 / CTR {row.ctr.toFixed(2)}%</span></div><Badge tone={priorityTone(row.severity)}>{row.severity}</Badge><Button size="sm" variant="secondary" onClick={onAction}>{row.action}</Button></article>;
}

export function LiveGscDetailWorkspace({ kind, slug }: { kind: 'query' | 'page'; slug: string }) {
  const workspace = useGscWorkspace();
  const analysis = workspace.analysis;
  const listHref = kind === 'query' ? '/queries' : '/pages';

  if (!analysis) return <><PageHead eyebrow={kind === 'query' ? 'Query detail / GSC' : 'Page detail / GSC'} title="-" description="実GSCデータを取得後に詳細を表示します。読み込み中にデモ値は表示しません。" actions={<Link href={listHref} className="ui-button ui-button--ghost"><ArrowLeft />一覧へ戻る</Link>} /><LiveWorkspaceToolbar compact /><DataSourceStatus /><MetricGrid metrics={EMPTY_DETAIL_METRICS} /><EmptyState title={workspace.analysisLoading ? '詳細データを読み込み中' : '詳細データ未取得'} text="GSC接続・データ取得完了後に表示します。" /></>;

  const rows = kind === 'query' ? analysis.queries : analysis.pages;
  const row = rows.find((item) => item.id === slug);
  if (!row) return <><LiveWorkspaceToolbar compact /><DataSourceStatus /><EmptyState title="対象データが見つかりません" text="検索タイプ・期間・プロパティの変更により対象行が一覧から外れた可能性があります。" action={<Link className="ui-button ui-button--secondary ui-button--sm" href={listHref}><ArrowLeft />一覧へ戻る</Link>} /></>;

  const related = kind === 'query' ? analysis.relations?.queryToPages[row.label] ?? [] : analysis.relations?.pageToQueries[row.label] ?? [];
  const metrics = [
    { label: 'クリック', value: number(row.clicks), change: `${row.clickDelta >= 0 ? '+' : ''}${row.clickDelta.toFixed(1)}%`, direction: row.clickDelta >= 0 ? 'up' as const : 'down' as const, note: '前期間比' },
    { label: '表示回数', value: number(row.impressions), change: `${row.impressionDelta >= 0 ? '+' : ''}${row.impressionDelta.toFixed(1)}%`, direction: row.impressionDelta >= 0 ? 'up' as const : 'down' as const, note: '前期間比' },
    { label: 'CTR', value: `${row.ctr.toFixed(2)}%`, change: `${row.ctrDelta >= 0 ? '+' : ''}${row.ctrDelta.toFixed(2)}pt`, direction: row.ctrDelta >= 0 ? 'up' as const : 'down' as const, note: '前期間比' },
    { label: '平均順位', value: row.position.toFixed(1), change: row.positionDelta <= 0 ? `${Math.abs(row.positionDelta).toFixed(1)}改善` : `${row.positionDelta.toFixed(1)}悪化`, direction: row.positionDelta <= 0 ? 'up' as const : 'down' as const, note: '前期間比' },
  ];

  return (
    <>
      <PageHead eyebrow={kind === 'query' ? `Query detail / ${searchTypeLabel(analysis.searchType)}` : `Page detail / ${searchTypeLabel(analysis.searchType)}`} title={row.label} description={`${analysis.range.startDate}〜${analysis.range.endDate}の実GSCデータ。Opportunity Score ${row.score} / 優先度 ${row.priority}。`} actions={<><Link href={listHref} className="ui-button ui-button--ghost"><ArrowLeft />一覧へ戻る</Link>{kind === 'page' && row.label.startsWith('http') && <a href={row.label} target="_blank" rel="noreferrer" className="ui-button ui-button--secondary"><ExternalLink />実ページ</a>}<Button variant="secondary" icon={<Download />} onClick={() => downloadPerformanceRow(row, kind, analysis.searchType, analysis.range.endDate)}>CSV出力</Button></>} />
      <div className="p5-detail-badges">{row.tags.map((tag) => <Badge tone="info" key={tag}>{tag}</Badge>)}<Badge tone={priorityTone(row.priority)}>Score {row.score}</Badge><Badge tone="neutral">{searchTypeLabel(analysis.searchType)}</Badge></div>
      <LiveWorkspaceToolbar compact /><DataSourceStatus /><MetricGrid metrics={metrics} />
      <div className="p2-detail-grid p3-detail-grid"><Card><CardHeader title="パフォーマンス推移" description="前期間→現在期間の方向性を表示" action={<Badge tone={row.trend === 'down' ? 'danger' : row.trend === 'up' ? 'success' : 'neutral'}>{row.trend === 'down' ? '下降' : row.trend === 'up' ? '上昇' : '安定'}</Badge>} /><div className="p2-large-trend"><MicroBars values={row.spark} /></div></Card><Card><CardHeader title="分析エンジン診断" description="実GSCデータから判定" /><div className="p2-detail-insights"><div><Target /><span><strong>Opportunity Score {row.score}</strong>需要・順位帯・CTR余地・期間変化・リスクを統合。</span></div><div><Sparkles /><span><strong>検出シグナル</strong>{row.tags.join(' / ')}</span></div><div><Sparkles /><span><strong>次の確認</strong>{row.tags.includes('CTR改善') ? '実際の検索結果でtitle / descriptionや表示形式を確認してください。' : row.tags.includes('急落') ? '順位・CTR・需要のどこが落ちたか切り分けてください。' : '関連テーマと内部リンクの拡張余地を確認してください。'}</span></div></div></Card></div>
      <Card padded={false}><div className="p2-explorer__head"><div><div className="p2-explorer__title">{kind === 'query' ? '実際に表示された関連ページ' : '実際の流入クエリ'}</div><div className="p2-explorer__desc">Search Consoleのquery × pageデータから取得</div></div><Badge tone="success">GSC LIVE</Badge></div>{related.length ? <div className="p3-related-table-wrap"><table className="p2-table p3-related-table"><thead><tr><th>{kind === 'query' ? 'ページ' : 'クエリ'}</th><th>クリック</th><th>表示回数</th><th>CTR</th><th>平均順位</th></tr></thead><tbody>{related.map((item) => <tr key={item.label}><td className="p2-table__primary"><strong>{item.label}</strong></td><td className="p2-num">{number(item.clicks)}</td><td className="p2-num">{number(item.impressions)}</td><td className="p2-num">{item.ctr.toFixed(2)}%</td><td className="p2-num">{item.position.toFixed(1)}</td></tr>)}</tbody></table></div> : <EmptyState title="関連データがありません" text="Search Console APIの返却範囲では関連するquery × page行を取得できませんでした。" />}</Card>
    </>
  );
}
