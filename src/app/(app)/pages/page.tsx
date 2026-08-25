import { Download, SlidersHorizontal } from 'lucide-react';
import { PerformanceExplorer, WorkspaceToolbar } from '@/components/application/workspaces';
import { Button, PageHead } from '@/components/ui';
import { pagePerformance } from '@/lib/application-data';

export default function PagesPage() {
  return (
    <>
      <PageHead
        eyebrow="Landing pages"
        title="ページ分析"
        description="URL単位で流入規模・CTR・順位・成長率を比較し、主力ページ、急落ページ、改善余地の大きいページを一度に把握します。"
        actions={<><Button variant="secondary" icon={<Download />}>エクスポート</Button><Button icon={<SlidersHorizontal />}>分析条件</Button></>}
      />
      <WorkspaceToolbar compact />
      <PerformanceExplorer kind="pages" rows={pagePerformance} />
    </>
  );
}
