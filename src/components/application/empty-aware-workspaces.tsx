'use client';

import { EmptyState } from '@/components/ui';
import { useGscWorkspace } from './gsc-context';
import { DataSourceStatus } from './live-workspaces';
import { OpportunityBoard, PerformanceExplorer } from './workspaces';

export function EmptyAwareOpportunityWorkspace() {
  const workspace = useGscWorkspace();
  const analysis = workspace.analysis;
  return (
    <>
      <DataSourceStatus />
      {!analysis ? <EmptyState title="改善機会 0件" text={workspace.analysisLoading ? '実GSCデータを取得してOpportunity Scoreを計算しています。' : 'GSC接続・データ取得後に実データだけを表示します。'} /> : analysis.opportunities.length === 0 ? <EmptyState title="改善候補はありません" text="現在の期間・検索タイプ・デバイス・分析しきい値では改善候補が検出されませんでした。" /> : <OpportunityBoard items={analysis.opportunities} />}
    </>
  );
}

export function EmptyAwarePerformanceWorkspace({ kind }: { kind: 'queries' | 'pages' }) {
  const workspace = useGscWorkspace();
  const analysis = workspace.analysis;
  const rows = analysis?.[kind] ?? [];
  return (
    <>
      <DataSourceStatus />
      {!analysis ? <EmptyState title={kind === 'queries' ? 'クエリ 0件' : 'ページ 0件'} text={workspace.analysisLoading ? '実GSCデータを読み込んでいます。読み込み中にサンプル値は表示しません。' : 'GSC接続・データ取得後に実データだけを表示します。'} /> : rows.length === 0 ? <EmptyState title={kind === 'queries' ? 'クエリデータがありません' : 'ページデータがありません'} text="選択中のプロパティ・検索タイプ・期間・デバイス条件ではSearch Consoleデータが取得できませんでした。" /> : <PerformanceExplorer kind={kind} rows={rows} />}
    </>
  );
}
