import { RefreshCw } from 'lucide-react';
import { QueryMovementWorkspace } from '@/components/application/query-movement-workspace';
import { LiveWorkspaceToolbar } from '@/components/application/live-workspaces';
import { RefreshAnalysisButton } from '@/components/application/workspace-actions';
import { PageHead } from '@/components/ui';

export default function QueryMovementsPage() {
  return (
    <>
      <PageHead
        eyebrow="Query movement / Phase 06"
        title="クエリ変動"
        description="現期間と前期間のSearch Consoleクエリを比較し、New / Lost Queriesと平均掲載順位のTOP10出入りを検出します。"
        actions={<RefreshAnalysisButton label="変動を再分析" icon={<RefreshCw />} />}
      />
      <LiveWorkspaceToolbar compact />
      <QueryMovementWorkspace />
    </>
  );
}
