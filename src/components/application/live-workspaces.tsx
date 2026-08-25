'use client';

import Link from 'next/link';
import {
  ArrowLeft,
  CheckCircle2,
  CloudCog,
  Download,
  ExternalLink,
  Globe2,
  LoaderCircle,
  LogIn,
  LogOut,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Target,
  TriangleAlert,
} from 'lucide-react';
import { useMemo } from 'react';
import { InsightCard, MetricGrid, PerformanceChart, QueryTable } from '@/components/analytics';
import {
  CannibalizationExplorer,
  DashboardIntelligence,
  DetailOverview,
  OpportunityBoard,
  PerformanceExplorer,
  SignalExplorer,
} from '@/components/application/workspaces';
import { BarDistribution, DonutChart, MicroBars } from '@/components/application/visuals';
import { Badge, Button, Card, CardHeader, EmptyState, InputField, PageHead, SelectField, Switch } from '@/components/ui';
import {
  cannibalizationGroups,
  ctrSignals,
  dashboardMetrics,
  declineSignals,
  growthSignals,
  opportunities,
  pagePerformance,
  properties as demoProperties,
  queryPerformance,
} from '@/lib/application-data';
import { insights as demoInsights, queryRows as demoQueryRows } from '@/lib/mock-data';
import type { GscDevice } from '@/lib/gsc/types';
import { useGscWorkspace } from './gsc-context';

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
  const properties = live ? workspace.properties : demoProperties.map((item) => ({ siteUrl: item.label, permissionLevel: 'demo' }));

  return (
    <Card className={`p2-toolbar${compact ? ' p2-toolbar--compact' : ''} p3-toolbar`}>
      <div className="p2-toolbar__fields">
        <SelectField
          label="プロパティ"
          value={live ? workspace.selectedSite : properties[0]?.siteUrl ?? ''}
          disabled={!live || workspace.propertiesLoading || !properties.length}
          onChange={(event) => workspace.setSelectedSite(event.target.value)}
        >
          {!live && <option value={properties[0]?.siteUrl ?? ''}>デモデータ</option>}
          {live && !properties.length && <option value="">利用可能なプロパティなし</option>}
          {live && properties.map((property) => <option value={property.siteUrl} key={property.siteUrl}>{property.siteUrl}</option>)}
        </SelectField>
        <SelectField label="期間" value={workspace.days} onChange={(event) => workspace.setDays(Number(event.target.value))} disabled={!live}>
          <option value={7}>過去7日</option>
          <option value={28}>過去28日</option>
          <option value={90}>過去3か月</option>
        </SelectField>
        <SelectField label="比較" value="previous" disabled><option value="previous">前の期間</option></SelectField>
        <SelectField label="デバイス" value={workspace.device} onChange={(event) => workspace.setDevice(event.target.value as GscDevice)} disabled={!live}>
          <option value="all">すべて</option>
          <option value="MOBILE">モバイル</option>
          <option value="DESKTOP">デスクトップ</option>
          <option value="TABLET">タブレット</option>
        </SelectField>
      </div>
      <div className="p2-toolbar__status p3-toolbar__status">
        {workspace.sessionLoading ? (
          <span className="p3-connection is-loading"><LoaderCircle />接続確認中</span>
        ) : !workspace.session.configured ? (
          <span className="p3-connection is-warning"><CloudCog />OAuth未設定</span>
        ) : !workspace.session.authenticated ? (
          <><span className="p3-connection is-demo">デモ表示</span><a href="/api/auth/google?returnTo=/dashboard" className="ui-button ui-button--primary ui-button--sm"><LogIn />Google接続</a></>
        ) : (
          <>
            <span className="p3-connection is-live"><span />GSC LIVE</span>
            <span className="p3-sync-meta">{workspace.analysis ? `取得 ${formatDateTime(workspace.analysis.generatedAt)}` : workspace.propertiesLoading ? 'プロパティ読込中' : workspace.session.email}</span>
            <Button size="sm" variant="ghost" icon={<RefreshCw />} disabled={workspace.analysisLoading || !workspace.selectedSite} onClick={() => void workspace.refresh(true)}>{workspace.analysisLoading ? '分析中' : '再同期'}</Button>
          </>
        )}
      </div>
    </Card>
  );
}

