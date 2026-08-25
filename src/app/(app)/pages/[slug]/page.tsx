import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Download, ExternalLink } from 'lucide-react';
import { DetailOverview, WorkspaceToolbar } from '@/components/application/workspaces';
import { Badge, Button, PageHead } from '@/components/ui';
import { pagePerformance, queryPerformance } from '@/lib/application-data';

export default async function PageDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const row = pagePerformance.find((item) => item.id === slug);
  if (!row) notFound();
  const liveUrl = `https://example.com${row.label}`;

  return (
    <>
      <PageHead
        eyebrow="Page detail"
        title={row.label}
        description={`${row.secondary ?? ''}。URL単位の検索パフォーマンスと、主要流入クエリ・改善シグナルをまとめて確認します。`}
        actions={<><Link href="/pages" className="ui-button ui-button--ghost" style={{ textDecoration: 'none' }}><ArrowLeft />一覧へ戻る</Link><a href={liveUrl} target="_blank" rel="noreferrer" className="ui-button ui-button--secondary" style={{ textDecoration: 'none' }}><ExternalLink />ページを開く</a><Button variant="secondary" icon={<Download />}>出力</Button></>}
      />
      <div style={{ display: 'flex', gap: 5, marginBottom: 8, flexWrap: 'wrap' }}>{row.tags.map((tag) => <Badge tone="info" key={tag}>{tag}</Badge>)}</div>
      <WorkspaceToolbar compact />
      <DetailOverview row={row} kind="page" related={queryPerformance} />
    </>
  );
}
