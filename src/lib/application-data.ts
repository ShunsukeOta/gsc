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

export const properties = [
  { id: 'site-1', label: 'https://example.com/', status: '正常', pages: 428, lastSync: '2026/08/25 17:02' },
  { id: 'site-2', label: 'https://media.example.com/', status: '正常', pages: 215, lastSync: '2026/08/25 16:58' },
  { id: 'site-3', label: 'sc-domain:example.jp', status: '要確認', pages: 91, lastSync: '2026/08/25 16:41' },
];

export const dashboardMetrics = [
  { label: '合計クリック数', value: '24,531', change: '+12.5%', direction: 'up' as const, note: '前28日比' },
  { label: '合計表示回数', value: '1,245,345', change: '+8.3%', direction: 'up' as const, note: '前28日比' },
  { label: '平均CTR', value: '1.97%', change: '+0.25pt', direction: 'up' as const, note: '前28日比' },
  { label: '平均掲載順位', value: '12.4', change: '-1.2', direction: 'down' as const, note: '順位は改善' },
];

export const queryPerformance: PerformanceRow[] = [
  { id: 'q01', label: 'search console 分析', secondary: '/guide/search-console-analysis', clicks: 1234, impressions: 45678, ctr: 2.70, position: 8.3, clickDelta: 22.4, impressionDelta: 18.2, ctrDelta: 0.09, positionDelta: -2.1, trend: 'up', priority: '高', score: 94, tags: ['成長', '高需要'], spark: [18,22,21,28,30,34,33,42,47,52,58,61] },
  { id: 'q02', label: 'サーチコンソール 使い方', secondary: '/guide/gsc-basic', clicks: 987, impressions: 38765, ctr: 2.55, position: 9.1, clickDelta: 14.7, impressionDelta: 11.4, ctrDelta: 0.07, positionDelta: -1.3, trend: 'up', priority: '高', score: 91, tags: ['順位改善', '定番'], spark: [28,30,29,31,35,38,41,40,45,49,51,56] },
  { id: 'q03', label: '検索パフォーマンス 改善', secondary: '/seo/performance-improvement', clicks: 654, impressions: 25432, ctr: 2.57, position: 11.6, clickDelta: -4.2, impressionDelta: 8.1, ctrDelta: -0.33, positionDelta: 0.5, trend: 'down', priority: '高', score: 88, tags: ['CTR改善', '11〜20位'], spark: [48,51,55,54,52,49,47,46,44,43,42,41] },
  { id: 'q04', label: 'クエリ 分析 方法', secondary: '/guide/query-analysis', clicks: 432, impressions: 18765, ctr: 2.30, position: 13.4, clickDelta: 9.6, impressionDelta: 16.8, ctrDelta: -0.14, positionDelta: -0.8, trend: 'up', priority: '中', score: 82, tags: ['11〜20位', '成長'], spark: [20,19,24,25,27,30,31,35,33,38,42,46] },
  { id: 'q05', label: 'search console レポート', secondary: '/guide/gsc-report', clicks: 321, impressions: 12345, ctr: 2.60, position: 14.1, clickDelta: -7.1, impressionDelta: -1.2, ctrDelta: -0.18, positionDelta: 0.7, trend: 'down', priority: '中', score: 77, tags: ['回復候補'], spark: [44,43,45,42,40,38,39,36,34,35,32,31] },
  { id: 'q06', label: 'SEO リライト 優先順位', secondary: '/seo/rewrite-priority', clicks: 288, impressions: 21408, ctr: 1.35, position: 7.2, clickDelta: 3.8, impressionDelta: 24.6, ctrDelta: -0.28, positionDelta: -0.4, trend: 'up', priority: '高', score: 93, tags: ['CTR改善', '高需要'], spark: [23,27,25,31,33,36,35,39,41,43,46,48] },
  { id: 'q07', label: 'SEO 順位 上げる', secondary: '/seo/rank-up', clicks: 247, impressions: 19840, ctr: 1.24, position: 15.8, clickDelta: 18.9, impressionDelta: 21.0, ctrDelta: -0.02, positionDelta: -1.8, trend: 'up', priority: '高', score: 90, tags: ['11〜20位', '高需要'], spark: [17,20,19,24,27,29,35,37,40,44,50,54] },
  { id: 'q08', label: 'Google 検索 順位 確認', secondary: '/tools/rank-check', clicks: 221, impressions: 14022, ctr: 1.58, position: 6.4, clickDelta: -16.8, impressionDelta: -6.3, ctrDelta: -0.20, positionDelta: 1.9, trend: 'down', priority: '高', score: 89, tags: ['急落', '回復候補'], spark: [58,55,57,52,50,47,44,42,40,38,36,34] },
  { id: 'q09', label: '内部リンク SEO 効果', secondary: '/seo/internal-links', clicks: 198, impressions: 9875, ctr: 2.01, position: 12.9, clickDelta: 31.2, impressionDelta: 34.8, ctrDelta: -0.05, positionDelta: -2.3, trend: 'up', priority: '中', score: 84, tags: ['急上昇', '11〜20位'], spark: [12,14,17,19,24,28,31,35,39,44,49,55] },
  { id: 'q10', label: 'メタディスクリプション CTR', secondary: '/seo/meta-description', clicks: 167, impressions: 15211, ctr: 1.10, position: 5.8, clickDelta: 2.1, impressionDelta: 15.3, ctrDelta: -0.15, positionDelta: -0.2, trend: 'flat', priority: '高', score: 92, tags: ['CTR改善'], spark: [31,30,32,33,31,34,35,36,35,37,36,38] },
  { id: 'q11', label: 'SEO カニバリ', secondary: '/seo/cannibalization', clicks: 142, impressions: 8112, ctr: 1.75, position: 17.2, clickDelta: -9.4, impressionDelta: 4.6, ctrDelta: -0.27, positionDelta: 1.1, trend: 'down', priority: '中', score: 80, tags: ['カニバリ', '11〜20位'], spark: [39,41,40,38,37,35,36,34,32,33,31,30] },
  { id: 'q12', label: '検索意図 分析', secondary: '/seo/search-intent', clicks: 128, impressions: 7324, ctr: 1.75, position: 18.6, clickDelta: 42.7, impressionDelta: 38.4, ctrDelta: 0.05, positionDelta: -3.1, trend: 'up', priority: '中', score: 86, tags: ['急上昇', '11〜20位'], spark: [10,12,15,14,19,23,29,34,40,46,53,61] },
];

