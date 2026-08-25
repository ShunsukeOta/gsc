'use client';

import Link from 'next/link';
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  ArrowUpDown,
  BellRing,
  Bookmark,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Download,
  ExternalLink,
  FileDown,
  Filter,
  Globe2,
  Layers3,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Target,
  X,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { Badge, Button, Card, CardHeader, Checkbox, Chip, IconButton, InputField, Pagination, SelectField, Switch, cx } from '@/components/ui';
import type { Opportunity, PerformanceRow, Priority, SignalRow } from '@/lib/application-data';
import { dailyTasks, deviceDistribution, properties, rankDistribution, reports } from '@/lib/application-data';
import { BarDistribution, DonutChart, MicroBars, Sparkline } from './visuals';

const formatNumber = (value: number) => new Intl.NumberFormat('ja-JP').format(value);
const signed = (value: number, suffix = '%') => `${value > 0 ? '+' : ''}${value.toFixed(1)}${suffix}`;

function PriorityBadge({ value }: { value: Priority }) {
  return <Badge tone={value === '高' ? 'danger' : value === '中' ? 'warning' : 'neutral'}>{value}</Badge>;
}

export function WorkspaceToolbar({ compact = false }: { compact?: boolean }) {
  return (
    <Card className={cx('p2-toolbar', compact && 'p2-toolbar--compact')}>
      <div className="p2-toolbar__fields">
        <SelectField label="プロパティ" defaultValue="site-1">
          {properties.map((property) => <option value={property.id} key={property.id}>{property.label}</option>)}
        </SelectField>
        <SelectField label="期間" defaultValue="28">
          <option value="7">過去7日</option>
          <option value="28">過去28日</option>
          <option value="90">過去3か月</option>
          <option value="custom">期間を指定</option>
        </SelectField>
        <SelectField label="比較" defaultValue="previous">
          <option value="previous">前の期間</option>
          <option value="year">前年同期</option>
          <option value="none">比較なし</option>
        </SelectField>
        <SelectField label="デバイス" defaultValue="all">
          <option value="all">すべて</option>
          <option value="mobile">モバイル</option>
          <option value="desktop">デスクトップ</option>
          <option value="tablet">タブレット</option>
        </SelectField>
      </div>
      <div className="p2-toolbar__status">
        <span className="p2-sync"><span />最終同期 17:02</span>
        <Button size="sm" variant="ghost" icon={<RefreshCw />}>再同期</Button>
      </div>
    </Card>
  );
}

