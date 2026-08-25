import { LiveDashboardData, LiveWorkspaceToolbar } from '@/components/application/live-workspaces';
import { AnalysisExportButton, ProductionDashboardPanel } from '@/components/application/production-workspaces';
import { PageHead } from '@/components/ui';

export default function DashboardPage() {
  return (
    <>
      <PageHead
        eyebrow="Overview / Phase 4"
        title="ダッシュボード"
        description="Google Search Consoleの実データを正規化・比較し、改善機会だけでなく異常原因・データ品質まで一画面で判断します。"
        actions={<AnalysisExportButton dataset="queries" label="クエリCSV" />}
      />
      <LiveWorkspaceToolbar />
      <LiveDashboardData />
      <ProductionDashboardPanel />
    </>
  );
}
