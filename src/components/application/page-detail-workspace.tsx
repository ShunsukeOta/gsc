'use client';

import Link from 'next/link';
import { ArrowLeft, Download, ExternalLink, Sparkles, Target } from 'lucide-react';
import { MetricGrid } from '@/components/analytics';
import { Badge, Button, Card, CardHeader, EmptyState, PageHead } from '@/components/ui';
import type { PerformanceRow, Priority } from '@/lib/analysis-types';
import { PageInspector } from './page-inspector';
import { MicroBars } from './visuals';
import { DataSourceStatus, LiveWorkspaceToolbar, searchTypeLabel } from './live-workspaces';
import { useGscWorkspace } from './gsc-context';

const number = (value: number) => new Intl.NumberFormat('ja-JP').format(value);
const priorityTone = (value: Priority) => value === '高' ? 'danger' as const : value === '中' ? 'warning' as const : 'neutral' as const;
const EMPTY_DETAIL_METRICS = [
  { label: 'クリック', value: '0', change: '-', direction: 'up' as const, note: '取得待ち' },
  { label: '表示回数', value: '0', change: '-', direction: 'up' as const, note: '取得待ち' },
  { label: 'CTR', value: '-', change: '-', direction: 'up' as const, note: '取得待ち' },
  { label: '平均順位', value: '-', change: '-', direction: 'up' as const, note: '取得待ち' },
];

