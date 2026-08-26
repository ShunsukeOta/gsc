import { AiCostSettings } from '@/components/application/ai-cost-settings';
import { LiveSettingsWorkspace } from '@/components/application/live-workspaces';
import { PageHead } from '@/components/ui';

export default function SettingsPage() {
  return (
    <>
      <PageHead
        eyebrow="System / Phase 05-02"
        title="設定"
        description="Google Search Console接続、分析しきい値、通知、AI実行コスト上限を管理します。"
      />
      <LiveSettingsWorkspace />
      <div className="p5-02-settings-extra"><AiCostSettings /></div>
    </>
  );
}
