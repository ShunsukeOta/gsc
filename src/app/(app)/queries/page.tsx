import { Download, SlidersHorizontal } from 'lucide-react';
import { PerformanceExplorer, WorkspaceToolbar } from '@/components/application/workspaces';
import { Button, PageHead } from '@/components/ui';
import { queryPerformance } from '@/lib/application-data';

export default function QueriesPage() {
  return (
    <>
      <PageHead
        eyebrow="Search performance"
        title="クエリ分析"
        description="検索クエリごとのクリック・表示・CTR・順位・変化量を横断し、伸ばすべきクエリと修正すべきクエリを特定します。"
        actions={<><Button variant="secondary" icon={<Download />}>エクスポート</Button><Button icon={<SlidersHorizontal />}>分析条件</Button></>}
      />
      <WorkspaceToolbar compact />
      <PerformanceExplorer kind="queries" rows={queryPerformance} />
    </>
  );
}
