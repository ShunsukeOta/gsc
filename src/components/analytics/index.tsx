'use client';

import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  MoreHorizontal,
  SearchCheck,
  Sparkles,
} from 'lucide-react';
import { Badge, Card, CardHeader, IconButton, Pagination, cx } from '@/components/ui';
import { chartPoints } from '@/lib/mock-data';

export function Trend({ direction, value }: { direction: 'up' | 'down'; value: string }) {
  const Icon = direction === 'up' ? ArrowUpRight : ArrowDownRight;
  return (
    <span className={`trend trend--${direction}`}>
      <Icon aria-hidden="true" />
      {value}
    </span>
  );
}

export function MetricCard({ label, value, change, direction, note }: { label: string; value: string; change: string; direction: 'up' | 'down'; note: string }) {
  return (
    <Card className="metric-card" padded={false}>
      <div className="metric-card__top">
        <span className="metric-card__label">{label}</span>
        <span className="metric-card__icon"><BarChart3 aria-hidden="true" /></span>
      </div>
      <div className="metric-card__value">{value}</div>
      <div className="metric-card__foot">
        <Trend direction={direction} value={change} />
        <span>{note}</span>
      </div>
    </Card>
  );
}

export function PerformanceChart() {
  const points = chartPoints.map(([x, y]) => `${18 + x * 5.1},${18 + y * 2.3}`).join(' ');
  const areaPoints = `18,218 ${points} 630,218`;

  return (
    <Card className="chart-card">
      <CardHeader
        title="クリック数の推移"
        description="過去28日間 / 前期間との比較"
        action={<Badge tone="info">クリック数</Badge>}
      />
      <div className="chart-wrap" aria-label="クリック数の推移グラフ">
        <svg viewBox="0 0 650 235" role="img">
          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4b8ee8" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#4b8ee8" stopOpacity="0.01" />
            </linearGradient>
          </defs>
          {[28, 72, 116, 160, 204].map((y) => <line key={y} x1="18" y1={y} x2="630" y2={y} className="chart-grid-line" />)}
          <polygon points={areaPoints} className="chart-area" />
          <polyline points={points} className="chart-line" />
          <text x="18" y="232" className="chart-label">7/29</text>
          <text x="165" y="232" className="chart-label">8/05</text>
          <text x="315" y="232" className="chart-label">8/12</text>
          <text x="465" y="232" className="chart-label">8/19</text>
          <text x="598" y="232" className="chart-label">8/25</text>
        </svg>
      </div>
    </Card>
  );
}

export function InsightCard({ title, value, meta, action, tone }: { title: string; value: string; meta: string; action: string; tone: 'success' | 'warning' | 'danger' }) {
  return (
    <article className="insight-card">
      <div className="insight-card__head">
        <div className="insight-card__title"><Sparkles aria-hidden="true" />{title}</div>
        <Badge tone={tone}>{tone === 'danger' ? '要確認' : tone === 'warning' ? '中' : '注目'}</Badge>
      </div>
      <div className="insight-card__value">{value}</div>
      <div className="insight-card__meta"><span>{meta}</span><SearchCheck size={12} /></div>
      <div className="insight-card__action">推奨: {action}</div>
    </article>
  );
}

export type QueryRow = {
  query: string;
  clicks: string;
  impressions: string;
  ctr: string;
  position: string;
  change: string;
  priority: string;
};

export function QueryTable({ rows }: { rows: QueryRow[] }) {
  return (
    <Card className="data-card" padded={false}>
      <div style={{ padding: '12px 12px 0' }}>
        <CardHeader
          title="検索クエリ"
          description="パフォーマンスと改善優先度を同じテーブルで確認"
          action={<Badge tone="info">過去28日</Badge>}
        />
      </div>
      <div className="data-table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>クエリ</th>
              <th style={{ textAlign: 'right' }}>クリック</th>
              <th style={{ textAlign: 'right' }}>表示回数</th>
              <th style={{ textAlign: 'right' }}>CTR</th>
              <th style={{ textAlign: 'right' }}>平均順位</th>
              <th>変化</th>
              <th>優先度</th>
              <th aria-label="操作" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const positive = row.change.startsWith('+');
              const tone = row.priority === '高' ? 'danger' : row.priority === '中' ? 'warning' : 'neutral';
              return (
                <tr key={row.query}>
                  <td className="data-table__query">{row.query}</td>
                  <td className="data-table__numeric">{row.clicks}</td>
                  <td className="data-table__numeric">{row.impressions}</td>
                  <td className="data-table__numeric">{row.ctr}</td>
                  <td className="data-table__numeric">{row.position}</td>
                  <td><Trend direction={positive ? 'up' : 'down'} value={row.change} /></td>
                  <td><Badge tone={tone}>{row.priority}</Badge></td>
                  <td><IconButton label={`${row.query}の操作`}><MoreHorizontal size={13} /></IconButton></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="data-card__foot">
        <span>全 325件中 1〜5件を表示</span>
        <Pagination current={1} pages={5} />
      </div>
    </Card>
  );
}

export function MetricGrid({ metrics }: { metrics: Array<{ label: string; value: string; change: string; direction: 'up' | 'down'; note: string }> }) {
  return <div className="metric-grid">{metrics.map((metric) => <MetricCard key={metric.label} {...metric} />)}</div>;
}
