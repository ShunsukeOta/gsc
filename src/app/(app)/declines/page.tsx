import { TrendingDown } from 'lucide-react';
import { LiveWorkspaceToolbar } from '@/components/application/live-workspaces';
import { LiveGscSignalWorkspace } from '@/components/application/live-analysis-views';
import { Button, PageHead } from '@/components/ui';

export default function DeclinesPage() {
  return (
    <>
      <PageHead
        eyebrow="Decline signals / GSC"
        title="急落"
        description="クリック減少と順位悪化を前期間比較から検出し、影響の大きい下落から原因確認・回復施策へつなげます。"
        actions={<Button icon={<TrendingDown />}>急落を再分析</Button>}
      />
      <LiveWorkspaceToolbar compact />
      <LiveGscSignalWorkspace mode="decline" />
    </>
  );
}
