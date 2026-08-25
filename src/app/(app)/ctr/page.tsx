import { Target } from 'lucide-react';
import { LiveWorkspaceToolbar } from '@/components/application/live-workspaces';
import { LiveGscSignalWorkspace } from '@/components/application/live-analysis-views';
import { Button, PageHead } from '@/components/ui';

export default function CtrPage() {
  return (
    <>
      <PageHead
        eyebrow="CTR opportunities / GSC"
        title="CTR改善"
        description="同じ順位帯の自サイト実績をCTR基準として算出し、掲載順位の割にクリックされていないクエリ・ページを抽出します。"
        actions={<Button icon={<Target />}>CTR候補を再分析</Button>}
      />
      <LiveWorkspaceToolbar compact />
      <LiveGscSignalWorkspace mode="ctr" />
    </>
  );
}
