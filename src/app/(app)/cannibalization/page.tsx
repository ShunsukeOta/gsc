import { Unlink2 } from 'lucide-react';
import { LiveCannibalizationWorkspace, LiveWorkspaceToolbar } from '@/components/application/live-workspaces';
import { RefreshAnalysisButton } from '@/components/application/workspace-actions';
import { PageHead } from '@/components/ui';

export default function CannibalizationPage() {
  return (
    <>
      <PageHead eyebrow="Cannibalization / Phase 5" title="カニバリ分析" description="選択中の検索タイプで同一クエリに複数URLが表示される組み合わせをquery × pageデータから検出し、評価分散の強い候補を優先表示します。" actions={<RefreshAnalysisButton label="競合URLを再分析" icon={<Unlink2 />} />} />
      <LiveWorkspaceToolbar compact />
      <LiveCannibalizationWorkspace />
    </>
  );
}
