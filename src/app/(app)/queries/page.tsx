import { EmptyAwarePerformanceWorkspace } from '@/components/application/empty-aware-workspaces';
import { LiveWorkspaceToolbar } from '@/components/application/live-workspaces';
import { AnalysisExportButton } from '@/components/application/production-workspaces';
import { AnalysisConditionsButton } from '@/components/application/workspace-actions';
import { PageHead } from '@/components/ui';

export default function QueriesPage() {
  return (
    <>
      <PageHead eyebrow="Search performance / Phase 5" title="クエリ分析" description="ウェブ・画像・動画のGSCクエリデータを前期間と比較し、クリック・表示・CTR・順位・Opportunity Scoreを分析します。" actions={<><AnalysisExportButton dataset="queries" label="CSV出力" /><AnalysisConditionsButton /></>} />
      <LiveWorkspaceToolbar compact />
      <EmptyAwarePerformanceWorkspace kind="queries" />
    </>
  );
}
