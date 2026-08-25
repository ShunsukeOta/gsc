import { AlertTriangle } from 'lucide-react';
import { SignalExplorer, WorkspaceToolbar } from '@/components/application/workspaces';
import { Button, PageHead } from '@/components/ui';
import { declineSignals } from '@/lib/application-data';

export default function DeclinesPage() {
  return (
    <>
      <PageHead
        eyebrow="Decline monitoring"
        title="急落"
        description="クリック減少を順位・CTR・需要の変化へ分解して、影響の大きい下落から調査できる監視画面です。"
        actions={<Button icon={<AlertTriangle />}>急落を再検出</Button>}
      />
      <WorkspaceToolbar compact />
      <SignalExplorer mode="decline" rows={declineSignals} />
    </>
  );
}
