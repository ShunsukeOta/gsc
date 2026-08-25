import { Download, SlidersHorizontal } from 'lucide-react';
import { EmptyAwarePerformanceWorkspace } from '@/components/application/empty-aware-workspaces';
import { LiveWorkspaceToolbar } from '@/components/application/live-workspaces';
import { Button, PageHead } from '@/components/ui';

export default function PagesPage() {
  return (
    <>
      <PageHead
        eyebrow="Landing pages / GSC"
        title="ページ分析"
        description="GSCのページデータを前期間と比較し、主力ページ・急落ページ・CTR改善・順位改善候補を実データで横断分析します。"
        actions={<><Button variant="secondary" icon={<Download />}>エクスポート</Button><Button icon={<SlidersHorizontal />}>分析条件</Button></>}
      />
      <LiveWorkspaceToolbar compact />
      <EmptyAwarePerformanceWorkspace kind="pages" />
    </>
  );
}
