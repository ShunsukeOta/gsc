import { EmptyAwareOpportunityWorkspace } from '@/components/application/empty-aware-workspaces';
import { LiveWorkspaceToolbar } from '@/components/application/live-workspaces';
import { AnalysisExportButton, UrlNormalizationPanel } from '@/components/application/production-workspaces';
import { PageHead } from '@/components/ui';

export default function OpportunitiesPage() {
  return (
    <>
      <PageHead
        eyebrow="Opportunity intelligence / Phase 4"
        title="改善機会"
        description="URLフラグメントを同一ページへ正規化したうえで、検索需要・順位帯・自サイトCTR基準・期間変化を統合してOpportunity Scoreを算出します。"
        actions={<AnalysisExportButton dataset="opportunities" label="候補CSV" />}
      />
      <LiveWorkspaceToolbar compact />
      <UrlNormalizationPanel />
      <EmptyAwareOpportunityWorkspace />
    </>
  );
}
