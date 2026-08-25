'use client';

import Link from 'next/link';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  CircleGauge,
  Download,
  ExternalLink,
  FileSpreadsheet,
  Layers3,
  ShieldCheck,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { Badge, Button, Card, CardHeader, EmptyState } from '@/components/ui';
import type { ProductionAnomaly } from '@/lib/gsc/types';
import { useGscWorkspace } from './gsc-context';

const number = (value: number) => new Intl.NumberFormat('ja-JP').format(value);

function anomalyTone(severity: ProductionAnomaly['severity']) {
  return severity === 'critical' ? 'danger' as const : severity === 'warning' ? 'warning' as const : 'info' as const;
}

function anomalyIcon(kind: ProductionAnomaly['kind']) {
  if (kind === 'growth-breakout') return TrendingUp;
  if (kind === 'ctr-loss') return Activity;
  if (kind === 'daily-drop' || kind === 'traffic-drop' || kind === 'rank-loss' || kind === 'demand-loss') return TrendingDown;
  return AlertTriangle;
}

function anomalyKindLabel(kind: ProductionAnomaly['kind']) {
  return {
    'rank-loss': '順位低下',
    'ctr-loss': 'CTR低下',
    'demand-loss': '需要低下',
    'traffic-drop': '流入急落',
    'growth-breakout': '急成長',
    'daily-drop': '日次異常',
  }[kind];
}

function safeFragmentLabel(url: string) {
  const fragment = url.split('#').slice(1).join('#');
  if (!fragment) return '';
  try {
    return decodeURIComponent(fragment);
  } catch {
    return fragment;
  }
}

