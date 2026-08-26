import { TrendingDown } from 'lucide-react';
import { LiveWorkspaceToolbar } from '@/components/application/live-workspaces';
import { LiveGscSignalWorkspace } from '@/components/application/live-analysis-views';
import { RefreshAnalysisButton } from '@/components/application/workspace-actions';
import { PageHead } from '@/components/ui';

export default function DeclinesPage() {
  return (
    <>
      <PageHead eyebrow="Decline signals / Phase 5" title="急落" description="選択中の検索タイプでクリック減少と順位悪化を検出し、影響の大きい下落から原因確認・回復施策へつなげます。" actions={<RefreshAnalysisButton label="急落を再分析" icon={<TrendingDown />} />} />
      <LiveWorkspaceToolbar compact />
      <LiveGscSignalWorkspace mode="decline" />
    </>
  );
}
