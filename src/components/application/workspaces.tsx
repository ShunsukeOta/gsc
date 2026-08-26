'use client';

import Link from 'next/link';
import {
  ArrowDownRight,
  ArrowUpRight,
  ArrowUpDown,
  Bookmark,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Copy,
  Download,
  ExternalLink,
  Filter,
  Layers3,
  MoreHorizontal,
  Search,
  Sparkles,
  Target,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Badge, Button, Card, Checkbox, Chip, EmptyState, IconButton, Pagination, cx } from '@/components/ui';
import type { Opportunity, PerformanceRow, Priority } from '@/lib/analysis-types';
import { OpportunityActionDrawer } from './action-center';
import { Sparkline } from './visuals';
import { useGscWorkspace } from './gsc-context';

const formatNumber = (value: number) => new Intl.NumberFormat('ja-JP').format(value);
const signed = (value: number, suffix = '%') => `${value > 0 ? '+' : ''}${value.toFixed(1)}${suffix}`;
const PAGE_SIZE = 50;

function PriorityBadge({ value }: { value: Priority }) {
  return <Badge tone={value === '高' ? 'danger' : value === '中' ? 'warning' : 'neutral'}>{value}</Badge>;
}

function searchTypeLabel(type: 'web' | 'image' | 'video') {
  return type === 'image' ? '画像検索' : type === 'video' ? '動画検索' : 'ウェブ検索';
}

function deviceLabel(device: string) {
  return device === 'MOBILE' ? 'モバイル' : device === 'DESKTOP' ? 'デスクトップ' : device === 'TABLET' ? 'タブレット' : '全デバイス';
}

