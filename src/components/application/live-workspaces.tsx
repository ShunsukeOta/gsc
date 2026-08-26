'use client';

import Link from 'next/link';
import {
  ArrowLeft,
  CheckCircle2,
  CloudCog,
  Globe2,
  Image as ImageIcon,
  LoaderCircle,
  LogIn,
  LogOut,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  TriangleAlert,
  Video,
} from 'lucide-react';
import { useState } from 'react';
import { InsightCard, MetricGrid } from '@/components/analytics';
import { CannibalizationExplorer, OpportunityBoard, PerformanceExplorer } from '@/components/application/workspaces';
import { BarDistribution, DonutChart, MicroBars } from '@/components/application/visuals';
import { Badge, Button, Card, CardHeader, EmptyState, InputField, PageHead, SelectField, Switch } from '@/components/ui';
import type { GscDevice, GscSearchType } from '@/lib/gsc/types';
import { OpportunityActionDrawer } from './action-center';
import { useGscWorkspace } from './gsc-context';

const EMPTY_METRICS = [
  { label: '合計クリック数', value: '0', change: '-', direction: 'up' as const, note: '取得待ち' },
  { label: '合計表示回数', value: '0', change: '-', direction: 'up' as const, note: '取得待ち' },
  { label: '平均CTR', value: '-', change: '-', direction: 'up' as const, note: '取得待ち' },
  { label: '平均掲載順位', value: '-', change: '-', direction: 'up' as const, note: '取得待ち' },
];

const EMPTY_INSIGHTS = [
  { title: '急上昇シグナル', value: '0件', meta: '取得待ち', action: 'データ取得後に表示', tone: 'success' as const },
  { title: '急落シグナル', value: '0件', meta: '取得待ち', action: 'データ取得後に表示', tone: 'danger' as const },
  { title: 'TOP10候補', value: '0件', meta: '取得待ち', action: 'データ取得後に表示', tone: 'warning' as const },
];

const SEARCH_TYPES: Array<{ value: GscSearchType; label: string }> = [
  { value: 'web', label: 'ウェブ' },
  { value: 'image', label: '画像' },
  { value: 'video', label: '動画' },
];

export function searchTypeLabel(type: GscSearchType) {
  return type === 'image' ? '画像検索' : type === 'video' ? '動画検索' : 'ウェブ検索';
}

const formatDateTime = (value?: string) => {
  if (!value) return '-';
  try {
    return new Intl.DateTimeFormat('ja-JP', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value));
  } catch {
    return value;
  }
};

