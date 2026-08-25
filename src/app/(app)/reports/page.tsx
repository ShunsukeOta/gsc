import { DataSourceStatus, LiveWorkspaceToolbar } from '@/components/application/live-workspaces';
import { ProductionReportTools, UrlNormalizationPanel } from '@/components/application/production-workspaces';
import { PageHead } from '@/components/ui';

export default function ReportsPage() {
  return (
    <>
      <PageHead
        eyebrow="Reporting / Phase 4"
        title="レポート"
        description="現在選択中のGSCプロパティ・期間・デバイス・しきい値を反映した実データを、分析用途ごとのCSVとして出力します。ダミーの履歴表示は本番画面から除外しています。"
      />
      <LiveWorkspaceToolbar compact />
      <DataSourceStatus />
      <ProductionReportTools />
      <UrlNormalizationPanel compact />
    </>
  );
}
