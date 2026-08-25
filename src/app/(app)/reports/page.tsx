import { AnalysisSnapshotHistory } from '@/components/application/analysis-history';
import { DataSourceStatus, LiveWorkspaceToolbar } from '@/components/application/live-workspaces';
import { ProductionReportTools, UrlNormalizationPanel } from '@/components/application/production-workspaces';
import { PageHead } from '@/components/ui';

export default function ReportsPage() {
  return (
    <>
      <PageHead
        eyebrow="Reporting / Phase 4"
        title="レポート"
        description="現在選択中のGSC実データをCSV出力し、軽量スナップショットをブラウザへ保存して過去分析との比較材料を残します。"
      />
      <LiveWorkspaceToolbar compact />
      <DataSourceStatus />
      <ProductionReportTools />
      <AnalysisSnapshotHistory />
      <UrlNormalizationPanel compact />
    </>
  );
}