export const pagePerformance: PerformanceRow[] = [
  { id: 'p01', label: '/guide/search-console-analysis', secondary: 'Search Console分析の完全ガイド', clicks: 3640, impressions: 128400, ctr: 2.83, position: 7.6, clickDelta: 19.2, impressionDelta: 14.1, ctrDelta: 0.12, positionDelta: -1.4, trend: 'up', priority: '高', score: 96, tags: ['主力', '成長'], spark: [30,34,35,39,43,47,46,51,55,59,64,68] },
  { id: 'p02', label: '/seo/rewrite-priority', secondary: 'SEOリライトの優先順位を決める方法', clicks: 2114, impressions: 96420, ctr: 2.19, position: 9.8, clickDelta: 8.4, impressionDelta: 22.7, ctrDelta: -0.29, positionDelta: -0.6, trend: 'up', priority: '高', score: 93, tags: ['CTR改善', '高需要'], spark: [25,28,31,32,36,38,40,43,45,48,51,54] },
  { id: 'p03', label: '/tools/rank-check', secondary: '検索順位チェックの使い方', clicks: 1798, impressions: 74430, ctr: 2.42, position: 5.9, clickDelta: -21.4, impressionDelta: -9.5, ctrDelta: -0.37, positionDelta: 2.4, trend: 'down', priority: '高', score: 95, tags: ['急落', '回復候補'], spark: [66,64,62,59,55,52,49,45,43,40,37,35] },
  { id: 'p04', label: '/seo/internal-links', secondary: '内部リンク設計でSEOを強くする', clicks: 1520, impressions: 68210, ctr: 2.23, position: 12.3, clickDelta: 28.8, impressionDelta: 32.2, ctrDelta: -0.06, positionDelta: -2.8, trend: 'up', priority: '高', score: 91, tags: ['急上昇', '11〜20位'], spark: [18,21,25,29,33,36,41,46,51,57,62,68] },
  { id: 'p05', label: '/seo/meta-description', secondary: 'メタディスクリプション改善ガイド', clicks: 1228, impressions: 80120, ctr: 1.53, position: 6.1, clickDelta: 4.1, impressionDelta: 17.6, ctrDelta: -0.21, positionDelta: -0.3, trend: 'flat', priority: '高', score: 90, tags: ['CTR改善'], spark: [33,35,34,36,37,38,37,39,41,40,42,43] },
  { id: 'p06', label: '/guide/query-analysis', secondary: '検索クエリ分析の実践手順', clicks: 980, impressions: 54200, ctr: 1.81, position: 13.7, clickDelta: 13.6, impressionDelta: 19.4, ctrDelta: -0.09, positionDelta: -1.1, trend: 'up', priority: '中', score: 83, tags: ['11〜20位'], spark: [24,27,26,30,32,35,36,38,41,45,47,50] },
  { id: 'p07', label: '/seo/search-intent', secondary: '検索意図の読み解き方', clicks: 864, impressions: 45110, ctr: 1.92, position: 16.4, clickDelta: 45.2, impressionDelta: 41.7, ctrDelta: 0.04, positionDelta: -3.4, trend: 'up', priority: '高', score: 92, tags: ['急上昇', '11〜20位'], spark: [12,15,18,22,27,31,36,42,48,55,63,70] },
  { id: 'p08', label: '/seo/cannibalization', secondary: 'SEOカニバリゼーションの見つけ方', clicks: 640, impressions: 33240, ctr: 1.93, position: 17.8, clickDelta: -8.7, impressionDelta: 6.2, ctrDelta: -0.32, positionDelta: 1.3, trend: 'down', priority: '中', score: 79, tags: ['カニバリ'], spark: [46,44,45,42,40,41,38,36,37,34,33,31] },
  { id: 'p09', label: '/blog/old-seo-checklist', secondary: 'SEOチェックリスト2024', clicks: 418, impressions: 30220, ctr: 1.38, position: 19.6, clickDelta: -38.9, impressionDelta: -24.4, ctrDelta: -0.31, positionDelta: 4.8, trend: 'down', priority: '高', score: 87, tags: ['急落', '古い記事'], spark: [72,68,65,61,57,52,47,43,39,35,31,28] },
  { id: 'p10', label: '/seo/title-optimization', secondary: 'SEOタイトル最適化', clicks: 392, impressions: 28110, ctr: 1.39, position: 4.7, clickDelta: 1.8, impressionDelta: 18.7, ctrDelta: -0.24, positionDelta: -0.1, trend: 'flat', priority: '高', score: 94, tags: ['CTR改善'], spark: [35,34,36,35,37,36,38,39,38,40,41,40] },
];

