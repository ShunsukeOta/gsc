import { SlidersHorizontal } from 'lucide-react';
import { EmptyAwarePerformanceWorkspace } from '@/components/application/empty-aware-workspaces';
import { LiveWorkspaceToolbar } from '@/components/application/live-workspaces';
import { AnalysisExportButton, UrlNormalizationPanel } from '@/components/application/production-workspaces';
import { Button, PageHead } from '@/components/ui';

export default function PagesPage() {
  return (
    <>
      <PageHead
        eyebrow="Landing pages / Phase 4"
        title="ページ分析"
        description="GSCのページURLを安全に正規化してから前期間比較し、主力ページ・急落・CTR改善・順位改善候補を横断分析します。"
        actions={<><AnalysisExportButton dataset="pages" label="CSV出力" /><Button icon={<SlidersHorizontal />}>分析条件</Button></>}
      />
      <LiveWorkspaceToolbar compact />
      <UrlNormalizationPanel compact />
      <EmptyAwarePerformanceWorkspace kind="pages" />
    </>
  );
}