export function DataSourceStatus() {
  const workspace = useGscWorkspace();
  if (workspace.sessionLoading) return null;
  if (!workspace.session.configured) {
    return <div className="p3-notice is-warning"><CloudCog /><span><strong>Google OAuth設定が必要です</strong><code>.env.local</code> に認証情報を設定すると、同じUIが実GSCデータへ自動で切り替わります。</span><Link href="/settings">設定を見る</Link></div>;
  }
  if (!workspace.session.authenticated) {
    return <div className="p3-notice is-info"><Globe2 /><span><strong>現在はデモデータです</strong>Google Search Consoleへ接続すると、全分析画面が実データに切り替わります。</span><a href="/api/auth/google?returnTo=/settings">接続する</a></div>;
  }
  if (workspace.analysisError) {
    return <div className="p3-notice is-danger"><TriangleAlert /><span><strong>GSCデータ取得エラー</strong>{workspace.analysisError}</span><button type="button" onClick={() => void workspace.refresh(true)}>再試行</button></div>;
  }
  if (workspace.analysisLoading && !workspace.analysis) {
    return <div className="p3-notice is-loading"><LoaderCircle /><span><strong>Search Consoleを分析中</strong>現在期間・前期間・クエリ・ページ・デバイス・カニバリ候補を並列取得しています。</span></div>;
  }
  if (workspace.analysis?.partialDataFrom) {
    return <div className="p3-notice is-warning"><TriangleAlert /><span><strong>{workspace.analysis.partialDataFrom} 以降は未確定データを含みます</strong>Google側で処理中のため、数値が後から変化する可能性があります。</span></div>;
  }
  return null;
}

function DailyPerformanceCard() {
  const { analysis } = useGscWorkspace();
  if (!analysis?.daily.length) return <PerformanceChart />;
  const clicks = analysis.daily.map((point) => point.clicks);
  const total = clicks.reduce((sum, value) => sum + value, 0);
  return (
    <Card className="p3-daily-card">
      <CardHeader title="クリック数の日次推移" description={`${analysis.range.startDate} 〜 ${analysis.range.endDate} / GSC実データ`} action={<Badge tone="success">{total.toLocaleString()} clicks</Badge>} />
      <div className="p3-daily-bars"><MicroBars values={clicks} /></div>
      <div className="p3-daily-axis"><span>{analysis.daily[0]?.date}</span><span>{analysis.daily[Math.floor(analysis.daily.length / 2)]?.date}</span><span>{analysis.daily.at(-1)?.date}</span></div>
    </Card>
  );
}

function LiveDashboardIntelligence() {
  const { analysis } = useGscWorkspace();
  if (!analysis) return <DashboardIntelligence />;
  return (
    <div className="p2-dashboard-grid">
      <Card className="p2-action-card">
        <CardHeader title="今日やるSEO" description="GSC実データをOpportunity Scoreで自動優先順位付け" action={<Badge tone="danger">{analysis.dailyTasks.length}件</Badge>} />
        <div className="p2-task-list">
          {analysis.dailyTasks.map((task, index) => (
            <div className="p2-task" key={task.id}>
              <span className="p2-task__rank">{index + 1}</span>
              <div className="p2-task__body"><div className="p2-task__title">{task.title}</div><div className="p2-task__detail">{task.detail}</div></div>
              <div className="p2-task__score"><strong>{task.priority}</strong><span>score</span></div>
              <Button size="sm" variant="secondary">{task.action}</Button>
            </div>
          ))}
          {!analysis.dailyTasks.length && <EmptyState title="緊急候補はありません" text="現在のしきい値では高優先度の改善候補が検出されませんでした。" />}
        </div>
      </Card>
      <Card><CardHeader title="デバイス構成" description="クリック数ベース / GSC" action={<Badge tone="success">LIVE</Badge>} /><DonutChart items={analysis.devices} /></Card>
      <Card><CardHeader title="掲載順位分布" description={`クエリ ${analysis.queries.length.toLocaleString()}件`} action={<Target size={14} />} /><BarDistribution items={analysis.ranks} /></Card>
    </div>
  );
}

export function LiveDashboardData() {
  const { analysis } = useGscWorkspace();
  const metrics = analysis?.metrics ?? dashboardMetrics;
  const insights = analysis?.insights ?? demoInsights;
  const queryRows = analysis ? analysis.queries.slice(0, 8).map((row) => ({
    query: row.label,
    clicks: row.clicks.toLocaleString(),
    impressions: row.impressions.toLocaleString(),
    ctr: `${row.ctr.toFixed(2)}%`,
    position: row.position.toFixed(1),
    change: `${row.clickDelta >= 0 ? '+' : ''}${row.clickDelta.toFixed(1)}`,
    priority: row.priority,
  })) : demoQueryRows;
  return (
    <>
      <DataSourceStatus />
      <MetricGrid metrics={metrics} />
      <div className="dashboard-grid">
        <DailyPerformanceCard />
        <Card><CardHeader title="重要インサイト" description={analysis ? 'GSC実データから自動抽出' : 'デモデータによるプレビュー'} action={<Badge tone={analysis ? 'success' : 'info'}>{analysis ? 'LIVE' : 'DEMO'}</Badge>} /><div className="insight-list">{insights.map((insight) => <InsightCard key={insight.title} {...insight} />)}</div></Card>
      </div>
      <LiveDashboardIntelligence />
      <div style={{ marginTop: 10 }}><QueryTable rows={queryRows} /></div>
    </>
  );
}