export const opportunities: Opportunity[] = [
  { id: 'o01', type: '順位改善', target: '/seo/internal-links', title: '11〜20位からTOP10へ押し上げ', reason: '表示回数68,210、平均順位12.3。直近28日で順位が2.8改善し、上昇モメンタムがあります。', action: '関連3記事から内部リンクを追加し、見出し構造を検索意図に合わせて補強', score: 97, impact: '大', effort: '低', impressions: 68210, position: 12.3, delta: 28.8 },
  { id: 'o02', type: 'CTR改善', target: '/seo/title-optimization', title: '上位表示済みなのにCTRが弱い', reason: '平均順位4.7に対してCTR1.39%。同順位帯の期待CTRを大きく下回っています。', action: 'タイトルのベネフィット・数字・検索意図一致度を再設計', score: 96, impact: '大', effort: '低', impressions: 28110, position: 4.7, delta: 1.8 },
  { id: 'o03', type: 'CTR改善', target: 'SEO リライト 優先順位', title: '需要増にCTRが追いついていない', reason: '表示回数+24.6%に対しCTRは-0.28pt。露出増をクリックへ変換できていません。', action: 'SERP競合のタイトル差分を確認し、タイトルとdescriptionを更新', score: 94, impact: '大', effort: '低', impressions: 21408, position: 7.2, delta: 3.8 },
  { id: 'o04', type: '成長', target: '/seo/search-intent', title: '急成長ページをさらに伸ばす', reason: 'クリック+45.2%、表示回数+41.7%、順位-3.4。テーマ需要と評価が同時に伸びています。', action: '関連クエリを追加し、ハブページから内部リンクを集中', score: 92, impact: '大', effort: '中', impressions: 45110, position: 16.4, delta: 45.2 },
  { id: 'o05', type: '回復', target: '/tools/rank-check', title: '主力ページの順位急落を回復', reason: 'クリック-21.4%、平均順位5.9。前期間から2.4順位悪化しています。', action: 'SERP変化・競合更新・コンテンツ鮮度を確認し、重要セクションを再編集', score: 91, impact: '大', effort: '中', impressions: 74430, position: 5.9, delta: -21.4 },
  { id: 'o06', type: '内部リンク', target: '/guide/query-analysis', title: '13位台の解説記事へ評価を集める', reason: '平均順位13.7、表示回数54,200。内部リンク追加だけでも伸びしろが大きい領域です。', action: 'Search Console関連記事4本から文脈リンクを追加', score: 88, impact: '中', effort: '低', impressions: 54200, position: 13.7, delta: 13.6 },
  { id: 'o07', type: '順位改善', target: 'SEO 順位 上げる', title: '高需要クエリが15.8位まで上昇', reason: '表示回数19,840、クリック+18.9%。TOP10到達時の増分が大きいクエリです。', action: '検索意図不足のH2を2つ追加し、一次情報を増補', score: 87, impact: '大', effort: '中', impressions: 19840, position: 15.8, delta: 18.9 },
  { id: 'o08', type: '回復', target: '/blog/old-seo-checklist', title: '旧記事の大幅下落を回復', reason: 'クリック-38.9%、順位+4.8。公開年が古く、SERPの最新性要求とズレています。', action: '2026年版へ全面更新し、古いツール・手順を置換', score: 85, impact: '中', effort: '高', impressions: 30220, position: 19.6, delta: -38.9 },
];