export function LiveWorkspaceToolbar({ compact = false }: { compact?: boolean }) {
  const workspace = useGscWorkspace();
  const live = workspace.session.authenticated;
  return (
    <Card id="workspace-filters" className={`p2-toolbar${compact ? ' p2-toolbar--compact' : ''} p3-toolbar p5-toolbar`}>
      <div className="p2-toolbar__fields">
        <SelectField label="プロパティ" value={workspace.selectedSite} disabled={!live || workspace.propertiesLoading || !workspace.properties.length} onChange={(event) => workspace.setSelectedSite(event.target.value)}>
          {!live && <option value="">未接続</option>}
          {live && !workspace.properties.length && <option value="">利用可能なプロパティなし</option>}
          {live && workspace.properties.map((property) => <option value={property.siteUrl} key={property.siteUrl}>{property.siteUrl}</option>)}
        </SelectField>
        <SelectField label="検索タイプ" value={workspace.searchType} onChange={(event) => workspace.setSearchType(event.target.value as GscSearchType)} disabled={!live}>
          {SEARCH_TYPES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
        </SelectField>
        <SelectField label="期間" value={workspace.days} onChange={(event) => workspace.setDays(Number(event.target.value))} disabled={!live}><option value={7}>過去7日</option><option value={28}>過去28日</option><option value={90}>過去3か月</option></SelectField>
        <SelectField label="比較" value="previous" disabled><option value="previous">前の期間</option></SelectField>
        <SelectField label="デバイス" value={workspace.device} onChange={(event) => workspace.setDevice(event.target.value as GscDevice)} disabled={!live}><option value="all">すべて</option><option value="MOBILE">モバイル</option><option value="DESKTOP">デスクトップ</option><option value="TABLET">タブレット</option></SelectField>
      </div>
      <div className="p2-toolbar__status p3-toolbar__status">
        {workspace.sessionLoading ? <span className="p3-connection is-loading"><LoaderCircle />接続確認中</span> : !workspace.session.configured ? <span className="p3-connection is-warning"><CloudCog />OAuth未設定</span> : !workspace.session.authenticated ? <><span className="p3-connection is-warning">GSC未接続</span><a href="/api/auth/google?returnTo=/dashboard" className="ui-button ui-button--primary ui-button--sm"><LogIn />Google接続</a></> : <><span className="p3-connection is-live"><span />{searchTypeLabel(workspace.searchType)}</span><span className="p3-sync-meta">{workspace.analysis ? `取得 ${formatDateTime(workspace.analysis.generatedAt)}` : workspace.analysisLoading ? '取得中...' : workspace.propertiesLoading ? 'プロパティ読込中' : workspace.session.email}</span><Button size="sm" variant="ghost" icon={<RefreshCw />} disabled={workspace.analysisLoading || !workspace.selectedSite} onClick={() => void workspace.refresh(true)}>{workspace.analysisLoading ? '分析中' : '再同期'}</Button></>}
      </div>
    </Card>
  );
}

export function DataSourceStatus() {
  const workspace = useGscWorkspace();
  if (workspace.sessionLoading) return <div className="p3-notice is-loading"><LoaderCircle /><span><strong>接続状態を確認しています</strong>データ取得前のため数値は0 / -で表示します。</span></div>;
  if (!workspace.session.configured) return <div className="p3-notice is-warning"><CloudCog /><span><strong>Google OAuth設定が必要です</strong>認証情報を設定するまで実データは表示しません。</span><Link href="/settings">設定を見る</Link></div>;
  if (!workspace.session.authenticated) return <div className="p3-notice is-info"><Globe2 /><span><strong>Google Search Consoleが未接続です</strong>デモデータは表示しません。接続後に実データだけを取得します。</span><a href="/api/auth/google?returnTo=/settings">接続する</a></div>;
  if (workspace.analysisError) return <div className="p3-notice is-danger"><TriangleAlert /><span><strong>GSCデータ取得エラー</strong>{workspace.analysisError}</span><button type="button" onClick={() => void workspace.refresh(true)}>再試行</button></div>;
  if (workspace.analysisLoading && !workspace.analysis) return <div className="p3-notice is-loading"><LoaderCircle /><span><strong>{searchTypeLabel(workspace.searchType)}を分析中</strong>現在期間・前期間・クエリ・ページ・デバイス・query×pageを取得しています。完了まで既存データは差し込みません。</span></div>;
  if (workspace.analysis?.partialDataFrom) return <div className="p3-notice is-warning"><TriangleAlert /><span><strong>{workspace.analysis.partialDataFrom} 以降は未確定データを含みます</strong>Google側で処理中のため、数値が後から変化する可能性があります。</span></div>;
  return null;
}

function DailyPerformanceCard() {
  const workspace = useGscWorkspace();
  const analysis = workspace.analysis;
  if (!analysis?.daily.length) return <Card className="p3-daily-card"><CardHeader title="クリック数の日次推移" description={`${searchTypeLabel(workspace.searchType)} / ${workspace.analysisLoading ? '取得中' : '取得待ち'}`} action={<Badge tone="neutral">-</Badge>} /><div className="p5-chart-empty"><span>-</span><small>データ取得後に日次推移を表示します</small></div></Card>;
  const clicks = analysis.daily.map((point) => point.clicks);
  const total = clicks.reduce((sum, value) => sum + value, 0);
  return <Card className="p3-daily-card"><CardHeader title="クリック数の日次推移" description={`${analysis.range.startDate} 〜 ${analysis.range.endDate} / ${searchTypeLabel(analysis.searchType)}`} action={<Badge tone="success">{total.toLocaleString()} clicks</Badge>} /><div className="p3-daily-bars"><MicroBars values={clicks} /></div><div className="p3-daily-axis"><span>{analysis.daily[0]?.date}</span><span>{analysis.daily[Math.floor(analysis.daily.length / 2)]?.date}</span><span>{analysis.daily.at(-1)?.date}</span></div></Card>;
}

function LiveDashboardIntelligence() {
  const workspace = useGscWorkspace();
  const analysis = workspace.analysis;
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = analysis?.opportunities.find((item) => item.id === selectedId) ?? null;
  return (
    <>
      <div className="p2-dashboard-grid">
        <Card className="p2-action-card"><CardHeader title="今日やるSEO" description={analysis ? `${searchTypeLabel(analysis.searchType)}のOpportunity Score上位` : '実データ取得後に優先順位を表示'} action={<Badge tone={analysis?.dailyTasks.length ? 'danger' : 'neutral'}>{analysis?.dailyTasks.length ?? 0}件</Badge>} /><div className="p2-task-list">{analysis?.dailyTasks.map((task, index) => <div className="p2-task" key={task.id}><span className="p2-task__rank">{index + 1}</span><div className="p2-task__body"><div className="p2-task__title">{task.title}</div><div className="p2-task__detail">{task.detail}</div></div><div className="p2-task__score"><strong>{task.priority}</strong><span>score</span></div><Button size="sm" variant="secondary" onClick={() => setSelectedId(task.id)}>{task.action}</Button></div>)}{!analysis?.dailyTasks.length && <EmptyState title={workspace.analysisLoading ? '分析中です' : 'SEOアクションは0件です'} text={workspace.analysisLoading ? 'GSC取得完了後に実データから優先タスクを作成します。' : analysis ? '現在の条件では高優先度の改善候補はありません。' : 'GSC接続・データ取得後に表示します。'} />}</div></Card>
        <Card><CardHeader title="デバイス構成" description="クリック数ベース" action={<Badge tone={analysis ? 'success' : 'neutral'}>{analysis ? 'LIVE' : '-'}</Badge>} />{analysis?.devices.length ? <DonutChart items={analysis.devices} /> : <EmptyState title="0件" text="デバイスデータ取得後に表示します。" />}</Card>
        <Card><CardHeader title="掲載順位分布" description={`クエリ ${analysis?.queries.length.toLocaleString() ?? 0}件`} action={<Target size={14} />} />{analysis?.ranks.some((item) => item.count > 0) ? <BarDistribution items={analysis.ranks} /> : <EmptyState title="0件" text="順位データ取得後に表示します。" />}</Card>
      </div>
      <OpportunityActionDrawer opportunity={selected} onClose={() => setSelectedId(null)} />
    </>
  );
}

function TopQueries() {
  const workspace = useGscWorkspace();
  const rows = workspace.analysis?.queries.slice(0, 8) ?? [];
  return <Card padded={false} className="p5-top-queries"><div className="p2-explorer__head"><div><div className="p2-explorer__title">上位検索クエリ</div><div className="p2-explorer__desc">表示回数の多い実GSCクエリ</div></div>{workspace.analysis && <Link className="ui-button ui-button--ghost ui-button--sm" href="/queries">すべて見る</Link>}</div>{rows.length ? <div className="p2-table-wrap"><table className="p2-table"><thead><tr><th>クエリ</th><th>クリック</th><th>表示回数</th><th>CTR</th><th>順位</th><th>Score</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id}><td className="p2-table__primary"><Link href={`/queries/${row.id}`}>{row.label}</Link><span>{row.secondary}</span></td><td className="p2-num">{row.clicks.toLocaleString()}</td><td className="p2-num">{row.impressions.toLocaleString()}</td><td className="p2-num">{row.ctr.toFixed(2)}%</td><td className="p2-num">{row.position.toFixed(1)}</td><td><span className="p2-score">{row.score}</span></td></tr>)}</tbody></table></div> : <EmptyState title="クエリ 0件" text="データ取得完了後に表示します。" />}</Card>;
}

