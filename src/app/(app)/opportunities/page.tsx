import { Sparkles } from 'lucide-react';
import { AiOpportunityAssistant } from '@/components/application/ai-opportunity-assistant';
import { EmptyAwareOpportunityWorkspace } from '@/components/application/empty-aware-workspaces';
import { LiveWorkspaceToolbar } from '@/components/application/live-workspaces';
import { AnalysisExportButton, UrlNormalizationPanel } from '@/components/application/production-workspaces';
import { RefreshAnalysisButton } from '@/components/application/workspace-actions';
import { PageHead } from '@/components/ui';

export default function OpportunitiesPage() {
  return (
    <>
      <PageHead eyebrow="Opportunity intelligence / Phase 5" title="改善機会" description="選択中の検索タイプでURLフラグメントを同一ページへ正規化し、需要・順位帯・自サイトCTR基準・期間変化を統合してOpportunity Scoreを算出します。" actions={<><AnalysisExportButton dataset="opportunities" label="候補CSV" /><RefreshAnalysisButton label="候補を再分析" icon={<Sparkles />} /></>} />
      <LiveWorkspaceToolbar compact />
      <UrlNormalizationPanel />
      <EmptyAwareOpportunityWorkspace />
      <AiOpportunityAssistant />
    </>
  );
}
