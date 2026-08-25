'use client';

import { usePathname } from 'next/navigation';
import { Construction } from 'lucide-react';
import { Button, Card, EmptyState, PageHead } from '@/components/ui';

const labels: Record<string, { title: string; description: string }> = {
  queries: { title: 'クエリ分析', description: '検索クエリ単位の伸び・下落・CTR・順位改善機会を分析します。' },
  pages: { title: 'ページ分析', description: 'URL単位の流入クエリとパフォーマンス変化を分析します。' },
  opportunities: { title: '改善機会', description: '11〜20位、CTR低迷、伸び始めなどの改善候補を優先度順に整理します。' },
  growth: { title: '急上昇', description: '直近期間で成長しているクエリとページを検出します。' },
  declines: { title: '急落', description: 'クリック・表示回数・順位・CTRの急激な低下を検出します。' },
  ctr: { title: 'CTR改善', description: '掲載順位に対してCTRが弱いクエリとページを抽出します。' },
  reports: { title: 'レポート', description: '期間比較や改善候補をレポートとして整理・出力します。' },
  settings: { title: '設定', description: 'GSC接続、プロパティ、表示、分析条件を管理します。' },
};

export default function PhasePlaceholderPage() {
  const pathname = usePathname();
  const key = pathname.split('/').filter(Boolean)[0] ?? '';
  const content = labels[key] ?? { title: '分析', description: 'この画面はPhase 2以降で実装します。' };

  return (
    <>
      <PageHead eyebrow="Phase 2" title={content.title} description={content.description} />
      <Card padded={false}>
        <EmptyState
          title="画面骨格は準備済みです"
          text="Phase 1では共通UIとレスポンシブ基盤を優先しています。Phase 2でこの画面をダミーデータ込みで完成させます。"
          action={<Button variant="secondary" size="sm" icon={<Construction />}>Phase 2で実装</Button>}
        />
      </Card>
    </>
  );
}
