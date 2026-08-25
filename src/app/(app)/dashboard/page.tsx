import { Download } from 'lucide-react';
import { LiveDashboardData, LiveWorkspaceToolbar } from '@/components/application/live-workspaces';
import { Button, PageHead } from '@/components/ui';

export default function DashboardPage() {
  return (
    <>
      <PageHead
        eyebrow="Overview / Phase 3"
        title="ダッシュボード"
        description="Google Search Consoleの実データを前期間と比較し、急上昇・急落・CTR改善・TOP10候補を自動分析します。未接続時は同じUIでデモデータを確認できます。"
        actions={<Button variant="secondary" icon={<Download />}>CSV出力</Button>}
      />
      <LiveWorkspaceToolbar />
      <LiveDashboardData />
    </>
  );
}
