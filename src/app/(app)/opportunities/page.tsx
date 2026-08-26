import { Bot, Sparkles } from 'lucide-react';
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
        description="選択中の検索タイプで改善候補を抽出し、GSC数値のAI診断から対象ページ本文を使った実リライトまで同じ画面で進めます。"
        actions={
          <>
            <a className="ui-button ui-button--primary" href="#ai-rewrite"><Bot />AI本文リライト</a>
            <AnalysisExportButton dataset="opportunities" label="候補CSV" />
            <RefreshAnalysisButton label="候補を再分析" icon={<Sparkles />} />
          </>
        }
      />
      <LiveWorkspaceToolbar compact />
      <UrlNormalizationPanel />
      <EmptyAwareOpportunityWorkspace />
      <AiOpportunityAssistant />
      <div id="ai-rewrite" style={{ scrollMarginTop: 76 }}>
        <AiRewriteWorkspace />
      </div>
    </>
  );
}
