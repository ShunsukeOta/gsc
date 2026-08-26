export type Priority = '高' | '中' | '低';
export type TrendDirection = 'up' | 'down' | 'flat';

export type PerformanceRow = {
  id: string;
  label: string;
  secondary?: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
  clickDelta: number;
  impressionDelta: number;
  ctrDelta: number;
  positionDelta: number;
  trend: TrendDirection;
  priority: Priority;
  score: number;
  tags: string[];
  spark: number[];
};

export type Opportunity = {
  id: string;
  type: '順位改善' | 'CTR改善' | '成長' | '回復' | '内部リンク';
  target: string;
  title: string;
  reason: string;
  action: string;
  score: number;
  impact: '大' | '中' | '小';
  effort: '低' | '中' | '高';
  impressions: number;
  position: number;
  delta: number;
};

export type SignalRow = {
  id: string;
  label: string;
  secondary: string;
  primaryMetric: string;
  delta: number;
  position: number;
  ctr: number;
  impressions: number;
  reason: string;
  action: string;
  severity: Priority;
  spark: number[];
};
