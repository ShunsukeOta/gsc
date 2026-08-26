import { Sparkles } from 'lucide-react';
import { AiOpportunityAssistant } from '@/components/application/ai-opportunity-assistant';
import { AiRewriteWorkspace } from '@/components/application/ai-rewrite';
import { EmptyAwareOpportunityWorkspace } from '@/components/application/empty-aware-workspaces';
import { LiveWorkspaceToolbar } from '@/components/application/live-workspaces';
import { AnalysisExportButton, UrlNormalizationPanel } from '@/components/application/production-workspaces';
import { RefreshAnalysisButton } from '@/components/application/workspace-actions';
import { PageHead } from '@/components/ui';

export default function OpportunitiesPage() {
  return (
    <>
      <PageHead
        eyebrow="Opportunity intelligence / Phase 05-02"
        title="改善機会"
        description="改善候補は各行の「詳しく見る」からAction Drawerを開き、その場でAI本文リライトまで実行できます。下部のAI実リライトは候補を横断して試す補助機能です。"
        actions={<><AnalysisExportButton dataset="opportunities" label="候補CSV" /><RefreshAnalysisButton label="候補を再分析" icon={<Sparkles />} /></>}
      />
      <LiveWorkspaceToolbar compact />
      <UrlNormalizationPanel />
      <EmptyAwareOpportunityWorkspace />
      <AiOpportunityAssistant />
      <AiRewriteWorkspace />
    </>
  );
}
