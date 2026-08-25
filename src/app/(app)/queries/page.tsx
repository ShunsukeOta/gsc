import { SlidersHorizontal } from 'lucide-react';
import { EmptyAwarePerformanceWorkspace } from '@/components/application/empty-aware-workspaces';
import { LiveWorkspaceToolbar } from '@/components/application/live-workspaces';
import { AnalysisExportButton } from '@/components/application/production-workspaces';
import { Button, PageHead } from '@/components/ui';

export default function QueriesPage() {
  return (
    <>
      <PageHead
        eyebrow="Search performance / Phase 4"
        title="クエリ分析"
        description="GSCのクエリデータを前期間と比較し、クリック・表示・CTR・順位・Opportunity Scoreを同じテーブルで分析します。"
        actions={<><AnalysisExportButton dataset="queries" label="CSV出力" /><Button icon={<SlidersHorizontal />}>分析条件</Button></>}
      />
      <LiveWorkspaceToolbar compact />
      <EmptyAwarePerformanceWorkspace kind="queries" />
    </>
  );
}
