import { Download, Play, RefreshCw } from 'lucide-react';
import { InsightCard, MetricGrid, PerformanceChart, QueryTable } from '@/components/analytics';
import { Badge, Button, Card, CardHeader, PageHead, SelectField, Tabs } from '@/components/ui';
import { insights, metrics, queryRows } from '@/lib/mock-data';

export default function DashboardPage() {
  return (
    <>
      <PageHead
        eyebrow="Overview"
        title="ダッシュボード"
        description="検索パフォーマンスの全体像と、次に触るべき改善候補を高密度に確認できます。Phase 1では実データ接続前のUI基盤をダミーデータで検証します。"
        actions={
          <>
            <Button variant="secondary" icon={<Download />}>CSV出力</Button>
            <Button icon={<Play />}>分析開始</Button>
          </>
        }
      />

      <Card className="ds-section">
        <div className="ui-form-grid">
          <SelectField label="プロパティ" defaultValue="site-a">
            <option value="site-a">https://example.com/</option>
            <option value="site-b">https://media.example.com/</option>
          </SelectField>
          <SelectField label="期間" defaultValue="28">
            <option value="28">過去28日間</option>
            <option value="7">過去7日間</option>
            <option value="90">過去3か月</option>
          </SelectField>
        </div>
        <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
          <Tabs items={['すべて', 'モバイル', 'デスクトップ']} />
          <div className="ds-row">
            <Badge tone="success">正常</Badge>
            <span style={{ color: 'var(--c-text-muted)', fontSize: 9 }}>最終同期: 2026/08/25 16:42</span>
            <Button size="sm" variant="ghost" icon={<RefreshCw />}>再同期</Button>
          </div>
        </div>
      </Card>

      <div style={{ marginTop: 10 }}>
        <MetricGrid metrics={metrics} />
      </div>

      <div className="dashboard-grid">
        <PerformanceChart />
        <Card>
          <CardHeader title="改善インサイト" description="優先度の高い変化を自動抽出" action={<Badge tone="info">3件</Badge>} />
          <div className="insight-list">
            {insights.map((insight) => <InsightCard key={insight.title} {...insight} />)}
          </div>
        </Card>
      </div>

      <QueryTable rows={queryRows} />
    </>
  );
}
