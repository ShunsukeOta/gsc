import { Settings } from 'lucide-react';
import { SettingsWorkspace } from '@/components/application/workspaces';
import { Button, PageHead } from '@/components/ui';

export default function SettingsPage() {
  return (
    <>
      <PageHead
        eyebrow="Preferences"
        title="設定"
        description="Search Consoleプロパティ、分析しきい値、通知、データ密度を管理します。Phase 3で認証・保存処理へ接続できる構造です。"
        actions={<Button icon={<Settings />}>変更を保存</Button>}
      />
      <SettingsWorkspace />
    </>
  );
}