export function UrlNormalizationPanel({ compact = false }: { compact?: boolean }) {
  const { analysis } = useGscWorkspace();
  if (!analysis?.urlNormalization) return null;
  const summary = analysis.urlNormalization;

  if (!summary.affectedGroups) {
    if (compact) return null;
    return (
      <Card className="p4-normalization p4-normalization--clean">
        <CardHeader title="URL正規化" description="フラグメント付きURLの重複は検出されていません" action={<Badge tone="success">CLEAN</Badge>} />
        <div className="p4-clean-line"><CheckCircle2 />ページ分析上のURL識別に問題はありません。クエリ文字列は安全のため保持しています。</div>
      </Card>
    );
  }

  return (
    <Card className={`p4-normalization${compact ? ' p4-normalization--compact' : ''}`}>
      <CardHeader
        title="URLフラグメントを同一ページへ集約"
        description="#以降だけを除外し、クリック・表示回数・CTR・順位を再集計してから分析しています"
        action={<Badge tone="info">{summary.affectedGroups} groups</Badge>}
      />
      <div className="p4-normalization__stats">
        <div><strong>{summary.fragmentRows}</strong><span>fragment rows</span></div>
        <div><strong>{summary.collapsedPageRows}</strong><span>page rows merged</span></div>
        <div><strong>{summary.collapsedQueryPageRows}</strong><span>query×page merged</span></div>
      </div>
      {!compact && (
        <div className="p4-url-groups">
          {summary.groups.slice(0, 12).map((group) => (
            <details className="p4-url-group" key={group.canonicalUrl}>
              <summary>
                <Layers3 />
                <code>{group.canonicalUrl}</code>
                <span>{group.variants.length} variant{group.variants.length === 1 ? '' : 's'} / {number(group.impressions)} imp.</span>
              </summary>
              <div className="p4-url-group__body">
                <p>分析対象は上記URLへ統合しています。以下はSearch Consoleが返した元URLです。</p>
                {group.variants.map((variant) => (
                  <div className="p4-url-variant" key={variant}>
                    <code>{variant}</code>
                    {variant.includes('#') && <span>#{safeFragmentLabel(variant)}</span>}
                  </div>
                ))}
              </div>
            </details>
          ))}
        </div>
      )}
      <div className="p4-normalization__note">Query string（?以降）は別ページの可能性があるため自動除外しません。Phase 4では安全に判断できる #fragment のみ統合します。</div>
    </Card>
  );
}

function QualityCard() {
  const { analysis } = useGscWorkspace();
  const quality = analysis?.dataQuality;
  if (!quality) return null;
  const tone = quality.level === 'excellent' ? 'success' as const : quality.level === 'good' ? 'info' as const : 'warning' as const;
  return (
    <Card className="p4-quality-card">
      <CardHeader title="分析データ品質" description="未確定日・取得上限・URL正規化を含む診断" action={<Badge tone={tone}>{quality.score}/100</Badge>} />
      <div className="p4-quality-meter"><span style={{ width: `${quality.score}%` }} /></div>
      <div className="p4-quality-flags">
        <span className={quality.partialData ? 'is-warning' : 'is-ok'}>{quality.partialData ? <AlertTriangle /> : <CheckCircle2 />}未確定データ</span>
        <span className={quality.queryRowsTruncated || quality.pageRowsTruncated || quality.queryPageRowsTruncated ? 'is-warning' : 'is-ok'}>{quality.queryRowsTruncated || quality.pageRowsTruncated || quality.queryPageRowsTruncated ? <AlertTriangle /> : <CheckCircle2 />}取得上限</span>
        <span className="is-ok"><ShieldCheck />URL正規化 {quality.normalizedUrlGroups}</span>
      </div>
      <ul className="p4-quality-notes">{quality.notes.slice(0, 4).map((note) => <li key={note}>{note}</li>)}</ul>
    </Card>
  );
}

function AnomalyList({ rows, limit }: { rows: ProductionAnomaly[]; limit?: number }) {
  const items = typeof limit === 'number' ? rows.slice(0, limit) : rows;
  if (!items.length) return <EmptyState title="重大な異常は検出されていません" text="現在の期間・最低表示回数・変化率では緊急対応が必要なシグナルはありません。" />;

  return (
    <div className="p4-anomaly-list">
      {items.map((row) => {
        const Icon = anomalyIcon(row.kind);
        return (
          <article className={`p4-anomaly is-${row.severity}`} key={row.id}>
            <div className="p4-anomaly__icon"><Icon /></div>
            <div className="p4-anomaly__main">
              <div className="p4-anomaly__badges"><Badge tone={anomalyTone(row.severity)}>{anomalyKindLabel(row.kind)}</Badge><span>{row.scope === 'site' ? 'サイト全体' : row.scope === 'page' ? 'ページ' : 'クエリ'}</span><span>信頼度 {row.confidence}%</span></div>
              <h3>{row.title}</h3>
              <code>{row.label}</code>
              <p>{row.summary}</p>
              <div className="p4-anomaly__evidence">{row.evidence.map((item) => <span key={item}>{item}</span>)}</div>
              <div className="p4-anomaly__action"><Sparkles /><span><strong>次の確認</strong>{row.action}</span></div>
            </div>
            <div className="p4-anomaly__score"><strong>{row.score}</strong><span>risk / opportunity</span><small>{number(row.impressions)} imp.</small></div>
          </article>
        );
      })}
    </div>
  );
}

export function ProductionDashboardPanel() {
  const { analysis } = useGscWorkspace();
  if (!analysis) return null;
  const anomalies = analysis.anomalies ?? [];
  const critical = anomalies.filter((item) => item.severity === 'critical').length;

  return (
    <section className="p4-dashboard-section">
      <div className="p4-section-head"><div><span>Production Intelligence</span><h2>異常検知とデータ品質</h2><p>前期間比較だけでなく、原因候補とデータ自体の信頼性まで確認します。</p></div><Link className="ui-button ui-button--secondary ui-button--sm" href="/anomalies">すべての異常を見る</Link></div>
      <div className="p4-dashboard-grid">
        <Card className="p4-dashboard-anomalies">
          <CardHeader title="要確認シグナル" description="順位・CTR・需要・流入を原因別に分類" action={<Badge tone={critical ? 'danger' : 'info'}>{critical ? `${critical} critical` : `${anomalies.length} signals`}</Badge>} />
          <AnomalyList rows={anomalies} limit={4} />
        </Card>
        <div className="p4-dashboard-side"><QualityCard /><UrlNormalizationPanel compact /></div>
      </div>
    </section>
  );
}

export function AnomalyWorkspace() {
  const { analysis } = useGscWorkspace();
  if (!analysis) return <EmptyState title="GSCデータを接続してください" text="異常検知は実Search Consoleデータ取得後に利用できます。" />;
  const anomalies = analysis.anomalies ?? [];
  const critical = anomalies.filter((item) => item.severity === 'critical').length;
  const warning = anomalies.filter((item) => item.severity === 'warning').length;
  const growth = anomalies.filter((item) => item.kind === 'growth-breakout').length;

  return (
    <>
      <div className="p4-anomaly-summary">
        <div><AlertTriangle /><span>Critical</span><strong>{critical}</strong></div>
        <div><CircleGauge /><span>Warning</span><strong>{warning}</strong></div>
        <div><TrendingUp /><span>Growth breakout</span><strong>{growth}</strong></div>
        <div><ShieldCheck /><span>Data quality</span><strong>{analysis.dataQuality?.score ?? '-'}</strong><small>/100</small></div>
      </div>
      <div className="p4-anomaly-layout">
        <Card className="p4-anomaly-board"><CardHeader title="異常・成長シグナル" description="原因候補を優先度と信頼度でランキング" action={<Badge tone="info">{anomalies.length}件</Badge>} /><AnomalyList rows={anomalies} /></Card>
        <aside className="p4-anomaly-side"><QualityCard /><UrlNormalizationPanel /></aside>
      </div>
    </>
  );
}

type ExportDataset = 'queries' | 'pages' | 'opportunities' | 'anomalies';

function csvCell(value: unknown) {
  const text = value == null ? '' : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

function downloadCsv(filename: string, rows: Array<Record<string, unknown>>) {
  if (!rows.length) return false;
  const headers = Object.keys(rows[0]);
  const csv = [headers.map(csvCell).join(','), ...rows.map((row) => headers.map((key) => csvCell(row[key])).join(','))].join('\r\n');
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
  return true;
}

export function AnalysisExportButton({ dataset, label = 'CSV出力', variant = 'secondary' }: { dataset: ExportDataset; label?: string; variant?: 'primary' | 'secondary' | 'ghost' }) {
  const { analysis } = useGscWorkspace();
  const handleDownload = () => {
    if (!analysis) return;
    const date = analysis.range.endDate;
    const slug = analysis.siteUrl.replace(/^https?:\/\//, '').replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/-+$/g, '') || 'gsc';
    const rows: Array<Record<string, unknown>> = dataset === 'queries'
      ? analysis.queries.map((row) => ({ query: row.label, clicks: row.clicks, impressions: row.impressions, ctr_percent: row.ctr, position: row.position, click_delta_percent: row.clickDelta, impression_delta_percent: row.impressionDelta, ctr_delta_pt: row.ctrDelta, position_delta: row.positionDelta, opportunity_score: row.score, priority: row.priority, tags: row.tags.join('|') }))
      : dataset === 'pages'
        ? analysis.pages.map((row) => ({ page: row.label, clicks: row.clicks, impressions: row.impressions, ctr_percent: row.ctr, position: row.position, click_delta_percent: row.clickDelta, impression_delta_percent: row.impressionDelta, ctr_delta_pt: row.ctrDelta, position_delta: row.positionDelta, opportunity_score: row.score, priority: row.priority, tags: row.tags.join('|') }))
        : dataset === 'opportunities'
          ? analysis.opportunities.map((row) => ({ type: row.type, target: row.target, title: row.title, score: row.score, impact: row.impact, effort: row.effort, impressions: row.impressions, position: row.position, click_delta_percent: row.delta, reason: row.reason, action: row.action }))
          : (analysis.anomalies ?? []).map((row) => ({ severity: row.severity, kind: anomalyKindLabel(row.kind), scope: row.scope, target: row.label, score: row.score, confidence: row.confidence, impressions: row.impressions, click_delta_percent: row.clickDelta, position_delta: row.positionDelta ?? '', ctr_delta_pt: row.ctrDelta ?? '', summary: row.summary, action: row.action }));
    downloadCsv(`${slug}-${dataset}-${date}.csv`, rows);
  };

  return <Button variant={variant} icon={<Download />} disabled={!analysis} onClick={handleDownload}>{label}</Button>;
}

export function ProductionReportTools() {
  const { analysis } = useGscWorkspace();
  if (!analysis) return null;
  return (
    <Card className="p4-report-tools">
      <CardHeader title="実データエクスポート" description={`${analysis.range.startDate} 〜 ${analysis.range.endDate} / ${analysis.siteUrl}`} action={<Badge tone="success">GSC LIVE</Badge>} />
      <div className="p4-export-grid">
        <div><FileSpreadsheet /><span><strong>クエリ</strong>{number(analysis.queries.length)} rows</span><AnalysisExportButton dataset="queries" label="CSV" /></div>
        <div><FileSpreadsheet /><span><strong>ページ</strong>{number(analysis.pages.length)} rows</span><AnalysisExportButton dataset="pages" label="CSV" /></div>
        <div><Sparkles /><span><strong>改善機会</strong>{number(analysis.opportunities.length)} rows</span><AnalysisExportButton dataset="opportunities" label="CSV" /></div>
        <div><AlertTriangle /><span><strong>異常検知</strong>{number(analysis.anomalies?.length ?? 0)} rows</span><AnalysisExportButton dataset="anomalies" label="CSV" /></div>
      </div>
      <div className="p4-report-note"><ExternalLink />CSVは現在画面で選択中のプロパティ・期間・デバイス・分析しきい値を反映します。</div>
    </Card>
  );
}