function csvCell(value: unknown) {
  const text = value == null ? '' : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

function downloadRows(filename: string, rows: PerformanceRow[]) {
  if (!rows.length) return;
  const data = rows.map((row) => ({
    target: row.label,
    secondary: row.secondary ?? '',
    clicks: row.clicks,
    impressions: row.impressions,
    ctr_percent: row.ctr,
    position: row.position,
    clicks_delta_percent: row.clickDelta,
    impressions_delta_percent: row.impressionDelta,
    ctr_delta_pt: row.ctrDelta,
    position_delta: row.positionDelta,
    opportunity_score: row.score,
    priority: row.priority,
    tags: row.tags.join('|'),
  }));
  const headers = Object.keys(data[0]);
  const csv = [headers.map(csvCell).join(','), ...data.map((row) => headers.map((key) => csvCell(row[key as keyof typeof row])).join(','))].join('\r\n');
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function previousValue(current: number, delta: number) {
  if (delta <= -99.99) return current > 0 ? 0 : current;
  const factor = 1 + delta / 100;
  return factor > 0 ? current / factor : 0;
}

function aggregateDelta(rows: PerformanceRow[], key: 'clicks' | 'impressions') {
  const deltaKey = key === 'clicks' ? 'clickDelta' : 'impressionDelta';
  const current = rows.reduce((sum, row) => sum + row[key], 0);
  const previous = rows.reduce((sum, row) => sum + previousValue(row[key], row[deltaKey]), 0);
  return previous > 0 ? ((current - previous) / previous) * 100 : current > 0 ? 100 : 0;
}

function weightedAverage(rows: PerformanceRow[], key: 'ctr' | 'position') {
  const impressions = rows.reduce((sum, row) => sum + row.impressions, 0);
  if (!impressions) return 0;
  return rows.reduce((sum, row) => sum + row[key] * row.impressions, 0) / impressions;
}

function CompactStat({ label, value, meta, trend, good = false }: { label: string; value: string; meta: string; trend: string; good?: boolean }) {
  return (
    <div className="p2-compact-stat">
      <span className="p2-compact-stat__label">{label}</span>
      <strong>{value}</strong>
      <div><span className={good || trend.startsWith('+') ? 'is-up' : trend === '-' ? '' : 'is-down'}>{trend}</span><small>{meta}</small></div>
    </div>
  );
}

type SortKey = 'clicks' | 'impressions' | 'ctr' | 'position' | 'score';
type TrendFilter = 'all' | 'up' | 'down' | 'flat';
type SavedView = { search: string; priority: 'all' | Priority; trend: TrendFilter; minImpressions: number; sortKey: SortKey; descending: boolean };

export function PerformanceExplorer({ kind, rows }: { kind: 'queries' | 'pages'; rows: PerformanceRow[] }) {
  const workspace = useGscWorkspace();
  const [search, setSearch] = useState('');
  const [priority, setPriority] = useState<'all' | Priority>('all');
  const [trend, setTrend] = useState<TrendFilter>('all');
  const [minImpressions, setMinImpressions] = useState(0);
  const [sortKey, setSortKey] = useState<SortKey>('clicks');
  const [descending, setDescending] = useState(true);
  const [selected, setSelected] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);
  const [advanced, setAdvanced] = useState(false);
  const [page, setPage] = useState(1);
  const [compareOpen, setCompareOpen] = useState(false);
  const [menuId, setMenuId] = useState('');
  const [copiedId, setCopiedId] = useState('');

  const viewKey = `gsc-view:${workspace.selectedSite}|${workspace.searchType}|${kind}`;
  useEffect(() => {
    setSelected([]);
    setPage(1);
    setSaved(false);
    try {
      const raw = window.localStorage.getItem(viewKey);
      if (!raw) return;
      const view = JSON.parse(raw) as Partial<SavedView>;
      if (typeof view.search === 'string') setSearch(view.search);
      if (view.priority === 'all' || view.priority === '高' || view.priority === '中' || view.priority === '低') setPriority(view.priority);
      if (view.trend === 'all' || view.trend === 'up' || view.trend === 'down' || view.trend === 'flat') setTrend(view.trend);
      if (typeof view.minImpressions === 'number') setMinImpressions(Math.max(0, view.minImpressions));
      if (view.sortKey && ['clicks', 'impressions', 'ctr', 'position', 'score'].includes(view.sortKey)) setSortKey(view.sortKey);
      if (typeof view.descending === 'boolean') setDescending(view.descending);
      setSaved(true);
    } catch {
      // Invalid local preference is ignored.
    }
  }, [viewKey]);

  const filtered = useMemo(() => rows
    .filter((row) => {
      const hit = `${row.label} ${row.secondary ?? ''} ${row.tags.join(' ')}`.toLowerCase().includes(search.toLowerCase());
      return hit && (priority === 'all' || row.priority === priority) && (trend === 'all' || row.trend === trend) && row.impressions >= minImpressions;
    })
    .sort((a, b) => {
      const diff = a[sortKey] - b[sortKey];
      return descending ? -diff : diff;
    }), [descending, minImpressions, priority, rows, search, sortKey, trend]);

  useEffect(() => setPage(1), [search, priority, trend, minImpressions, sortKey, descending]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pages);
  const visibleRows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const selectedRows = rows.filter((row) => selected.includes(row.id));
  const totals = useMemo(() => {
    const clicks = rows.reduce((sum, row) => sum + row.clicks, 0);
    const impressions = rows.reduce((sum, row) => sum + row.impressions, 0);
    return {
      clicks,
      impressions,
      ctr: impressions ? (clicks / impressions) * 100 : 0,
      position: weightedAverage(rows, 'position'),
      clickDelta: aggregateDelta(rows, 'clicks'),
      impressionDelta: aggregateDelta(rows, 'impressions'),
    };
  }, [rows]);

  const toggleAll = () => {
    const pageIds = visibleRows.map((row) => row.id);
    const allSelected = pageIds.every((id) => selected.includes(id));
    setSelected((current) => allSelected ? current.filter((id) => !pageIds.includes(id)) : [...new Set([...current, ...pageIds])]);
  };
  const toggleRow = (id: string) => setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  const changeSort = (key: SortKey) => {
    if (sortKey === key) setDescending((value) => !value);
    else { setSortKey(key); setDescending(true); }
  };
  const saveView = () => {
    const view: SavedView = { search, priority, trend, minImpressions, sortKey, descending };
    window.localStorage.setItem(viewKey, JSON.stringify(view));
    setSaved(true);
  };
  const clearFilters = () => {
    setSearch('');
    setPriority('all');
    setTrend('all');
    setMinImpressions(0);
    setAdvanced(false);
  };
  const copyLabel = async (row: PerformanceRow) => {
    try {
      await navigator.clipboard.writeText(row.label);
      setCopiedId(row.id);
      window.setTimeout(() => setCopiedId(''), 1500);
    } catch {
      // Clipboard may be blocked by browser policy; no destructive fallback is attempted.
    }
    setMenuId('');
  };

  const slug = workspace.selectedSite.replace(/^https?:\/\//, '').replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/-+$/g, '') || 'gsc';
  const currentAllSelected = visibleRows.length > 0 && visibleRows.every((row) => selected.includes(row.id));

  return (
    <>
      <div className="p2-summary-grid">
        <CompactStat label="クリック" value={formatNumber(totals.clicks)} meta="対象行合計" trend={rows.length ? signed(totals.clickDelta) : '-'} />
        <CompactStat label="表示回数" value={formatNumber(totals.impressions)} meta="対象行合計" trend={rows.length ? signed(totals.impressionDelta) : '-'} />
        <CompactStat label="CTR" value={rows.length ? `${totals.ctr.toFixed(2)}%` : '-'} meta="クリック÷表示回数" trend="-" />
        <CompactStat label="平均順位" value={rows.length ? totals.position.toFixed(1) : '-'} meta="表示回数加重平均" trend="-" good />
      </div>

      <Card className="p2-explorer" padded={false}>
        <div className="p2-explorer__head">
          <div><div className="p2-explorer__title">{kind === 'queries' ? '検索クエリ一覧' : 'ページ一覧'}</div><div className="p2-explorer__desc">実GSCデータを検索・絞り込み・比較・出力できます。</div></div>
          <div className="p2-explorer__head-actions">
            <Button size="sm" variant="ghost" icon={saved ? <CheckCircle2 /> : <Bookmark />} onClick={saveView}>{saved ? 'ビュー保存済み' : 'ビュー保存'}</Button>
            <Button size="sm" variant="secondary" icon={<Download />} disabled={!filtered.length} onClick={() => downloadRows(`${slug}-${workspace.searchType}-${kind}-${workspace.analysis?.range.endDate ?? 'data'}.csv`, filtered)}>CSV出力</Button>
          </div>
        </div>

        <div className="p2-explorer__filters">
          <label className="p2-search"><Search aria-hidden="true" /><input value={search} onChange={(event) => { setSearch(event.target.value); setSaved(false); }} placeholder={kind === 'queries' ? 'クエリを検索...' : 'URLを検索...'} />{search && <button type="button" onClick={() => setSearch('')} aria-label="検索をクリア"><X /></button>}</label>
          <select className="p2-mini-select" value={priority} onChange={(event) => { setPriority(event.target.value as 'all' | Priority); setSaved(false); }}><option value="all">優先度: すべて</option><option value="高">優先度: 高</option><option value="中">優先度: 中</option><option value="低">優先度: 低</option></select>
          <button className={cx('p2-filter-button', advanced && 'is-active')} type="button" onClick={() => setAdvanced((value) => !value)}><Filter />詳細フィルター</button>
          <div className="p2-filter-chips"><Chip>{searchTypeLabel(workspace.searchType)}</Chip><Chip>{deviceLabel(workspace.device)}</Chip><Chip>過去{workspace.days}日</Chip></div>
        </div>

        {advanced && <div className="p5-advanced-filters"><label><span>トレンド</span><select value={trend} onChange={(event) => { setTrend(event.target.value as TrendFilter); setSaved(false); }}><option value="all">すべて</option><option value="up">上昇</option><option value="down">下降</option><option value="flat">横ばい</option></select></label><label><span>最低表示回数</span><input type="number" min="0" value={minImpressions} onChange={(event) => { setMinImpressions(Math.max(0, Number(event.target.value) || 0)); setSaved(false); }} /></label><button type="button" onClick={clearFilters}>条件をリセット</button></div>}

        {selected.length > 0 && <div className="p2-selection-bar"><strong>{selected.length}件を選択</strong><span>選択行の指標を横並びで比較できます。</span><Button size="sm" variant="secondary" disabled={selected.length < 2} onClick={() => setCompareOpen(true)}>比較する</Button><button type="button" onClick={() => setSelected([])}>選択解除</button></div>}

        <div className="p2-table-wrap">
          <table className="p2-table">
            <thead><tr><th className="p2-table__check"><input type="checkbox" checked={currentAllSelected} onChange={toggleAll} aria-label="このページをすべて選択" /></th><th>{kind === 'queries' ? 'クエリ' : 'ページ'}</th><SortableTh label="クリック" active={sortKey === 'clicks'} onClick={() => changeSort('clicks')} /><SortableTh label="表示回数" active={sortKey === 'impressions'} onClick={() => changeSort('impressions')} /><SortableTh label="CTR" active={sortKey === 'ctr'} onClick={() => changeSort('ctr')} /><SortableTh label="平均順位" active={sortKey === 'position'} onClick={() => changeSort('position')} /><th>変化</th><th>推移</th><SortableTh label="Score" active={sortKey === 'score'} onClick={() => changeSort('score')} /><th>優先度</th><th aria-label="操作" /></tr></thead>
            <tbody>
              {visibleRows.map((row) => (
                <tr key={row.id} className={selected.includes(row.id) ? 'is-selected' : undefined}>
                  <td className="p2-table__check"><input type="checkbox" checked={selected.includes(row.id)} onChange={() => toggleRow(row.id)} aria-label={`${row.label}を選択`} /></td>
                  <td className="p2-table__primary"><Link href={`/${kind}/${row.id}`}>{row.label}</Link><span>{row.secondary}</span><div className="p2-table__tags">{row.tags.slice(0, 2).map((tag) => <span key={tag}>{tag}</span>)}</div></td>
                  <td className="p2-num"><strong>{formatNumber(row.clicks)}</strong><small className={row.clickDelta >= 0 ? 'is-up' : 'is-down'}>{signed(row.clickDelta)}</small></td>
                  <td className="p2-num">{formatNumber(row.impressions)}<small className={row.impressionDelta >= 0 ? 'is-up' : 'is-down'}>{signed(row.impressionDelta)}</small></td>
                  <td className="p2-num">{row.ctr.toFixed(2)}%<small className={row.ctrDelta >= 0 ? 'is-up' : 'is-down'}>{signed(row.ctrDelta, 'pt')}</small></td>
                  <td className="p2-num">{row.position.toFixed(1)}<small className={row.positionDelta <= 0 ? 'is-up' : 'is-down'}>{row.positionDelta > 0 ? '+' : ''}{row.positionDelta.toFixed(1)}</small></td>
                  <td><DeltaPill value={row.clickDelta} /></td><td><Sparkline values={row.spark} positive={row.trend !== 'down'} /></td><td><span className={`p2-score p2-score--${row.score >= 90 ? 'high' : row.score >= 80 ? 'mid' : 'low'}`}>{row.score}</span></td><td><PriorityBadge value={row.priority} /></td>
                  <td className="p5-row-menu-cell"><IconButton label={`${row.label}のメニュー`} onClick={() => setMenuId((current) => current === row.id ? '' : row.id)}><MoreHorizontal size={14} /></IconButton>{menuId === row.id && <div className="p5-row-menu"><Link href={`/${kind}/${row.id}`} onClick={() => setMenuId('')}><Target />詳細分析</Link><button type="button" onClick={() => void copyLabel(row)}>{copiedId === row.id ? <CheckCircle2 /> : <Copy />}{copiedId === row.id ? 'コピー済み' : kind === 'queries' ? 'クエリをコピー' : 'URLをコピー'}</button>{kind === 'pages' && row.label.startsWith('http') && <a href={row.label} target="_blank" rel="noreferrer" onClick={() => setMenuId('')}><ExternalLink />実ページを開く</a>}</div>}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!visibleRows.length && <EmptyState title="条件に一致するデータがありません" text="検索語またはフィルター条件を変更してください。" />}
        </div>
        <div className="p2-explorer__foot"><span>{filtered.length ? `${(safePage - 1) * PAGE_SIZE + 1}〜${Math.min(safePage * PAGE_SIZE, filtered.length)}件` : '0件'} / 全{filtered.length}件</span><Pagination pages={pages} current={safePage} onChange={setPage} /></div>
      </Card>

      {compareOpen && <div className="p5-compare-backdrop" role="presentation" onMouseDown={() => setCompareOpen(false)}><div className="p5-compare-modal" role="dialog" aria-modal="true" aria-label="選択行比較" onMouseDown={(event) => event.stopPropagation()}><div className="p5-compare-head"><div><strong>選択データ比較</strong><span>{selectedRows.length}件を同一指標で比較</span></div><IconButton label="閉じる" onClick={() => setCompareOpen(false)}><X /></IconButton></div><div className="p5-compare-table-wrap"><table className="p5-compare-table"><thead><tr><th>対象</th><th>クリック</th><th>表示回数</th><th>CTR</th><th>順位</th><th>変化</th><th>Score</th></tr></thead><tbody>{selectedRows.slice(0, 20).map((row) => <tr key={row.id}><td><code>{row.label}</code></td><td>{formatNumber(row.clicks)}</td><td>{formatNumber(row.impressions)}</td><td>{row.ctr.toFixed(2)}%</td><td>{row.position.toFixed(1)}</td><td className={row.clickDelta >= 0 ? 'is-up' : 'is-down'}>{signed(row.clickDelta)}</td><td>{row.score}</td></tr>)}</tbody></table></div>{selectedRows.length > 20 && <div className="p5-compare-note">比較画面は先頭20件を表示しています。CSVでは全選択対象を扱えます。</div>}</div></div>}
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

export function OpportunityBoard({ items }: { items: Opportunity[] }) {
  const [type, setType] = useState<'すべて' | Opportunity['type']>('すべて');
  const [sort, setSort] = useState<'score' | 'impressions'>('score');
  const [selected, setSelected] = useState<Opportunity | null>(null);
  const types: Array<'すべて' | Opportunity['type']> = ['すべて', '順位改善', 'CTR改善', '成長', '回復', '内部リンク'];
  const filtered = useMemo(() => items.filter((item) => type === 'すべて' || item.type === type).sort((a, b) => sort === 'score' ? b.score - a.score : b.impressions - a.impressions), [items, sort, type]);
  const average = items.length ? Math.round(items.reduce((sum, item) => sum + item.score, 0) / items.length) : 0;

  return (
    <>
      <div className="p2-opportunity-summary"><div><Sparkles /><span>発見した改善機会</span><strong>{items.length}</strong><small>件</small></div><div><Target /><span>推定高インパクト</span><strong>{items.filter((item) => item.impact === '大').length}</strong><small>件</small></div><div><Clock3 /><span>低工数で実行可能</span><strong>{items.filter((item) => item.effort === '低').length}</strong><small>件</small></div><div><ArrowUpRight /><span>平均Opportunity Score</span><strong>{average}</strong><small>/100</small></div></div>
      <Card className="p2-board" padded={false}>
        <div className="p2-board__toolbar"><div className="p2-segment-tabs">{types.map((item) => <button key={item} type="button" className={type === item ? 'is-active' : ''} onClick={() => setType(item)}>{item}</button>)}</div><select className="p2-mini-select" value={sort} onChange={(event) => setSort(event.target.value as 'score' | 'impressions')}><option value="score">Score順</option><option value="impressions">表示回数順</option></select></div>
        <div className="p2-opportunity-list">
          {filtered.map((item, index) => <article className="p2-opportunity" key={item.id}><div className="p2-opportunity__rank">#{index + 1}</div><div className="p2-opportunity__main"><div className="p2-opportunity__badges"><Badge tone="info">{item.type}</Badge><span>Impact {item.impact}</span><span>Effort {item.effort}</span></div><h3>{item.title}</h3><code>{item.target}</code><p>{item.reason}</p><div className="p2-recommendation"><Sparkles /><span><strong>推奨アクション</strong>{item.action}</span></div></div><div className="p2-opportunity__metrics"><div><span>表示回数</span><strong>{formatNumber(item.impressions)}</strong></div><div><span>平均順位</span><strong>{item.position.toFixed(1)}</strong></div><div><span>変化</span><strong className={item.delta >= 0 ? 'is-up' : 'is-down'}>{signed(item.delta)}</strong></div></div><div className="p2-opportunity__score"><strong>{item.score}</strong><span>Opportunity<br />Score</span><Button size="sm" onClick={() => setSelected(item)}>詳しく見る</Button></div></article>)}
          {!filtered.length && <EmptyState title="該当する改善機会はありません" text="別のOpportunity種別を選択してください。" />}
        </div>
      </Card>
      <OpportunityActionDrawer opportunity={selected} onClose={() => setSelected(null)} />
    </>
  );
}

const CANNIBAL_KEY = 'gsc-analyzer-cannibal-actions-v1';
export function CannibalizationExplorer({ groups }: { groups: Array<{ id: string; query: string; overlap: number; clicks: number; impressions: number; priority: Priority; pages: Array<{ url: string; clicks: number; position: number; share: number }>; recommendation: string }> }) {
  const workspace = useGscWorkspace();
  const [open, setOpen] = useState(groups[0]?.id ?? '');
  const [resolved, setResolved] = useState<Set<string>>(new Set());
  const scope = `${workspace.selectedSite}|${workspace.searchType}`;

  useEffect(() => {
    try {
      const raw = JSON.parse(window.localStorage.getItem(CANNIBAL_KEY) ?? '{}') as Record<string, Record<string, string>>;
      setResolved(new Set(Object.keys(raw[scope] ?? {})));
    } catch { setResolved(new Set()); }
  }, [scope]);

  const toggleResolved = (id: string) => {
    setResolved((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id); else next.add(id);
      let store: Record<string, Record<string, string>> = {};
      try { store = JSON.parse(window.localStorage.getItem(CANNIBAL_KEY) ?? '{}') as Record<string, Record<string, string>>; } catch { store = {}; }
      const scoped = { ...(store[scope] ?? {}) };
      if (next.has(id)) scoped[id] = new Date().toISOString(); else delete scoped[id];
      store[scope] = scoped;
      window.localStorage.setItem(CANNIBAL_KEY, JSON.stringify(store));
      return next;
    });
  };

  if (!groups.length) return <EmptyState title="カニバリ候補はありません" text="現在のquery × pageデータでは、評価分散が強い候補は検出されませんでした。" />;
  return (
    <div className="p2-cannibal-list">
      {groups.map((group) => {
        const expanded = open === group.id;
        const done = resolved.has(group.id);
        return <Card className={cx('p2-cannibal', expanded && 'is-open', done && 'is-resolved')} key={group.id} padded={false}><button className="p2-cannibal__summary" type="button" onClick={() => setOpen(expanded ? '' : group.id)}><div className="p2-cannibal__query"><Layers3 /><span><strong>{group.query}</strong><small>{group.pages.length} URLが競合{done ? ' / 対応済み' : ''}</small></span></div><div><span>重複度</span><strong>{group.overlap}%</strong></div><div><span>クリック</span><strong>{formatNumber(group.clicks)}</strong></div><div><span>表示回数</span><strong>{formatNumber(group.impressions)}</strong></div><PriorityBadge value={group.priority} /><ChevronRight className={expanded ? 'is-rotated' : ''} /></button>{expanded && <div className="p2-cannibal__detail"><div className="p2-cannibal-pages">{group.pages.map((page, index) => <div className="p2-cannibal-page" key={page.url}><span className={index === 0 ? 'is-primary' : ''}>{index === 0 ? '主' : index + 1}</span><code>{page.url}</code><div><small>クリック</small><strong>{formatNumber(page.clicks)}</strong></div><div><small>平均順位</small><strong>{page.position.toFixed(1)}</strong></div><div className="p2-share"><small>シェア {page.share}%</small><i><b style={{ width: `${page.share}%` }} /></i></div>{page.url.startsWith('http') ? <a className="ui-icon-button" aria-label="ページを開く" href={page.url} target="_blank" rel="noreferrer"><ExternalLink /></a> : <IconButton label="URLをコピー" onClick={() => void navigator.clipboard.writeText(page.url)}><Copy /></IconButton>}</div>)}</div><div className="p2-recommendation"><Sparkles /><span><strong>推奨アクション</strong>{group.recommendation}</span><Button size="sm" variant={done ? 'ghost' : 'secondary'} icon={done ? <CheckCircle2 /> : undefined} onClick={() => toggleResolved(group.id)}>{done ? '対応済みを解除' : '対応を記録'}</Button></div></div>}</Card>;
      })}
    </div>
  );
}