export function LiveDashboardData() {
  const workspace = useGscWorkspace();
  const analysis = workspace.analysis;
  const metrics = analysis?.metrics ?? EMPTY_METRICS;
  const insights = analysis?.insights ?? EMPTY_INSIGHTS;
  return <><DataSourceStatus /><MetricGrid metrics={metrics} /><div className="dashboard-grid"><DailyPerformanceCard /><Card><CardHeader title="重要インサイト" description={analysis ? `${searchTypeLabel(analysis.searchType)}の実データから抽出` : '実データ取得待ち'} action={<Badge tone={analysis ? 'success' : 'neutral'}>{analysis ? 'LIVE' : '-'}</Badge>} /><div className="insight-list">{insights.map((insight) => <InsightCard key={insight.title} {...insight} />)}</div></Card></div><LiveDashboardIntelligence /><div style={{ marginTop: 10 }}><TopQueries /></div></>;
}

export function LivePerformanceWorkspace({ kind }: { kind: 'queries' | 'pages' }) {
  const workspace = useGscWorkspace();
  const rows = workspace.analysis?.[kind] ?? [];
  return <><DataSourceStatus />{workspace.analysis ? <PerformanceExplorer kind={kind} rows={rows} /> : <EmptyState title={`${kind === 'queries' ? 'クエリ' : 'ページ'} 0件`} text={workspace.analysisLoading ? '実GSCデータを読み込んでいます。' : 'GSC接続・データ取得後に表示します。'} />}</>;
}

