import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Card, EmptyState, PageHead } from '@/components/ui';

export default function UnknownSectionPage() {
  return (
    <>
      <PageHead eyebrow="GSC Analyzer" title="ページが見つかりません" description="指定された分析画面は存在しないか、現在のバージョンでは利用できません。" />
      <Card padded={false}><EmptyState title="利用可能な分析画面ではありません" text="サイドバーから分析画面を選択してください。" action={<Link className="ui-button ui-button--secondary ui-button--sm" href="/dashboard"><ArrowLeft />ダッシュボードへ戻る</Link>} /></Card>
    </>
  );
}
