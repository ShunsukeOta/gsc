import { Download, SlidersHorizontal } from 'lucide-react';
import { EmptyAwarePerformanceWorkspace } from '@/components/application/empty-aware-workspaces';
import { LiveWorkspaceToolbar } from '@/components/application/live-workspaces';
import { Button, PageHead } from '@/components/ui';

export default function QueriesPage() {
  return (
    <>
      <PageHead
        eyebrow="Search performance / GSC"
        title="クエリ分析"
        description="GSCのクエリデータを前期間と比較し、クリック・表示・CTR・順位・Opportunity Scoreを同じテーブルで分析します。"
        actions={<><Button variant="secondary" icon={<Download />}>エクスポート</Button><Button icon={<SlidersHorizontal />}>分析条件</Button></>}
      />
      <LiveWorkspaceToolbar compact />
      <EmptyAwarePerformanceWorkspace kind="queries" />
    </>
  );
}
