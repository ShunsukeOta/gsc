import { LiveSettingsWorkspace } from '@/components/application/live-workspaces';
import { PageHead } from '@/components/ui';

export default function SettingsPage() {
  return (
    <>
      <PageHead
        eyebrow="System / Phase 3"
        title="設定"
        description="Google Search Console接続、分析エンジンのしきい値、通知・データ設定を管理します。"
      />
      <LiveSettingsWorkspace />
    </>
  );
}
