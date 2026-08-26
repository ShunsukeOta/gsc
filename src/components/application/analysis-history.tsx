'use client';

import { Clock3, Database, Download, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Badge, Button, Card, CardHeader, EmptyState } from '@/components/ui';
import type { GscSearchType } from '@/lib/gsc/types';
import { useGscWorkspace } from './gsc-context';
import { searchTypeLabel } from './live-workspaces';

const STORAGE_KEY = 'gsc-analyzer-snapshots-v1';
const MAX_SNAPSHOTS = 24;

type Snapshot = {
  id: string;
  siteUrl: string;
  searchType: GscSearchType;
  generatedAt: string;
  range: string;
  clicks: string;
  impressions: string;
  ctr: string;
  position: string;
  opportunities: number;
  anomalies: number;
  dataQuality?: number;
};

function readSnapshots(): Snapshot[] {
  if (typeof window === 'undefined') return [];
  try {
    const value = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '[]');
    if (!Array.isArray(value)) return [];
    return value.map((row) => ({ ...row, searchType: row.searchType === 'image' || row.searchType === 'video' ? row.searchType : 'web' })) as Snapshot[];
  } catch { return []; }
}

function writeSnapshots(rows: Snapshot[]) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(rows.slice(0, MAX_SNAPSHOTS)));
}

function metricValue(metrics: Array<{ label: string; value: string }>, label: string) {
  return metrics.find((item) => item.label === label)?.value ?? '-';
}

export function AnalysisSnapshotHistory() {
  const { analysis, searchType } = useGscWorkspace();
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  useEffect(() => setSnapshots(readSnapshots()), []);

  useEffect(() => {
    if (!analysis) return;
    const snapshot: Snapshot = {
      id: `${analysis.siteUrl}|${analysis.searchType}|${analysis.generatedAt}`,
      siteUrl: analysis.siteUrl,
      searchType: analysis.searchType,
      generatedAt: analysis.generatedAt,
      range: `${analysis.range.startDate}〜${analysis.range.endDate}`,
      clicks: metricValue(analysis.metrics, '合計クリック数'),
      impressions: metricValue(analysis.metrics, '合計表示回数'),
      ctr: metricValue(analysis.metrics, '平均CTR'),
      position: metricValue(analysis.metrics, '平均掲載順位'),
      opportunities: analysis.opportunities.length,
      anomalies: analysis.anomalies?.length ?? 0,
      dataQuality: analysis.dataQuality?.score,
    };
    setSnapshots((current) => {
      if (current.some((item) => item.id === snapshot.id)) return current;
      const next = [snapshot, ...current].slice(0, MAX_SNAPSHOTS);
      writeSnapshots(next);
      return next;
    });
  }, [analysis]);

  const currentSiteRows = useMemo(() => analysis ? snapshots.filter((item) => item.siteUrl === analysis.siteUrl && item.searchType === analysis.searchType) : snapshots.filter((item) => item.searchType === searchType), [analysis, searchType, snapshots]);

  const download = () => {
    if (!currentSiteRows.length) return;
    const blob = new Blob([JSON.stringify(currentSiteRows, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `gsc-${searchType}-analysis-history-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  const clear = () => {
    const site = analysis?.siteUrl;
    const next = snapshots.filter((item) => site ? !(item.siteUrl === site && item.searchType === searchType) : item.searchType !== searchType);
    writeSnapshots(next);
    setSnapshots(next);
  };

  return (
    <Card className="p4-history" padded={false}>
      <div className="p4-history__head"><CardHeader title="分析スナップショット" description={`${searchTypeLabel(searchType)}のKPI・改善候補・異常件数をブラウザへ最大24件保存`} action={<Badge tone="info">LOCAL</Badge>} /><div className="p4-history__actions"><Button size="sm" variant="ghost" icon={<Download />} disabled={!currentSiteRows.length} onClick={download}>JSON</Button><Button size="sm" variant="ghost" icon={<Trash2 />} disabled={!currentSiteRows.length} onClick={clear}>履歴削除</Button></div></div>
      {!currentSiteRows.length ? <div className="p4-history__empty"><EmptyState title="履歴はまだありません" text={`${searchTypeLabel(searchType)}の実GSC分析が完了すると、このブラウザに軽量スナップショットを保存します。`} /></div> : <div className="p4-history__scroll"><table className="p4-history-table"><thead><tr><th>取得日時</th><th>検索タイプ</th><th>対象期間</th><th>クリック</th><th>表示回数</th><th>CTR</th><th>順位</th><th>Opportunity</th><th>異常</th><th>品質</th></tr></thead><tbody>{currentSiteRows.map((row) => <tr key={row.id}><td><span className="p4-history-date"><Clock3 />{new Intl.DateTimeFormat('ja-JP', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(row.generatedAt))}</span></td><td>{searchTypeLabel(row.searchType)}</td><td>{row.range}</td><td>{row.clicks}</td><td>{row.impressions}</td><td>{row.ctr}</td><td>{row.position}</td><td>{row.opportunities}</td><td>{row.anomalies}</td><td>{row.dataQuality ?? '-'}</td></tr>)}</tbody></table></div>}
      <div className="p4-history__foot"><Database />Search Consoleの全行やOAuth tokenは保存しません。履歴は検索タイプ別に、このブラウザ内だけへ保持します。</div>
    </Card>
  );
}
