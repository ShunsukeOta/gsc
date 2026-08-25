import { AlertTriangle } from 'lucide-react';
import { AnomalyWorkspace, AnalysisExportButton } from '@/components/application/production-workspaces';
import { DataSourceStatus, LiveWorkspaceToolbar } from '@/components/application/live-workspaces';
import { PageHead } from '@/components/ui';

export default function AnomaliesPage() {
  return (
    <>
      <PageHead
        eyebrow="Production intelligence / Phase 4"
        title="異常検知"
        description="順位低下・CTR低下・検索需要減・流入急落・成長ブレイクアウトを原因候補ごとに分類し、データ量から信頼度も算出します。"
        actions={<AnalysisExportButton dataset="anomalies" label="異常CSV" />}
      />
      <LiveWorkspaceToolbar compact />
      <DataSourceStatus />
      <div className="p4-page-lead"><AlertTriangle />未確定日を含む場合、日次異常検知は確定済みデータを優先して誤検知を抑えます。</div>
      <AnomalyWorkspace />
    </>
  );
}
