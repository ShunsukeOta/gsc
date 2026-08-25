import { LiveGscDetailWorkspace } from '@/components/application/live-analysis-views';

export default async function QueryDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <LiveGscDetailWorkspace kind="query" slug={slug} />;
}
