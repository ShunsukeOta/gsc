import { Sparkles } from 'lucide-react';
import { LiveOpportunityWorkspace, LiveWorkspaceToolbar } from '@/components/application/live-workspaces';
import { Button, PageHead } from '@/components/ui';

export default function OpportunitiesPage() {
  return (
    <>
      <PageHead
        eyebrow="Opportunity intelligence / GSC"
        title="改善機会"
        description="検索需要・順位帯・自サイトCTR基準・期間変化・リスクを統合し、実データからOpportunity Scoreを算出します。"
        actions={<Button icon={<Sparkles />}>候補を再分析</Button>}
      />
      <LiveWorkspaceToolbar compact />
      <LiveOpportunityWorkspace />
    </>
  );
}