function downloadPerformanceRow(row: PerformanceRow, searchType: string, endDate: string) {
  const values = {
    type: 'page',
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
  anchor.download = `gsc-${searchType}-page-${endDate}.csv`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function LivePageDetailWorkspace({ slug }: { slug: string }) {
  const workspace = useGscWorkspace();
  const analysis = workspace.analysis;

  if (!analysis) {
    return (
      <>
        <PageHead eyebrow="Page detail / GSC" title="-" description="実GSCデータを取得後にページ情報とパフォーマンスを表示します。" actions={<Link href="/pages" className="ui-button ui-button--ghost"><ArrowLeft />一覧へ戻る</Link>} />
        <LiveWorkspaceToolbar compact />
        <DataSourceStatus />
        <MetricGrid metrics={EMPTY_DETAIL_METRICS} />
        <EmptyState title={workspace.analysisLoading ? '詳細データを読み込み中' : '詳細データ未取得'} text="GSC接続・データ取得完了後に表示します。" />
      </>
    );
  }

  const row = analysis.pages.find((item) => item.id === slug);
  if (!row) {
    return (
      <>
        <LiveWorkspaceToolbar compact />
        <DataSourceStatus />
        <EmptyState title="対象ページが見つかりません" text="検索タイプ・期間・プロパティの変更により対象行が一覧から外れた可能性があります。" action={<Link className="ui-button ui-button--secondary ui-button--sm" href="/pages"><ArrowLeft />一覧へ戻る</Link>} />
      </>
    );
  }

  const related = analysis.relations?.pageToQueries[row.label] ?? [];
  const metrics = [
    { label: 'クリック', value: number(row.clicks), change: `${row.clickDelta >= 0 ? '+' : ''}${row.clickDelta.toFixed(1)}%`, direction: row.clickDelta >= 0 ? 'up' as const : 'down' as const, note: '前期間比' },
    { label: '表示回数', value: number(row.impressions), change: `${row.impressionDelta >= 0 ? '+' : ''}${row.impressionDelta.toFixed(1)}%`, direction: row.impressionDelta >= 0 ? 'up' as const : 'down' as const, note: '前期間比' },
    { label: 'CTR', value: `${row.ctr.toFixed(2)}%`, change: `${row.ctrDelta >= 0 ? '+' : ''}${row.ctrDelta.toFixed(2)}pt`, direction: row.ctrDelta >= 0 ? 'up' as const : 'down' as const, note: '前期間比' },
    { label: '平均順位', value: row.position.toFixed(1), change: row.positionDelta <= 0 ? `${Math.abs(row.positionDelta).toFixed(1)}改善` : `${row.positionDelta.toFixed(1)}悪化`, direction: row.positionDelta <= 0 ? 'up' as const : 'down' as const, note: '前期間比' },
  ];

  return (
    <>
      <PageHead
        eyebrow={`Page detail / ${searchTypeLabel(analysis.searchType)}`}
        title={row.label}
        description={`${analysis.range.startDate}〜${analysis.range.endDate}の実GSCデータと、現在配信されているページHTMLの基本SEO情報を同じ画面で確認します。`}
        actions={
          <>
            <Link href="/pages" className="ui-button ui-button--ghost"><ArrowLeft />一覧へ戻る</Link>
            {row.label.startsWith('http') && <a href={row.label} target="_blank" rel="noreferrer" className="ui-button ui-button--secondary"><ExternalLink />実ページ</a>}
            <Button variant="secondary" icon={<Download />} onClick={() => downloadPerformanceRow(row, analysis.searchType, analysis.range.endDate)}>CSV出力</Button>
          </>
        }
      />

      <div className="p5-detail-badges">
        {row.tags.map((tag) => <Badge tone="info" key={tag}>{tag}</Badge>)}
        <Badge tone={priorityTone(row.priority)}>Score {row.score}</Badge>
        <Badge tone="neutral">{searchTypeLabel(analysis.searchType)}</Badge>
      </div>

      <LiveWorkspaceToolbar compact />
      <DataSourceStatus />

      {row.label.startsWith('http') && <PageInspector site={analysis.siteUrl} url={row.label} />}

      <MetricGrid metrics={metrics} />

      <div className="p2-detail-grid p3-detail-grid">
        <Card>
          <CardHeader title="パフォーマンス推移" description="前期間→現在期間の方向性を表示" action={<Badge tone={row.trend === 'down' ? 'danger' : row.trend === 'up' ? 'success' : 'neutral'}>{row.trend === 'down' ? '下降' : row.trend === 'up' ? '上昇' : '安定'}</Badge>} />
          <div className="p2-large-trend"><MicroBars values={row.spark} /></div>
        </Card>
        <Card>
          <CardHeader title="分析エンジン診断" description="実GSCデータから判定" />
          <div className="p2-detail-insights">
            <div><Target /><span><strong>Opportunity Score {row.score}</strong>需要・順位帯・CTR余地・期間変化・リスクを統合。</span></div>
            <div><Sparkles /><span><strong>検出シグナル</strong>{row.tags.join(' / ')}</span></div>
            <div><Sparkles /><span><strong>次の確認</strong>{row.tags.includes('CTR改善') ? '上のページ情報で現在のtitle / descriptionを確認し、必要なら改善してください。' : row.tags.includes('急落') ? '順位・CTR・需要のどこが落ちたか切り分けてください。' : '関連テーマと内部リンクの拡張余地を確認してください。'}</span></div>
          </div>
        </Card>
      </div>

      <Card padded={false}>
        <div className="p2-explorer__head"><div><div className="p2-explorer__title">実際の流入クエリ</div><div className="p2-explorer__desc">Search Consoleのquery × pageデータから取得</div></div><Badge tone="success">GSC LIVE</Badge></div>
        {related.length ? (
          <div className="p3-related-table-wrap">
            <table className="p2-table p3-related-table">
              <thead><tr><th>クエリ</th><th>クリック</th><th>表示回数</th><th>CTR</th><th>平均順位</th></tr></thead>
              <tbody>{related.map((item) => <tr key={item.label}><td className="p2-table__primary"><strong>{item.label}</strong></td><td className="p2-num">{number(item.clicks)}</td><td className="p2-num">{number(item.impressions)}</td><td className="p2-num">{item.ctr.toFixed(2)}%</td><td className="p2-num">{item.position.toFixed(1)}</td></tr>)}</tbody>
            </table>
          </div>
        ) : <EmptyState title="関連データがありません" text="Search Console APIの返却範囲では関連するquery × page行を取得できませんでした。" />}
      </Card>
    </>
  );
}
