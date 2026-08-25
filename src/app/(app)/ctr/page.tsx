import { Target } from 'lucide-react';
import { SignalExplorer, WorkspaceToolbar } from '@/components/application/workspaces';
import { Button, PageHead } from '@/components/ui';
import { ctrSignals } from '@/lib/application-data';

export default function CtrPage() {
  return (
    <>
      <PageHead
        eyebrow="CTR opportunities"
        title="CTR改善"
        description="掲載順位に対してクリック率が弱い検索結果を抽出し、タイトル・description改善のインパクトが大きい順に確認します。"
        actions={<Button icon={<Target />}>CTR候補を更新</Button>}
      />
      <WorkspaceToolbar compact />
      <SignalExplorer mode="ctr" rows={ctrSignals} />
    </>
  );
}
