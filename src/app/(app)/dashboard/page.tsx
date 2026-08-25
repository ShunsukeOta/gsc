import { Download, Play } from 'lucide-react';
import { InsightCard, MetricGrid, PerformanceChart, QueryTable } from '@/components/analytics';
import { DashboardIntelligence, WorkspaceToolbar } from '@/components/application/workspaces';
import { Badge, Button, Card, CardHeader, PageHead } from '@/components/ui';
import { dashboardMetrics } from '@/lib/application-data';
import { insights, queryRows } from '@/lib/mock-data';

export default function DashboardPage() {
  return (
    <>
      <PageHead
        eyebrow="Overview / Phase 2"
        title="ダッシュボード"
        description="検索パフォーマンスを眺めるだけでなく、今日触るべきSEO改善まで一画面で判断する高密度ダッシュボードです。"
        actions={
          <>
            <Button variant="secondary" icon={<Download />}>CSV出力</Button>
            <Button icon={<Play />}>分析開始</Button>
          </>
        }
      />

      <WorkspaceToolbar />
      <MetricGrid metrics={dashboardMetrics} />

      <div className="dashboard-grid">
        <PerformanceChart />
        <Card>
          <CardHeader title="重要インサイト" description="変化量と改善余地から自動抽出" action={<Badge tone="info">3件</Badge>} />
          <div className="insight-list">{insights.map((insight) => <InsightCard key={insight.title} {...insight} />)}</div>
        </Card>
      </div>

      <DashboardIntelligence />

      <div style={{ marginTop: 10 }}>
        <QueryTable rows={queryRows} />
      </div>
    </>
  );
}
