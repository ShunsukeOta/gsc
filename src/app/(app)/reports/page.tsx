import { FileDown } from 'lucide-react';
import { DataSourceStatus, LiveWorkspaceToolbar } from '@/components/application/live-workspaces';
import { ReportsWorkspace } from '@/components/application/workspaces';
import { Button, PageHead } from '@/components/ui';

export default function ReportsPage() {
  return (
    <>
      <PageHead
        eyebrow="Reporting / Phase 3"
        title="レポート"
        description="現在のGSC接続・分析条件を確認しながらレポートを構成します。レポート履歴とファイル永続化はPhase 4で本番ストレージへ接続します。"
        actions={<Button variant="secondary" icon={<FileDown />}>一括ダウンロード</Button>}
      />
      <LiveWorkspaceToolbar compact />
      <DataSourceStatus />
      <ReportsWorkspace />
    </>
  );
}