export function LiveOpportunityWorkspace() {
  const workspace = useGscWorkspace();
  return <><DataSourceStatus />{workspace.analysis ? <OpportunityBoard items={workspace.analysis.opportunities} /> : <EmptyState title="改善機会 0件" text={workspace.analysisLoading ? 'Opportunityを計算しています。' : 'GSCデータ取得後に表示します。'} />}</>;
}

export function LiveCannibalizationWorkspace() {
  const workspace = useGscWorkspace();
  return <><DataSourceStatus />{workspace.analysis ? <CannibalizationExplorer groups={workspace.analysis.cannibalization} /> : <EmptyState title="カニバリ候補 0件" text={workspace.analysisLoading ? 'query × pageを分析しています。' : 'GSCデータ取得後に表示します。'} />}</>;
}

export function LiveSettingsWorkspace() {
  const workspace = useGscWorkspace();
  return (
    <div className="p2-settings-layout">
      <aside className="p2-settings-nav"><a className="is-active" href="#connection">GSC接続</a><a href="#analysis">分析条件</a><a href="#notifications">通知</a><a href="#display">セキュリティ</a></aside>
      <div className="p2-settings-main">
        <Card id="connection" className="p2-settings-card"><CardHeader title="Google Search Console 接続" description="OAuth 2.0 / read-only scope。アクセストークンはHttpOnly暗号化Cookieでサーバー側だけが扱います。" action={workspace.session.authenticated ? <a className="ui-button ui-button--ghost ui-button--sm" href="/api/auth/logout"><LogOut />切断</a> : workspace.session.configured ? <a className="ui-button ui-button--primary ui-button--sm" href="/api/auth/google?returnTo=/settings"><LogIn />Googleで接続</a> : <Badge tone="warning">環境変数未設定</Badge>} />{!workspace.session.configured ? <div className="p3-env-guide"><CloudCog /><div><strong>OAuth認証情報を設定してください</strong><p><code>GOOGLE_CLIENT_ID</code> / <code>GOOGLE_CLIENT_SECRET</code> / <code>GSC_SESSION_SECRET</code> を設定します。</p></div></div> : workspace.session.authenticated ? <><div className="p3-account"><span className="p3-account__icon"><CheckCircle2 /></span><div><strong>{workspace.session.email ?? 'Google Account'}</strong><span>Search Console read-only · token自動更新</span></div><Badge tone="success">接続済み</Badge></div><div className="p2-property-list">{workspace.properties.map((property) => <button className={`p2-property p3-property-button${workspace.selectedSite === property.siteUrl ? ' is-active' : ''}`} type="button" key={property.siteUrl} onClick={() => workspace.setSelectedSite(property.siteUrl)}><span className="p2-property__icon"><Globe2 /></span><div><strong>{property.siteUrl}</strong><span>{property.permissionLevel}</span></div>{workspace.selectedSite === property.siteUrl && <Badge tone="success">分析対象</Badge>}</button>)}</div></> : <div className="p3-env-guide"><Globe2 /><div><strong>認証設定は完了しています</strong><p>Googleアカウントを接続するとSearch Consoleプロパティを取得します。未接続時にデモ値は表示しません。</p></div></div>}</Card>

        <Card id="analysis" className="p2-settings-card"><CardHeader title="分析エンジンしきい値" description="Web・画像・動画の各検索タイプに同じ判定ロジックを適用します。変更すると実データを再取得します。" action={<Button size="sm" icon={<RefreshCw />} disabled={!workspace.session.authenticated || workspace.analysisLoading} onClick={() => void workspace.refresh(true)}>設定を反映</Button>} /><div className="p2-setting-grid"><InputField label="急上昇判定" value={workspace.thresholds.growthPercent} hint="クリック増加率 %" type="number" onChange={(event) => workspace.updateThresholds({ growthPercent: Number(event.target.value) })} /><InputField label="急落判定" value={workspace.thresholds.declinePercent} hint="クリック変化率 %" type="number" onChange={(event) => workspace.updateThresholds({ declinePercent: Number(event.target.value) })} /><InputField label="最低表示回数" value={workspace.thresholds.minImpressions} hint="ノイズ除外" type="number" onChange={(event) => workspace.updateThresholds({ minImpressions: Number(event.target.value) })} /><InputField label="チャンス順位 上限" value={workspace.thresholds.opportunityMaxPosition} hint="例: 20位" type="number" onChange={(event) => workspace.updateThresholds({ opportunityMaxPosition: Number(event.target.value) })} /></div><div className="p3-engine-note"><Sparkles /><span><strong>検索タイプ</strong>上部ツールバーからウェブ・画像・動画を切り替えます。キャッシュも検索タイプ別に分離されます。</span></div></Card>

        <Card id="notifications" className="p2-settings-card"><CardHeader title="ヘッダー通知" description="ベルアイコンへ表示する実データ通知を選択します" /><div className="p2-switch-list"><Switch label="重大な異常・急落" checked={workspace.notificationPreferences.anomalies} onChange={(value) => workspace.updateNotificationPreferences({ anomalies: value })} /><Switch label="急成長シグナル" checked={workspace.notificationPreferences.growth} onChange={(value) => workspace.updateNotificationPreferences({ growth: value })} /><Switch label="未確定・データ品質" checked={workspace.notificationPreferences.quality} onChange={(value) => workspace.updateNotificationPreferences({ quality: value })} /></div></Card>
        <Card id="display" className="p2-settings-card"><CardHeader title="データとセキュリティ" description="実データ専用の接続レイヤー" /><div className="p3-security-grid"><div><ShieldCheck /><span><strong>Read-only</strong>Search Consoleの変更権限は要求しません。</span></div><div><ShieldCheck /><span><strong>PKCE + state</strong>OAuthコールバックを検証します。</span></div><div><ShieldCheck /><span><strong>Encrypted HttpOnly</strong>Google tokenをブラウザJavaScriptへ公開しません。</span></div></div><div className="p3-engine-note"><CloudCog /><span><strong>デモデータなし</strong>未接続・読み込み中・条件切替中は0 / -を表示し、実GSCレスポンスだけを分析結果として採用します。</span></div></Card>
      </div>
    </div>
  );
}

export function LiveDetailWorkspace({ kind }: { kind: 'query' | 'page'; slug: string }) {
  return <><PageHead eyebrow="GSC detail" title="-" description="詳細画面を読み込んでいます。" actions={<Link href={kind === 'query' ? '/queries' : '/pages'} className="ui-button ui-button--ghost"><ArrowLeft />一覧へ戻る</Link>} /><DataSourceStatus /></>;
}
