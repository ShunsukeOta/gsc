'use client';

import { EmptyState } from '@/components/ui';
import { opportunities, pagePerformance, queryPerformance } from '@/lib/application-data';
import { useGscWorkspace } from './gsc-context';
import { DataSourceStatus } from './live-workspaces';
import { OpportunityBoard, PerformanceExplorer } from './workspaces';

export function EmptyAwareOpportunityWorkspace() {
  const { analysis } = useGscWorkspace();

  if (analysis && analysis.opportunities.length === 0) {
    return (
      <>
        <DataSourceStatus />
        <EmptyState
          title="改善候補はありません"
          text="現在の期間・フィルター・分析しきい値では、Opportunity Scoreの対象になる改善候補が検出されませんでした。"
        />
      </>
    );
  }

  return (
    <>
      <DataSourceStatus />
      <OpportunityBoard items={analysis?.opportunities ?? opportunities} />
    </>
  );
}

export function EmptyAwarePerformanceWorkspace({ kind }: { kind: 'queries' | 'pages' }) {
  const { analysis } = useGscWorkspace();
  const liveRows = analysis?.[kind];

  if (analysis && liveRows && liveRows.length === 0) {
    return (
      <>
        <DataSourceStatus />
        <EmptyState
          title={kind === 'queries' ? 'クエリデータがありません' : 'ページデータがありません'}
          text="選択中のプロパティ・期間・デバイス条件ではSearch Consoleデータが取得できませんでした。条件を変更して再分析してください。"
        />
      </>
    );
  }

  return (
    <>
      <DataSourceStatus />
      <PerformanceExplorer
        kind={kind}
        rows={liveRows ?? (kind === 'queries' ? queryPerformance : pagePerformance)}
      />
    </>
  );
}
