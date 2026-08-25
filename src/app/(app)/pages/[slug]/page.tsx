import { notFound } from 'next/navigation';
import { ArrowLeft, Download, ExternalLink } from 'lucide-react';
import { DetailOverview, WorkspaceToolbar } from '@/components/application/workspaces';
import { Badge, Button, PageHead } from '@/components/ui';
import { pagePerformance, queryPerformance } from '@/lib/application-data';

export default async function PageDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const row = pagePerformance.find((item) => item.id === slug);
  if (!row) notFound();

  return (
    <>
      <PageHead
        eyebrow="Page detail"
        title={row.label}
        description={`${row.secondary ?? ''}。URL単位の検索パフォーマンスと、主要流入クエリ・改善シグナルをまとめて確認します。`}
        actions={<><Button variant="ghost" icon={<ArrowLeft />}>一覧へ戻る</Button><Button variant="secondary" icon={<ExternalLink />}>ページを開く</Button><Button variant="secondary" icon={<Download />}>出力</Button></>}
      />
      <div style={{ display: 'flex', gap: 5, marginBottom: 8, flexWrap: 'wrap' }}>{row.tags.map((tag) => <Badge tone="info" key={tag}>{tag}</Badge>)}</div>
      <WorkspaceToolbar compact />
      <DetailOverview row={row} kind="page" related={queryPerformance} />
    </>
  );
}
