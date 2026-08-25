import { Unlink2 } from 'lucide-react';
import { LiveCannibalizationWorkspace, LiveWorkspaceToolbar } from '@/components/application/live-workspaces';
import { Button, PageHead } from '@/components/ui';

export default function CannibalizationPage() {
  return (
    <>
      <PageHead
        eyebrow="Cannibalization / GSC"
        title="カニバリ分析"
        description="同一クエリで複数URLが表示されている組み合わせをGSCのquery×pageデータから検出し、評価分散の強い候補を優先表示します。"
        actions={<Button icon={<Unlink2 />}>競合URLを再分析</Button>}
      />
      <LiveWorkspaceToolbar compact />
      <LiveCannibalizationWorkspace />
    </>
  );
}
