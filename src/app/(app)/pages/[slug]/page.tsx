import { LiveGscDetailWorkspace } from '@/components/application/live-analysis-views';

export default async function PageDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <LiveGscDetailWorkspace kind="page" slug={slug} />;
}
