// Development-only fixtures for /design-system.
// Production application screens must never import this module.
export const designMetrics = [
  { label: '合計クリック数', value: '24,531', change: '+12.5%', direction: 'up' as const, note: 'サンプル' },
  { label: '合計表示回数', value: '1,245,345', change: '+8.3%', direction: 'up' as const, note: 'サンプル' },
  { label: '平均CTR', value: '1.97%', change: '+0.25pt', direction: 'up' as const, note: 'サンプル' },
  { label: '平均掲載順位', value: '12.4', change: '-1.2', direction: 'down' as const, note: 'サンプル' },
];

export const designQueryRows = [
  { query: 'search console 分析', clicks: '1,234', impressions: '45,678', ctr: '2.70%', position: '8.3', change: '+2.1', priority: '高' },
  { query: 'サーチコンソール 使い方', clicks: '987', impressions: '38,765', ctr: '2.55%', position: '9.1', change: '+1.3', priority: '高' },
  { query: '検索パフォーマンス 改善', clicks: '654', impressions: '25,432', ctr: '2.57%', position: '11.6', change: '-0.5', priority: '中' },
  { query: 'クエリ 分析 方法', clicks: '432', impressions: '18,765', ctr: '2.30%', position: '13.4', change: '+0.8', priority: '中' },
  { query: 'search console レポート', clicks: '321', impressions: '12,345', ctr: '2.60%', position: '14.1', change: '-0.7', priority: '低' },
];
