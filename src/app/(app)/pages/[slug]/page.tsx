import { LivePageDetailWorkspace } from '@/components/application/page-detail-workspace';

export default async function PageDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <LivePageDetailWorkspace slug={slug} />;
}