export function DashboardIntelligence() {
  return (
    <div className="p2-dashboard-grid">
      <Card className="p2-action-card">
        <CardHeader title="今日やるSEO" description="改善インパクト × 実行しやすさで自動優先順位付け" action={<Badge tone="danger">4件</Badge>} />
        <div className="p2-task-list">
          {dailyTasks.map((task, index) => (
            <div className="p2-task" key={task.id}>
              <span className="p2-task__rank">{index + 1}</span>
              <div className="p2-task__body">
                <div className="p2-task__title">{task.title}</div>
                <div className="p2-task__detail">{task.detail}</div>
              </div>
              <div className="p2-task__score"><strong>{task.priority}</strong><span>score</span></div>
              <Button size="sm" variant="secondary">{task.action}</Button>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <CardHeader title="デバイス構成" description="クリック数ベース" action={<Badge tone="info">28日</Badge>} />
        <DonutChart items={deviceDistribution} />
      </Card>

      <Card>
        <CardHeader title="掲載順位分布" description="クエリ413件" action={<Target size={14} />} />
        <BarDistribution items={rankDistribution} />
      </Card>
    </div>
  );
}

type PerformanceExplorerProps = {
  kind: 'queries' | 'pages';
  rows: PerformanceRow[];
};

type SortKey = 'clicks' | 'impressions' | 'ctr' | 'position' | 'score';

export function PerformanceExplorer({ kind, rows }: PerformanceExplorerProps) {
  const [search, setSearch] = useState('');
  const [priority, setPriority] = useState<'all' | Priority>('all');
  const [sortKey, setSortKey] = useState<SortKey>('clicks');
  const [descending, setDescending] = useState(true);
  const [selected, setSelected] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);

  const filtered = useMemo(() => {
    return rows
      .filter((row) => {
        const hit = `${row.label} ${row.secondary ?? ''} ${row.tags.join(' ')}`.toLowerCase().includes(search.toLowerCase());
        return hit && (priority === 'all' || row.priority === priority);
      })
      .sort((a, b) => {
        const diff = a[sortKey] - b[sortKey];
        return descending ? -diff : diff;
      });
  }, [descending, priority, rows, search, sortKey]);

  const totals = useMemo(() => ({
    clicks: rows.reduce((sum, row) => sum + row.clicks, 0),
    impressions: rows.reduce((sum, row) => sum + row.impressions, 0),
    avgCtr: rows.reduce((sum, row) => sum + row.ctr, 0) / rows.length,
    avgPosition: rows.reduce((sum, row) => sum + row.position, 0) / rows.length,
  }), [rows]);

  const toggleAll = () => setSelected(selected.length === filtered.length ? [] : filtered.map((row) => row.id));
  const toggleRow = (id: string) => setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  const changeSort = (key: SortKey) => {
    if (sortKey === key) setDescending((value) => !value);
    else { setSortKey(key); setDescending(true); }
  };

  return (
    <>
      <div className="p2-summary-grid">
        <CompactStat label="クリック" value={formatNumber(totals.clicks)} meta="対象行合計" trend="+12.5%" />
        <CompactStat label="表示回数" value={formatNumber(totals.impressions)} meta="対象行合計" trend="+8.3%" />
        <CompactStat label="平均CTR" value={`${totals.avgCtr.toFixed(2)}%`} meta="単純平均" trend="+0.18pt" />
        <CompactStat label="平均順位" value={totals.avgPosition.toFixed(1)} meta="単純平均" trend="-1.4" good />
      </div>

      <Card className="p2-explorer" padded={false}>
        <div className="p2-explorer__head">
          <div>
            <div className="p2-explorer__title">{kind === 'queries' ? '検索クエリ一覧' : 'ページ一覧'}</div>
            <div className="p2-explorer__desc">変化量・優先度・トレンドを同じ画面で比較できます。</div>
          </div>
          <div className="p2-explorer__head-actions">
            <Button size="sm" variant="ghost" icon={<Bookmark />} onClick={() => setSaved((value) => !value)}>{saved ? '保存済み' : 'ビュー保存'}</Button>
            <Button size="sm" variant="secondary" icon={<Download />}>CSV出力</Button>
          </div>
        </div>

        <div className="p2-explorer__filters">
          <label className="p2-search">
            <Search aria-hidden="true" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={kind === 'queries' ? 'クエリを検索...' : 'URL・タイトルを検索...'} />
            {search && <button type="button" onClick={() => setSearch('')} aria-label="検索をクリア"><X /></button>}
          </label>
          <select className="p2-mini-select" value={priority} onChange={(event) => setPriority(event.target.value as 'all' | Priority)}>
            <option value="all">優先度: すべて</option>
            <option value="高">優先度: 高</option>
            <option value="中">優先度: 中</option>
            <option value="低">優先度: 低</option>
          </select>
          <button className="p2-filter-button" type="button"><Filter />フィルター</button>
          <div className="p2-filter-chips">
            <Chip>日本</Chip><Chip>ウェブ検索</Chip><Chip>過去28日</Chip>
          </div>
        </div>

        {selected.length > 0 && (
          <div className="p2-selection-bar">
            <strong>{selected.length}件を選択</strong>
            <span>比較・エクスポート対象に追加できます</span>
            <Button size="sm" variant="secondary">比較する</Button>
            <button type="button" onClick={() => setSelected([])}>選択解除</button>
          </div>
        )}

        <div className="p2-table-wrap">
          <table className="p2-table">
            <thead>
              <tr>
                <th className="p2-table__check"><input type="checkbox" checked={filtered.length > 0 && selected.length === filtered.length} onChange={toggleAll} aria-label="すべて選択" /></th>
                <th>{kind === 'queries' ? 'クエリ' : 'ページ'}</th>
                <SortableTh label="クリック" active={sortKey === 'clicks'} onClick={() => changeSort('clicks')} />
                <SortableTh label="表示回数" active={sortKey === 'impressions'} onClick={() => changeSort('impressions')} />
                <SortableTh label="CTR" active={sortKey === 'ctr'} onClick={() => changeSort('ctr')} />
                <SortableTh label="平均順位" active={sortKey === 'position'} onClick={() => changeSort('position')} />
                <th>28日変化</th>
                <th>推移</th>
                <SortableTh label="Score" active={sortKey === 'score'} onClick={() => changeSort('score')} />
                <th>優先度</th>
                <th aria-label="操作" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr key={row.id} className={selected.includes(row.id) ? 'is-selected' : undefined}>
                  <td className="p2-table__check"><input type="checkbox" checked={selected.includes(row.id)} onChange={() => toggleRow(row.id)} aria-label={`${row.label}を選択`} /></td>
                  <td className="p2-table__primary">
                    <Link href={`/${kind}/${row.id}`}>{row.label}</Link>
                    <span>{row.secondary}</span>
                    <div className="p2-table__tags">{row.tags.slice(0, 2).map((tag) => <span key={tag}>{tag}</span>)}</div>
                  </td>
                  <td className="p2-num"><strong>{formatNumber(row.clicks)}</strong><small className={row.clickDelta >= 0 ? 'is-up' : 'is-down'}>{signed(row.clickDelta)}</small></td>
                  <td className="p2-num">{formatNumber(row.impressions)}<small className={row.impressionDelta >= 0 ? 'is-up' : 'is-down'}>{signed(row.impressionDelta)}</small></td>
                  <td className="p2-num">{row.ctr.toFixed(2)}%<small className={row.ctrDelta >= 0 ? 'is-up' : 'is-down'}>{signed(row.ctrDelta, 'pt')}</small></td>
                  <td className="p2-num">{row.position.toFixed(1)}<small className={row.positionDelta <= 0 ? 'is-up' : 'is-down'}>{row.positionDelta > 0 ? '+' : ''}{row.positionDelta.toFixed(1)}</small></td>
                  <td><DeltaPill value={row.clickDelta} /></td>
                  <td><Sparkline values={row.spark} positive={row.trend !== 'down'} /></td>
                  <td><span className={`p2-score p2-score--${row.score >= 90 ? 'high' : row.score >= 80 ? 'mid' : 'low'}`}>{row.score}</span></td>
                  <td><PriorityBadge value={row.priority} /></td>
                  <td><IconButton label={`${row.label}のメニュー`}><MoreHorizontal size={14} /></IconButton></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p2-explorer__foot">
          <span>{filtered.length}件表示 / 全{rows.length}件</span>
          <Pagination pages={3} current={1} />
        </div>
      </Card>
    </>
  );
}

function SortableTh({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return <th><button className={cx('p2-sort', active && 'is-active')} type="button" onClick={onClick}>{label}<ArrowUpDown /></button></th>;
}

function DeltaPill({ value }: { value: number }) {
  const Icon = value >= 0 ? ArrowUpRight : ArrowDownRight;
  return <span className={cx('p2-delta', value >= 0 ? 'is-up' : 'is-down')}><Icon />{signed(Math.abs(value))}</span>;
}

function CompactStat({ label, value, meta, trend, good = false }: { label: string; value: string; meta: string; trend: string; good?: boolean }) {
  return (
    <div className="p2-compact-stat">
      <span className="p2-compact-stat__label">{label}</span>
      <strong>{value}</strong>
      <div><span className={good || trend.startsWith('+') ? 'is-up' : 'is-down'}>{trend}</span><small>{meta}</small></div>
    </div>
  );
}

export function OpportunityBoard({ items }: { items: Opportunity[] }) {
  const [type, setType] = useState<'すべて' | Opportunity['type']>('すべて');
  const [sort, setSort] = useState<'score' | 'impressions'>('score');
  const types: Array<'すべて' | Opportunity['type']> = ['すべて', '順位改善', 'CTR改善', '成長', '回復', '内部リンク'];
  const filtered = useMemo(() => items
    .filter((item) => type === 'すべて' || item.type === type)
    .sort((a, b) => sort === 'score' ? b.score - a.score : b.impressions - a.impressions), [items, sort, type]);

  return (
    <>
      <div className="p2-opportunity-summary">
        <div><Sparkles /><span>発見した改善機会</span><strong>{items.length}</strong><small>件</small></div>
        <div><Target /><span>推定高インパクト</span><strong>{items.filter((item) => item.impact === '大').length}</strong><small>件</small></div>
        <div><Clock3 /><span>低工数で実行可能</span><strong>{items.filter((item) => item.effort === '低').length}</strong><small>件</small></div>
        <div><ArrowUpRight /><span>平均Opportunity Score</span><strong>{Math.round(items.reduce((sum, item) => sum + item.score, 0) / items.length)}</strong><small>/100</small></div>
      </div>
      <Card className="p2-board" padded={false}>
        <div className="p2-board__toolbar">
          <div className="p2-segment-tabs">
            {types.map((item) => <button key={item} type="button" className={type === item ? 'is-active' : ''} onClick={() => setType(item)}>{item}</button>)}
          </div>
          <select className="p2-mini-select" value={sort} onChange={(event) => setSort(event.target.value as 'score' | 'impressions')}>
            <option value="score">Score順</option><option value="impressions">表示回数順</option>
          </select>
        </div>
        <div className="p2-opportunity-list">
          {filtered.map((item, index) => (
            <article className="p2-opportunity" key={item.id}>
              <div className="p2-opportunity__rank">#{index + 1}</div>
              <div className="p2-opportunity__main">
                <div className="p2-opportunity__badges"><Badge tone="info">{item.type}</Badge><span>Impact {item.impact}</span><span>Effort {item.effort}</span></div>
                <h3>{item.title}</h3>
                <code>{item.target}</code>
                <p>{item.reason}</p>
                <div className="p2-recommendation"><Sparkles /><span><strong>推奨アクション</strong>{item.action}</span></div>
              </div>
              <div className="p2-opportunity__metrics">
                <div><span>表示回数</span><strong>{formatNumber(item.impressions)}</strong></div>
                <div><span>平均順位</span><strong>{item.position.toFixed(1)}</strong></div>
                <div><span>変化</span><strong className={item.delta >= 0 ? 'is-up' : 'is-down'}>{signed(item.delta)}</strong></div>
              </div>
              <div className="p2-opportunity__score"><strong>{item.score}</strong><span>Opportunity<br />Score</span><Button size="sm">詳しく見る</Button></div>
            </article>
          ))}
        </div>
      </Card>
    </>
  );
}

export function SignalExplorer({ mode, rows }: { mode: 'growth' | 'decline' | 'ctr'; rows: SignalRow[] }) {
  const [search, setSearch] = useState('');
  const labels = {
    growth: { title: '伸びているシグナル', summary: '成長を止めずに次の一手を打つ候補', tone: 'success' as const },
    decline: { title: '下落シグナル', summary: '影響度の高い下落から原因を切り分け', tone: 'danger' as const },
    ctr: { title: 'CTR改善候補', summary: '順位の割にクリックされていない検索結果', tone: 'warning' as const },
  }[mode];
  const filtered = rows.filter((row) => `${row.label} ${row.secondary}`.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p2-signal-layout">
      <Card className="p2-signal-main" padded={false}>
        <div className="p2-signal-main__head">
          <div><h2>{labels.title}</h2><p>{labels.summary}</p></div>
          <Badge tone={labels.tone}>{filtered.length}件</Badge>
        </div>
        <div className="p2-signal-filter">
          <label className="p2-search"><Search /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="クエリ・ページを検索..." /></label>
          <button type="button" className="p2-filter-button"><SlidersHorizontal />条件</button>
        </div>
        <div className="p2-signal-list">
          {filtered.map((row) => (
            <article className="p2-signal-row" key={row.id}>
              <div className={`p2-signal-icon p2-signal-icon--${mode}`}>{mode === 'growth' ? <ArrowUpRight /> : mode === 'decline' ? <ArrowDownRight /> : <Target />}</div>
              <div className="p2-signal-row__main"><strong>{row.label}</strong><span>{row.secondary}</span><p>{row.reason}</p></div>
              <div className="p2-signal-row__chart"><Sparkline values={row.spark} positive={mode !== 'decline'} /></div>
              <div className="p2-signal-row__metrics"><strong>{row.primaryMetric}</strong><span>{formatNumber(row.impressions)} imp.</span><span>{row.position.toFixed(1)}位 / CTR {row.ctr.toFixed(2)}%</span></div>
              <PriorityBadge value={row.severity} />
              <Button size="sm" variant="secondary">{row.action}</Button>
            </article>
          ))}
        </div>
      </Card>
      <aside className="p2-signal-side">
        <Card>
          <CardHeader title="判定ロジック" description="Phase 2ではダミー判定を可視化" />
          <div className="p2-rule-list">
            <div><span>クリック変化</span><strong>{mode === 'growth' ? '+15%以上' : mode === 'decline' ? '-10%以下' : '順位帯比で低CTR'}</strong></div>
            <div><span>最低表示回数</span><strong>1,000+</strong></div>
            <div><span>比較期間</span><strong>28日 vs 前28日</strong></div>
            <div><span>ノイズ除外</span><strong>ブランド / 低母数</strong></div>
          </div>
        </Card>
        <Card>
          <CardHeader title="内訳" description="原因カテゴリ" />
          <div className="p2-diagnosis">
            <div><span>順位要因</span><strong>46%</strong><i style={{ width: '46%' }} /></div>
            <div><span>CTR要因</span><strong>29%</strong><i style={{ width: '29%' }} /></div>
            <div><span>需要要因</span><strong>17%</strong><i style={{ width: '17%' }} /></div>
            <div><span>その他</span><strong>8%</strong><i style={{ width: '8%' }} /></div>
          </div>
        </Card>
      </aside>
    </div>
  );
}

export function CannibalizationExplorer({ groups }: { groups: Array<{ id: string; query: string; overlap: number; clicks: number; impressions: number; priority: Priority; pages: Array<{ url: string; clicks: number; position: number; share: number }>; recommendation: string }> }) {
  const [open, setOpen] = useState(groups[0]?.id ?? '');
  return (
    <div className="p2-cannibal-list">
      {groups.map((group) => {
        const expanded = open === group.id;
        return (
          <Card className={cx('p2-cannibal', expanded && 'is-open')} key={group.id} padded={false}>
            <button className="p2-cannibal__summary" type="button" onClick={() => setOpen(expanded ? '' : group.id)}>
              <div className="p2-cannibal__query"><Layers3 /><span><strong>{group.query}</strong><small>{group.pages.length} URLが競合</small></span></div>
              <div><span>重複度</span><strong>{group.overlap}%</strong></div>
              <div><span>クリック</span><strong>{formatNumber(group.clicks)}</strong></div>
              <div><span>表示回数</span><strong>{formatNumber(group.impressions)}</strong></div>
              <PriorityBadge value={group.priority} />
              <ChevronRight className={expanded ? 'is-rotated' : ''} />
            </button>
            {expanded && (
              <div className="p2-cannibal__detail">
                <div className="p2-cannibal-pages">
                  {group.pages.map((page, index) => (
                    <div className="p2-cannibal-page" key={page.url}>
                      <span className={index === 0 ? 'is-primary' : ''}>{index === 0 ? '主' : index + 1}</span>
                      <code>{page.url}</code>
                      <div><small>クリック</small><strong>{formatNumber(page.clicks)}</strong></div>
                      <div><small>平均順位</small><strong>{page.position.toFixed(1)}</strong></div>
                      <div className="p2-share"><small>シェア {page.share}%</small><i><b style={{ width: `${page.share}%` }} /></i></div>
                      <IconButton label="ページを開く"><ExternalLink /></IconButton>
                    </div>
                  ))}
                </div>
                <div className="p2-recommendation"><Sparkles /><span><strong>推奨アクション</strong>{group.recommendation}</span><Button size="sm">対応を記録</Button></div>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}

export function ReportsWorkspace() {
  const [modal, setModal] = useState(false);
  const [created, setCreated] = useState(false);

  const generate = () => { setCreated(true); setModal(false); };
  return (
    <>
      {created && <div className="p2-toast"><CheckCircle2 /><span><strong>レポートを生成しました</strong>ダミーレポートを一覧へ追加する想定のUXです。</span><button type="button" onClick={() => setCreated(false)}><X /></button></div>}
      <div className="p2-report-top">
        <Card className="p2-report-hero">
          <div><span className="p2-report-hero__icon"><FileDown /></span><div><h2>分析結果を共有できる形に</h2><p>期間比較、改善候補、急落をテンプレートからレポート化します。</p></div></div>
          <Button icon={<Plus />} onClick={() => setModal(true)}>新規レポート</Button>
        </Card>
        <Card><CardHeader title="今月の出力" /><strong className="p2-big-number">7</strong><span className="p2-muted">レポート / 6.2 MB</span></Card>
        <Card><CardHeader title="予約生成" /><strong className="p2-big-number">2</strong><span className="p2-muted">毎週月曜・毎月1日</span></Card>
      </div>
      <Card padded={false}>
        <div className="p2-explorer__head"><div><div className="p2-explorer__title">レポート履歴</div><div className="p2-explorer__desc">生成済みレポートを再ダウンロードできます。</div></div><Button size="sm" variant="secondary" icon={<CalendarDays />}>予約設定</Button></div>
        <div className="p2-table-wrap"><table className="p2-table p2-table--reports"><thead><tr><th>レポート名</th><th>種類</th><th>対象期間</th><th>作成日時</th><th>サイズ</th><th>状態</th><th /></tr></thead><tbody>{reports.map((report) => <tr key={report.id}><td className="p2-table__primary"><strong>{report.name}</strong><span>ID: {report.id}</span></td><td><Badge tone="info">{report.type}</Badge></td><td>{report.range}</td><td>{report.created}</td><td>{report.size}</td><td><Badge tone="success">{report.status}</Badge></td><td><Button size="sm" variant="ghost" icon={<Download />}>DL</Button></td></tr>)}</tbody></table></div>
      </Card>
      {modal && (
        <div className="p2-modal-backdrop" role="presentation" onMouseDown={() => setModal(false)}>
          <div className="p2-modal" role="dialog" aria-modal="true" aria-label="レポート生成" onMouseDown={(event) => event.stopPropagation()}>
            <div className="p2-modal__head"><div><h2>レポートを生成</h2><p>含める分析項目と期間を選択してください。</p></div><IconButton label="閉じる" onClick={() => setModal(false)}><X /></IconButton></div>
            <div className="p2-modal__body">
              <InputField label="レポート名" defaultValue="月次SEOパフォーマンス" />
              <div className="ui-form-grid"><SelectField label="テンプレート" defaultValue="monthly"><option value="monthly">月次サマリー</option><option value="opportunity">改善機会</option><option value="decline">急落監視</option></SelectField><SelectField label="対象期間" defaultValue="28"><option value="28">過去28日</option><option value="month">今月</option><option value="90">過去3か月</option></SelectField></div>
              <div className="p2-modal-section"><strong>含めるセクション</strong><div className="p2-check-grid"><Checkbox label="主要KPI" defaultChecked /><Checkbox label="クエリ分析" defaultChecked /><Checkbox label="ページ分析" defaultChecked /><Checkbox label="改善機会" defaultChecked /><Checkbox label="急落" defaultChecked /><Checkbox label="カニバリ" /></div></div>
              <div className="p2-modal-section"><strong>出力形式</strong><div className="p2-format-options"><button className="is-active" type="button">PDF</button><button type="button">CSV</button><button type="button">共有リンク</button></div></div>
            </div>
            <div className="p2-modal__foot"><Button variant="ghost" onClick={() => setModal(false)}>キャンセル</Button><Button icon={<FileDown />} onClick={generate}>レポート生成</Button></div>
          </div>
        </div>
      )}
    </>
  );
}

export function SettingsWorkspace() {
  return (
    <div className="p2-settings-layout">
      <aside className="p2-settings-nav"><a className="is-active" href="#properties">プロパティ</a><a href="#analysis">分析条件</a><a href="#notifications">通知</a><a href="#display">表示</a></aside>
      <div className="p2-settings-main">
        <Card id="properties" className="p2-settings-card">
          <CardHeader title="Search Console プロパティ" description="Phase 3でGoogle OAuth / GSC APIへ接続する想定の管理UI" action={<Button size="sm" icon={<Plus />}>追加</Button>} />
          <div className="p2-property-list">{properties.map((property) => <div className="p2-property" key={property.id}><span className="p2-property__icon"><Globe2 /></span><div><strong>{property.label}</strong><span>{property.pages} pages · 最終同期 {property.lastSync}</span></div><Badge tone={property.status === '正常' ? 'success' : 'warning'}>{property.status}</Badge><IconButton label="設定"><MoreHorizontal /></IconButton></div>)}</div>
        </Card>
        <Card id="analysis" className="p2-settings-card">
          <CardHeader title="分析しきい値" description="改善候補を抽出する基準値。Phase 3の分析エンジンで利用します。" />
          <div className="p2-setting-grid"><InputField label="急上昇判定" defaultValue="15" hint="クリック増加率 %" type="number" /><InputField label="急落判定" defaultValue="-10" hint="クリック変化率 %" type="number" /><InputField label="最低表示回数" defaultValue="1000" hint="ノイズ除外" type="number" /><InputField label="チャンス順位 上限" defaultValue="20" hint="11〜20位等" type="number" /></div>
          <div className="p2-switch-list"><Switch label="ブランドクエリを分析から除外" initial /><Switch label="低母数データを自動除外" initial /><Switch label="前年同期も比較候補に含める" /></div>
        </Card>
        <Card id="notifications" className="p2-settings-card">
          <CardHeader title="通知" description="重要な変化だけを通知する設計" action={<BellRing size={15} />} />
          <div className="p2-switch-list"><Switch label="重大な急落を通知" initial /><Switch label="急上昇クエリを通知" initial /><Switch label="週次サマリー" initial /><Switch label="CTR改善候補の増加" /></div>
        </Card>
        <Card id="display" className="p2-settings-card">
          <CardHeader title="表示・データ密度" description="高密度UIを保ちつつ環境に合わせて調整" />
          <div className="p2-setting-grid"><SelectField label="テーブル密度" defaultValue="dense"><option value="dense">高密度</option><option value="normal">標準</option></SelectField><SelectField label="既定期間" defaultValue="28"><option value="28">28日</option><option value="7">7日</option><option value="90">3か月</option></SelectField></div>
          <div className="p2-security"><ShieldCheck /><span><strong>UI preferences</strong>これらの設定は現在ダミー状態です。Phase 3で永続化レイヤーへ接続します。</span></div>
        </Card>
      </div>
    </div>
  );
}

export function DetailOverview({ row, kind, related }: { row: PerformanceRow; kind: 'query' | 'page'; related: PerformanceRow[] }) {
  return (
    <>
      <div className="p2-detail-kpis">
        <CompactStat label="クリック" value={formatNumber(row.clicks)} meta="過去28日" trend={signed(row.clickDelta)} />
        <CompactStat label="表示回数" value={formatNumber(row.impressions)} meta="過去28日" trend={signed(row.impressionDelta)} />
        <CompactStat label="CTR" value={`${row.ctr.toFixed(2)}%`} meta="過去28日" trend={signed(row.ctrDelta, 'pt')} />
        <CompactStat label="平均順位" value={row.position.toFixed(1)} meta="過去28日" trend={`${row.positionDelta > 0 ? '+' : ''}${row.positionDelta.toFixed(1)}`} good={row.positionDelta <= 0} />
        <CompactStat label="Opportunity Score" value={`${row.score}`} meta="100点満点" trend={row.priority === '高' ? '優先度 高' : `優先度 ${row.priority}`} />
      </div>
      <div className="p2-detail-grid">
        <Card className="p2-detail-trend"><CardHeader title="パフォーマンス推移" description="28日間の変化を簡易表示" action={<Badge tone={row.trend === 'down' ? 'danger' : 'success'}>{row.trend === 'down' ? '下降' : '上昇'}</Badge>} /><div className="p2-large-trend"><MicroBars values={[...row.spark, ...row.spark.map((v) => Math.max(4, v + (row.trend === 'down' ? -5 : 5)))]} /></div><div className="p2-trend-axis"><span>7/29</span><span>8/05</span><span>8/12</span><span>8/19</span><span>8/25</span></div></Card>
        <Card><CardHeader title="分析メモ" description="ダミーデータからの診断" /><div className="p2-detail-insights"><div><CheckCircle2 /><span><strong>{row.trend === 'down' ? '回復余地があります' : '良いモメンタムです'}</strong>{row.trend === 'down' ? '順位・CTR・競合変化を優先確認してください。' : '現在の成長テーマを周辺クエリへ拡張する価値があります。'}</span></div><div><Target /><span><strong>改善優先度 {row.priority}</strong>Score {row.score}。表示回数と順位を加味したダミースコアです。</span></div><div><Sparkles /><span><strong>推奨</strong>{row.tags.includes('CTR改善') ? 'title / descriptionの改善を最優先にします。' : '関連コンテンツと内部リンクを強化します。'}</span></div></div></Card>
      </div>
      <Card padded={false}>
        <div className="p2-explorer__head"><div><div className="p2-explorer__title">{kind === 'query' ? '関連ページ' : '主要流入クエリ'}</div><div className="p2-explorer__desc">詳細分析に必要な関連データのプレビュー</div></div><Button size="sm" variant="secondary">すべて見る</Button></div>
        <div className="p2-related-list">{related.slice(0, 5).map((item) => <div key={item.id}><span><strong>{item.label}</strong><small>{item.secondary}</small></span><span>{formatNumber(item.clicks)} clicks</span><span>{item.ctr.toFixed(2)}% CTR</span><span>{item.position.toFixed(1)}位</span><Sparkline values={item.spark} positive={item.trend !== 'down'} /></div>)}</div>
      </Card>
    </>
  );
}
