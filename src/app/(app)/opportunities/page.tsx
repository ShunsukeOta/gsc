import { Sparkles } from 'lucide-react';
import { OpportunityBoard, WorkspaceToolbar } from '@/components/application/workspaces';
import { Button, PageHead } from '@/components/ui';
import { opportunities } from '@/lib/application-data';

export default function OpportunitiesPage() {
  return (
    <>
      <PageHead
        eyebrow="Opportunity intelligence"
        title="改善機会"
        description="順位・CTR・成長・回復・内部リンクのシグナルを統合し、いま実行したときのリターンが大きい候補をOpportunity Score順に整理します。"
        actions={<Button icon={<Sparkles />}>候補を再分析</Button>}
      />
      <WorkspaceToolbar compact />
      <OpportunityBoard items={opportunities} />
    </>
  );
}
