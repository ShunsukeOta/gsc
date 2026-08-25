import { FileDown } from 'lucide-react';
import { ReportsWorkspace } from '@/components/application/workspaces';
import { Button, PageHead } from '@/components/ui';

export default function ReportsPage() {
  return (
    <>
      <PageHead
        eyebrow="Reporting"
        title="レポート"
        description="分析結果を共有・保存するためのレポート生成画面です。Phase 2では生成モーダル、履歴、予約設定までUXを完成させます。"
        actions={<Button variant="secondary" icon={<FileDown />}>一括ダウンロード</Button>}
      />
      <ReportsWorkspace />
    </>
  );
}
