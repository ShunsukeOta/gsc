import { Unlink2 } from 'lucide-react';
import { CannibalizationExplorer, WorkspaceToolbar } from '@/components/application/workspaces';
import { Badge, Button, Card, PageHead } from '@/components/ui';
import { cannibalizationGroups } from '@/lib/application-data';

export default function CannibalizationPage() {
  return (
    <>
      <PageHead
        eyebrow="Keyword overlap"
        title="カニバリ分析"
        description="同一クエリで複数URLが競合している状態を検出し、統合・役割分担・内部リンク調整の判断材料をまとめます。"
        actions={<Button icon={<Unlink2 />}>重複を再検出</Button>}
      />
      <WorkspaceToolbar compact />
      <div className="p2-opportunity-summary">
        <div><Unlink2 /><span>競合クエリ</span><strong>{cannibalizationGroups.length}</strong><small>groups</small></div>
        <div><Unlink2 /><span>高優先度</span><strong>{cannibalizationGroups.filter((item) => item.priority === '高').length}</strong><small>groups</small></div>
        <div><Unlink2 /><span>競合URL</span><strong>{cannibalizationGroups.reduce((sum, item) => sum + item.pages.length, 0)}</strong><small>URLs</small></div>
        <div><Unlink2 /><span>平均重複度</span><strong>{Math.round(cannibalizationGroups.reduce((sum, item) => sum + item.overlap, 0) / cannibalizationGroups.length)}</strong><small>%</small></div>
      </div>
      <Card><div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}><Badge tone="info">判定</Badge><span style={{ fontSize: 9, color: 'var(--c-text-sub)' }}>同一クエリへの複数URL露出・クリックシェア・順位近接度からダミー重複度を算出しています。</span></div></Card>
      <CannibalizationExplorer groups={cannibalizationGroups} />
    </>
  );
}