export function LivePerformanceWorkspace({ kind }: { kind: 'queries' | 'pages' }) {
  const { analysis } = useGscWorkspace();
  const fallback = kind === 'queries' ? queryPerformance : pagePerformance;
  return <><DataSourceStatus /><PerformanceExplorer kind={kind} rows={analysis ? analysis[kind] : fallback} /></>;
}

export function LiveOpportunityWorkspace() {
  const { analysis } = useGscWorkspace();
  return <><DataSourceStatus /><OpportunityBoard items={analysis?.opportunities ?? opportunities} /></>;
}

export function LiveSignalWorkspace({ mode }: { mode: 'growth' | 'decline' | 'ctr' }) {
  const { analysis } = useGscWorkspace();
  const fallback = mode === 'growth' ? growthSignals : mode === 'decline' ? declineSignals : ctrSignals;
  const rows = analysis ? (mode === 'growth' ? analysis.growth : mode === 'decline' ? analysis.declines : analysis.ctr) : fallback;
  return <><DataSourceStatus /><SignalExplorer mode={mode} rows={rows} /></>;
}

export function LiveCannibalizationWorkspace() {
  const { analysis } = useGscWorkspace();
  return <><DataSourceStatus /><CannibalizationExplorer groups={analysis?.cannibalization ?? cannibalizationGroups} /></>;
}

export function LiveSettingsWorkspace() {
  const workspace = useGscWorkspace();
  return (
    <div className="p2-settings-layout">
      <aside className="p2-settings-nav"><a className="is-active" href="#connection">GSC接続</a><a href="#analysis">分析条件</a><a href="#notifications">通知</a><a href="#display">表示</a></aside>
      <div className="p2-settings-main">
        <Card id="connection" className="p2-settings-card">
          <CardHeader title="Google Search Console 接続" description="OAuth 2.0 / read-only scope。アクセストークンはHttpOnly暗号化Cookieでサーバー側だけが扱います。" action={workspace.session.authenticated ? <a className="ui-button ui-button--ghost ui-button--sm" href="/api/auth/logout"><LogOut />切断</a> : workspace.session.configured ? <a className="ui-button ui-button--primary ui-button--sm" href="/api/auth/google?returnTo=/settings"><LogIn />Googleで接続</a> : <Badge tone="warning">環境変数未設定</Badge>} />
          {!workspace.session.configured ? (
            <div className="p3-env-guide"><CloudCog /><div><strong>OAuth認証情報を設定してください</strong><p><code>GOOGLE_CLIENT_ID</code> / <code>GOOGLE_CLIENT_SECRET</code> / <code>GSC_SESSION_SECRET</code> を設定します。リダイレクトURIは <code>/api/auth/google/callback</code> です。</p></div></div>
          ) : workspace.session.authenticated ? (
            <>
              <div className="p3-account"><span className="p3-account__icon"><CheckCircle2 /></span><div><strong>{workspace.session.email ?? 'Google Account'}</strong><span>Search Console read-only · token自動更新</span></div><Badge tone="success">接続済み</Badge></div>
              <div className="p2-property-list">{workspace.properties.map((property) => <button className={`p2-property p3-property-button${workspace.selectedSite === property.siteUrl ? ' is-active' : ''}`} type="button" key={property.siteUrl} onClick={() => workspace.setSelectedSite(property.siteUrl)}><span className="p2-property__icon"><Globe2 /></span><div><strong>{property.siteUrl}</strong><span>{property.permissionLevel}</span></div>{workspace.selectedSite === property.siteUrl && <Badge tone="success">分析対象</Badge>}</button>)}</div>
            </>
          ) : <div className="p3-env-guide"><Globe2 /><div><strong>認証設定は完了しています</strong><p>Googleアカウントを接続すると、所有・共有されているSearch Consoleプロパティを自動取得します。</p></div></div>}
        </Card>

        <Card id="analysis" className="p2-settings-card">
          <CardHeader title="分析エンジンしきい値" description="変更値はブラウザに保存され、次回分析からサーバー側スコアリングへ反映されます。" action={<Button size="sm" icon={<RefreshCw />} disabled={!workspace.session.authenticated || workspace.analysisLoading} onClick={() => void workspace.refresh(true)}>設定を反映</Button>} />
          <div className="p2-setting-grid">
            <InputField label="急上昇判定" value={workspace.thresholds.growthPercent} hint="クリック増加率 %" type="number" onChange={(event) => workspace.updateThresholds({ growthPercent: Number(event.target.value) })} />
            <InputField label="急落判定" value={workspace.thresholds.declinePercent} hint="クリック変化率 %" type="number" onChange={(event) => workspace.updateThresholds({ declinePercent: Number(event.target.value) })} />
            <InputField label="最低表示回数" value={workspace.thresholds.minImpressions} hint="ノイズ除外" type="number" onChange={(event) => workspace.updateThresholds({ minImpressions: Number(event.target.value) })} />
            <InputField label="チャンス順位 上限" value={workspace.thresholds.opportunityMaxPosition} hint="例: 20位" type="number" onChange={(event) => workspace.updateThresholds({ opportunityMaxPosition: Number(event.target.value) })} />
          </div>
          <div className="p3-engine-note"><Sparkles /><span><strong>Opportunity Score</strong>検索需要・順位帯・自サイトCTR基準との差・期間変化・順位悪化リスクを統合して0〜100で算出します。</span></div>
        </Card>

        <Card id="notifications" className="p2-settings-card"><CardHeader title="通知プリファレンス" description="Phase 4の定期監視で利用するUI設定" /><div className="p2-switch-list"><Switch label="重大な急落を通知" initial /><Switch label="急上昇クエリを通知" initial /><Switch label="週次サマリー" initial /></div></Card>
        <Card id="display" className="p2-settings-card"><CardHeader title="データとセキュリティ" description="Phase 3の実データレイヤー" /><div className="p3-security-grid"><div><ShieldCheck /><span><strong>Read-only</strong>Search Consoleの変更権限は要求しません。</span></div><div><ShieldCheck /><span><strong>PKCE + state</strong>OAuthコールバックを検証します。</span></div><div><ShieldCheck /><span><strong>Encrypted HttpOnly</strong>Google tokenをブラウザJavaScriptへ公開しません。</span></div></div><div className="p3-engine-note"><CloudCog /><span><strong>APIキャッシュ</strong>同一条件はサーバー側で短時間キャッシュし、Search Console API負荷を抑えます。</span></div></Card>
      </div>
    </div>
  );
}

