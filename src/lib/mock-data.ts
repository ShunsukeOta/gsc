export const metrics = [
  { label: '合計クリック数', value: '24,531', change: '+12.5%', direction: 'up' as const, note: '前期間比' },
  { label: '合計表示回数', value: '1,245,345', change: '+8.3%', direction: 'up' as const, note: '前期間比' },
  { label: '平均CTR', value: '1.97%', change: '+0.25pt', direction: 'up' as const, note: '前期間比' },
  { label: '平均掲載順位', value: '12.4', change: '-1.2', direction: 'down' as const, note: '順位変化' },
];

export const insights = [
  { title: '急上昇クエリ', value: '18件', meta: '最大 +124%', action: '見出し追加を検討', tone: 'success' as const },
  { title: '急落ページ', value: '7件', meta: '最大 -45%', action: '内容更新を優先', tone: 'danger' as const },
  { title: '11〜20位', value: '42件', meta: '表示回数 84,210', action: 'タイトル・内部リンク改善', tone: 'warning' as const },
];

export const queryRows = [
  { query: 'search console 分析', clicks: '1,234', impressions: '45,678', ctr: '2.70%', position: '8.3', change: '+2.1', priority: '高' },
  { query: 'サーチコンソール 使い方', clicks: '987', impressions: '38,765', ctr: '2.55%', position: '9.1', change: '+1.3', priority: '高' },
  { query: '検索パフォーマンス 改善', clicks: '654', impressions: '25,432', ctr: '2.57%', position: '11.6', change: '-0.5', priority: '中' },
  { query: 'クエリ 分析 方法', clicks: '432', impressions: '18,765', ctr: '2.30%', position: '13.4', change: '+0.8', priority: '中' },
  { query: 'search console レポート', clicks: '321', impressions: '12,345', ctr: '2.60%', position: '14.1', change: '-0.7', priority: '低' },
];

export const chartPoints = [
  [0, 72], [8, 67], [16, 74], [24, 61], [32, 66], [40, 50], [48, 57], [56, 43],
  [64, 51], [72, 46], [80, 52], [88, 35], [96, 41], [104, 30], [112, 36], [120, 24],
];
