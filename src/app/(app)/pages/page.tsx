import { EmptyAwarePerformanceWorkspace } from '@/components/application/empty-aware-workspaces';
import { LiveWorkspaceToolbar } from '@/components/application/live-workspaces';
import { AnalysisExportButton, UrlNormalizationPanel } from '@/components/application/production-workspaces';
import { AnalysisConditionsButton } from '@/components/application/workspace-actions';
import { PageHead } from '@/components/ui';

export default function PagesPage() {
  return (
    <>
      <PageHead eyebrow="Landing pages / Phase 5" title="ページ分析" description="ウェブ・画像・動画のGSCページURLを安全に正規化して前期間比較し、急落・CTR改善・順位改善候補を横断分析します。" actions={<><AnalysisExportButton dataset="pages" label="CSV出力" /><AnalysisConditionsButton /></>} />
      <LiveWorkspaceToolbar compact />
      <UrlNormalizationPanel compact />
      <EmptyAwarePerformanceWorkspace kind="pages" />
    </>
  );
}