export function LiveDetailWorkspace({ kind, slug }: { kind: 'query' | 'page'; slug: string }) {
  const { analysis } = useGscWorkspace();
  const liveRows = kind === 'query' ? analysis?.queries : analysis?.pages;
  const fallbackRows = kind === 'query' ? queryPerformance : pagePerformance;
  const row = (liveRows ?? fallbackRows).find((item) => item.id === slug);
  const related = analysis ? (kind === 'query' ? analysis.pages : analysis.queries) : (kind === 'query' ? pagePerformance : queryPerformance);

  if (!row) return <><DataSourceStatus /><EmptyState title="対象データが見つかりません" text="プロパティや期間を変更したことで一覧から外れた可能性があります。" action={<Link className="ui-button ui-button--secondary ui-button--sm" href={kind === 'query' ? '/queries' : '/pages'}><ArrowLeft />一覧へ戻る</Link>} /></>;

  return (
    <>
      <PageHead
        eyebrow={kind === 'query' ? 'Query detail / GSC' : 'Page detail / GSC'}
        title={row.label}
        description={kind === 'query' ? `主要ランディングページ: ${row.secondary ?? '-'}。実GSCデータの期間比較と改善余地を確認します。` : `${row.secondary ?? ''} 実GSCデータから主要流入と改善余地を確認します。`}
        actions={<><Link href={kind === 'query' ? '/queries' : '/pages'} className="ui-button ui-button--ghost" style={{ textDecoration: 'none' }}><ArrowLeft />一覧へ戻る</Link>{kind === 'page' && row.label.startsWith('http') && <a href={row.label} target="_blank" rel="noreferrer" className="ui-button ui-button--secondary" style={{ textDecoration: 'none' }}><ExternalLink />実ページ</a>}<Button variant="secondary" icon={<Download />}>エクスポート</Button></>}
      />
      <div style={{ display: 'flex', gap: 5, marginBottom: 8, flexWrap: 'wrap' }}>{row.tags.map((tag) => <Badge tone="info" key={tag}>{tag}</Badge>)}</div>
      <LiveWorkspaceToolbar compact />
      <DataSourceStatus />
      <DetailOverview row={row} kind={kind} related={related} />
    </>
  );
}