export const growthSignals: SignalRow[] = [
  { id: 'g01', label: '検索意図 分析', secondary: '/seo/search-intent', primaryMetric: '+42.7% clicks', delta: 42.7, position: 18.6, ctr: 1.75, impressions: 7324, reason: '表示回数と順位が同時に改善', action: '関連クエリを追記', severity: '高', spark: [10,12,15,14,19,23,29,34,40,46,53,61] },
  { id: 'g02', label: '内部リンク SEO 効果', secondary: '/seo/internal-links', primaryMetric: '+31.2% clicks', delta: 31.2, position: 12.9, ctr: 2.01, impressions: 9875, reason: '順位が2.3改善し露出も増加', action: '内部リンクを追加', severity: '高', spark: [12,14,17,19,24,28,31,35,39,44,49,55] },
  { id: 'g03', label: 'search console 分析', secondary: '/guide/search-console-analysis', primaryMetric: '+22.4% clicks', delta: 22.4, position: 8.3, ctr: 2.70, impressions: 45678, reason: 'TOP10内で表示回数が増加', action: '派生テーマを拡張', severity: '中', spark: [18,22,21,28,30,34,33,42,47,52,58,61] },
  { id: 'g04', label: 'SEO 順位 上げる', secondary: '/seo/rank-up', primaryMetric: '+18.9% clicks', delta: 18.9, position: 15.8, ctr: 1.24, impressions: 19840, reason: '15位台まで上昇、需要も増加', action: 'TOP10施策を優先', severity: '高', spark: [17,20,19,24,27,29,35,37,40,44,50,54] },
];

export const declineSignals: SignalRow[] = [
  { id: 'd01', label: '/blog/old-seo-checklist', secondary: 'SEOチェックリスト2024', primaryMetric: '-38.9% clicks', delta: -38.9, position: 19.6, ctr: 1.38, impressions: 30220, reason: '順位4.8悪化 + 表示回数24.4%減', action: '全面リライト', severity: '高', spark: [72,68,65,61,57,52,47,43,39,35,31,28] },
  { id: 'd02', label: '/tools/rank-check', secondary: '検索順位チェックの使い方', primaryMetric: '-21.4% clicks', delta: -21.4, position: 5.9, ctr: 2.42, impressions: 74430, reason: '順位が2.4悪化しCTRも低下', action: 'SERP差分を確認', severity: '高', spark: [66,64,62,59,55,52,49,45,43,40,37,35] },
  { id: 'd03', label: 'Google 検索 順位 確認', secondary: '/tools/rank-check', primaryMetric: '-16.8% clicks', delta: -16.8, position: 6.4, ctr: 1.58, impressions: 14022, reason: 'ページ下落の影響を直接受けている', action: 'クエリ意図を再確認', severity: '高', spark: [58,55,57,52,50,47,44,42,40,38,36,34] },
  { id: 'd04', label: 'SEO カニバリ', secondary: '/seo/cannibalization', primaryMetric: '-9.4% clicks', delta: -9.4, position: 17.2, ctr: 1.75, impressions: 8112, reason: '複数URLへ評価が分散', action: '競合URLを統合', severity: '中', spark: [39,41,40,38,37,35,36,34,32,33,31,30] },
];

