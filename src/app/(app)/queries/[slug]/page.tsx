import { notFound } from 'next/navigation';
import { ArrowLeft, Download } from 'lucide-react';
import { DetailOverview, WorkspaceToolbar } from '@/components/application/workspaces';
import { Badge, Button, PageHead } from '@/components/ui';
import { pagePerformance, queryPerformance } from '@/lib/application-data';

export default async function QueryDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const row = queryPerformance.find((item) => item.id === slug);
  if (!row) notFound();

  return (
    <>
      <PageHead
        eyebrow="Query detail"
        title={row.label}
        description={`主要ランディングページ: ${row.secondary ?? '-'}。クエリ単位の推移、改善余地、関連ページを詳しく確認します。`}
        actions={<><Button variant="ghost" icon={<ArrowLeft />}>一覧へ戻る</Button><Button variant="secondary" icon={<Download />}>エクスポート</Button></>}
      />
      <div style={{ display: 'flex', gap: 5, marginBottom: 8, flexWrap: 'wrap' }}>{row.tags.map((tag) => <Badge tone="info" key={tag}>{tag}</Badge>)}</div>
      <WorkspaceToolbar compact />
      <DetailOverview row={row} kind="query" related={pagePerformance} />
    </>
  );
}
