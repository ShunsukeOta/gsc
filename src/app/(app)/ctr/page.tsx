import { Target } from 'lucide-react';
import { LiveWorkspaceToolbar } from '@/components/application/live-workspaces';
import { LiveGscSignalWorkspace } from '@/components/application/live-analysis-views';
import { RefreshAnalysisButton } from '@/components/application/workspace-actions';
import { PageHead } from '@/components/ui';

export default function CtrPage() {
  return (
    <>
      <PageHead eyebrow="CTR opportunities / Phase 5" title="CTR改善" description="選択中の検索タイプで同順位帯の自サイト実績をCTR基準として算出し、掲載順位の割にクリックされていない候補を抽出します。" actions={<RefreshAnalysisButton label="CTR候補を再分析" icon={<Target />} />} />
      <LiveWorkspaceToolbar compact />
      <LiveGscSignalWorkspace mode="ctr" />
    </>
  );
}