export const ctrSignals: SignalRow[] = [
  { id: 'c01', label: 'メタディスクリプション CTR', secondary: '/seo/meta-description', primaryMetric: 'CTR 1.10%', delta: -0.15, position: 5.8, ctr: 1.10, impressions: 15211, reason: '5〜6位帯の期待CTRを大幅に下回る', action: 'title / description改善', severity: '高', spark: [31,30,32,33,31,34,35,36,35,37,36,38] },
  { id: 'c02', label: 'SEO リライト 優先順位', secondary: '/seo/rewrite-priority', primaryMetric: 'CTR 1.35%', delta: -0.28, position: 7.2, ctr: 1.35, impressions: 21408, reason: '露出+24.6%だがCTRが低下', action: 'タイトル訴求改善', severity: '高', spark: [23,27,25,31,33,36,35,39,41,43,46,48] },
  { id: 'c03', label: '/seo/title-optimization', secondary: 'SEOタイトル最適化', primaryMetric: 'CTR 1.39%', delta: -0.24, position: 4.7, ctr: 1.39, impressions: 28110, reason: '平均4.7位に対してクリック率が弱い', action: 'SERP競合比較', severity: '高', spark: [35,34,36,35,37,36,38,39,38,40,41,40] },
  { id: 'c04', label: '/seo/meta-description', secondary: 'メタディスクリプション改善ガイド', primaryMetric: 'CTR 1.53%', delta: -0.21, position: 6.1, ctr: 1.53, impressions: 80120, reason: '大量表示されており改善インパクト大', action: 'スニペット改善', severity: '高', spark: [33,35,34,36,37,38,37,39,41,40,42,43] },
];

export const cannibalizationGroups = [
  { id: 'k01', query: 'search console 分析', overlap: 82, clicks: 1644, impressions: 61240, priority: '高' as const, pages: [
    { url: '/guide/search-console-analysis', clicks: 1234, position: 8.3, share: 75 },
    { url: '/blog/gsc-analysis-tips', clicks: 286, position: 12.8, share: 17 },
    { url: '/tools/gsc-check', clicks: 124, position: 19.2, share: 8 },
  ], recommendation: '主ページへ評価を集約し、補助記事からcanonicalではなく内部リンクで役割を明確化' },
  { id: 'k02', query: 'SEO カニバリ', overlap: 67, clicks: 508, impressions: 14880, priority: '高' as const, pages: [
    { url: '/seo/cannibalization', clicks: 320, position: 11.4, share: 63 },
    { url: '/blog/keyword-cannibalization', clicks: 188, position: 14.7, share: 37 },
  ], recommendation: '検索意図が近いため1記事へ統合し、旧URLから301リダイレクトを検討' },
  { id: 'k03', query: '検索順位 確認', overlap: 44, clicks: 744, impressions: 21010, priority: '中' as const, pages: [
    { url: '/tools/rank-check', clicks: 602, position: 5.9, share: 81 },
    { url: '/guide/rank-check', clicks: 142, position: 17.4, share: 19 },
  ], recommendation: 'ツールページと解説ページで意図を分離し、title/H1を明確に差別化' },
];

export const reports = [
  { id: 'r01', name: '月次SEOパフォーマンス', type: '月次', range: '2026/07/29 - 2026/08/25', created: '2026/08/25 16:30', status: '完了', size: '2.4 MB' },
  { id: 'r02', name: '改善候補 TOP50', type: '改善機会', range: '過去28日', created: '2026/08/25 14:12', status: '完了', size: '1.1 MB' },
  { id: 'r03', name: '前期間比較レポート', type: '比較', range: '28日 vs 前28日', created: '2026/08/24 18:05', status: '完了', size: '1.8 MB' },
  { id: 'r04', name: 'クエリ急落モニタリング', type: '急落', range: '過去7日', created: '2026/08/24 09:20', status: '完了', size: '840 KB' },
];

export const deviceDistribution = [
  { label: 'モバイル', value: 62.4, clicks: 15308 },
  { label: 'デスクトップ', value: 34.1, clicks: 8364 },
  { label: 'タブレット', value: 3.5, clicks: 859 },
];

export const rankDistribution = [
  { label: '1〜3位', value: 18, count: 74 },
  { label: '4〜10位', value: 31, count: 128 },
  { label: '11〜20位', value: 27, count: 112 },
  { label: '21位以下', value: 24, count: 99 },
];

export const dailyTasks = [
  { id: 't01', priority: 98, title: '/seo/title-optimization のCTR改善', detail: '4.7位 / CTR 1.39% / 表示28,110', action: 'タイトルを改善' },
  { id: 't02', priority: 97, title: '/seo/internal-links をTOP10へ', detail: '12.3位 / +28.8% clicks', action: '内部リンク追加' },
  { id: 't03', priority: 95, title: '/tools/rank-check の急落確認', detail: '-21.4% clicks / 順位+2.4悪化', action: '原因を確認' },
  { id: 't04', priority: 92, title: '/seo/search-intent を伸ばす', detail: '+45.2% clicks / 16.4位', action: '内容を拡張' },
];
