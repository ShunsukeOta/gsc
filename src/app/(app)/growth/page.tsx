import { TrendingUp } from 'lucide-react';
import { LiveWorkspaceToolbar } from '@/components/application/live-workspaces';
import { LiveGscSignalWorkspace } from '@/components/application/live-analysis-views';
import { RefreshAnalysisButton } from '@/components/application/workspace-actions';
import { PageHead } from '@/components/ui';

export default function GrowthPage() {
  return (
    <>
      <PageHead eyebrow="Growth signals / Phase 5" title="急上昇" description="選択中の検索タイプで前期間比のクリック成長を検出し、勢いがあるうちに追加投資する候補を整理します。" actions={<RefreshAnalysisButton label="成長シグナル更新" icon={<TrendingUp />} />} />
      <LiveWorkspaceToolbar compact />
      <LiveGscSignalWorkspace mode="growth" />
    </>
  );
}
