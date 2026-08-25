import { TrendingUp } from 'lucide-react';
import { SignalExplorer, WorkspaceToolbar } from '@/components/application/workspaces';
import { Button, PageHead } from '@/components/ui';
import { growthSignals } from '@/lib/application-data';

export default function GrowthPage() {
  return (
    <>
      <PageHead
        eyebrow="Growth signals"
        title="急上昇"
        description="クリック・表示回数・順位が伸び始めたクエリとページを検出し、勢いがあるうちに追加投資する候補をまとめます。"
        actions={<Button icon={<TrendingUp />}>成長シグナル更新</Button>}
      />
      <WorkspaceToolbar compact />
      <SignalExplorer mode="growth" rows={growthSignals} />
    </>
  );
}
