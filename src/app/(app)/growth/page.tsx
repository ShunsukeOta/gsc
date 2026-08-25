import { TrendingUp } from 'lucide-react';
import { LiveWorkspaceToolbar } from '@/components/application/live-workspaces';
import { LiveGscSignalWorkspace } from '@/components/application/live-analysis-views';
import { Button, PageHead } from '@/components/ui';

export default function GrowthPage() {
  return (
    <>
      <PageHead
        eyebrow="Growth signals / GSC"
        title="急上昇"
        description="前期間比でクリックが伸びたクエリ・ページを実GSCデータから検出し、勢いがあるうちに追加投資する候補を整理します。"
        actions={<Button icon={<TrendingUp />}>成長シグナル更新</Button>}
      />
      <LiveWorkspaceToolbar compact />
      <LiveGscSignalWorkspace mode="growth" />
    </>
  );
}
