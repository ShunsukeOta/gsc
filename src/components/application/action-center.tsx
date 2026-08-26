'use client';

import Link from 'next/link';
import {
  Bot,
  CheckCircle2,
  ClipboardCheck,
  ExternalLink,
  LoaderCircle,
  Save,
  Sparkles,
  Target,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Badge, Button, EmptyState, IconButton } from '@/components/ui';
import type { Opportunity, SignalRow } from '@/lib/analysis-types';
import { useGscWorkspace } from './gsc-context';

const STORAGE_KEY = 'gsc-analyzer-action-log-v1';
type ActionStatus = 'todo' | 'doing' | 'done';
type ActionRecord = { status: ActionStatus; note: string; updatedAt: string };
type ActionStore = Record<string, ActionRecord>;

function readStore(): ActionStore {
  if (typeof window === 'undefined') return {};
  try {
    const value = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '{}');
    return value && typeof value === 'object' && !Array.isArray(value) ? value as ActionStore : {};
  } catch {
    return {};
  }
}

function writeRecord(key: string, record: ActionRecord) {
  if (typeof window === 'undefined') return;
  const store = readStore();
  store[key] = record;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

function actionKey(site: string, searchType: string, id: string) {
  return `${site}|${searchType}|${id}`;
}

function statusLabel(status: ActionStatus) {
  return status === 'done' ? '対応済み' : status === 'doing' ? '対応中' : '未対応';
}

function statusTone(status: ActionStatus) {
  return status === 'done' ? 'success' as const : status === 'doing' ? 'warning' as const : 'neutral' as const;
}

function ActionTracker({ id, onChanged }: { id: string; onChanged?: (record: ActionRecord) => void }) {
  const workspace = useGscWorkspace();
  const key = actionKey(workspace.selectedSite, workspace.searchType, id);
  const [status, setStatus] = useState<ActionStatus>('todo');
  const [note, setNote] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const record = readStore()[key];
    setStatus(record?.status ?? 'todo');
    setNote(record?.note ?? '');
    setSaved(false);
  }, [key]);

  const save = (nextStatus = status) => {
    const record = { status: nextStatus, note: note.trim(), updatedAt: new Date().toISOString() } satisfies ActionRecord;
    setStatus(nextStatus);
    writeRecord(key, record);
    setSaved(true);
    onChanged?.(record);
    window.setTimeout(() => setSaved(false), 1800);
  };

  return (
    <section className="p5-action-tracker">
      <div className="p5-action-section-head"><div><strong>対応管理</strong><span>このブラウザに保存されます</span></div><Badge tone={statusTone(status)}>{statusLabel(status)}</Badge></div>
      <div className="p5-status-buttons">
        {(['todo', 'doing', 'done'] as const).map((value) => (
          <button key={value} type="button" className={status === value ? 'is-active' : ''} onClick={() => save(value)}>{statusLabel(value)}</button>
        ))}
      </div>
      <label className="p5-action-note"><span>対応メモ</span><textarea value={note} onChange={(event) => { setNote(event.target.value); setSaved(false); }} placeholder="例: title案を3パターン作成。次回計測日にCTRを再確認。" /></label>
      <Button size="sm" variant="secondary" icon={saved ? <CheckCircle2 /> : <Save />} onClick={() => save()}>{saved ? '保存しました' : 'メモを保存'}</Button>
    </section>
  );
}

function RelatedList({ rows, title }: { rows: Array<{ label: string; clicks: number; impressions: number; ctr: number; position: number }>; title: string }) {
  return (
    <section className="p5-action-related">
      <div className="p5-action-section-head"><div><strong>{title}</strong><span>query × page実データ</span></div><Badge tone="info">{rows.length}件</Badge></div>
      {!rows.length ? <EmptyState title="関連データなし" text="Search Console APIの返却範囲では関連行を取得できませんでした。" /> : (
        <div className="p5-action-related__list">
          {rows.slice(0, 8).map((row) => <div key={row.label}><code>{row.label}</code><span>{row.clicks.toLocaleString()} click</span><span>{row.position.toFixed(1)}位</span><span>CTR {row.ctr.toFixed(2)}%</span></div>)}
        </div>
      )}
    </section>
  );
}

function AiBrief({ opportunityId }: { opportunityId: string }) {
  const workspace = useGscWorkspace();
  const [loading, setLoading] = useState(false);
  const [brief, setBrief] = useState('');
  const [error, setError] = useState('');
  const [model, setModel] = useState('');

  const generate = async () => {
    setLoading(true);
    setError('');
    setBrief('');
    try {
      const response = await fetch('/api/gsc/ai-brief', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          site: workspace.selectedSite,
          opportunityId,
          days: workspace.days,
          device: workspace.device,
          searchType: workspace.searchType,
          thresholds: workspace.thresholds,
        }),
      });
      const data = await response.json() as { brief?: string; model?: string; error?: string; configured?: boolean };
      if (!response.ok) {
        if (data.configured === false) throw new Error('OPENAI_API_KEYが未設定です。AI以外の分析機能はそのまま利用できます。');
        throw new Error(data.error || 'AI改善ブリーフの生成に失敗しました。');
      }
      setBrief(data.brief ?? '');
      setModel(data.model ?? '');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'AI改善ブリーフの生成に失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="p5-action-ai">
      <div className="p5-action-section-head"><div><strong>AI改善ブリーフ</strong><span>現在のGSC数値だけを根拠に整理</span></div><Badge tone="info">OPTIONAL</Badge></div>
      <Button size="sm" icon={loading ? <LoaderCircle className="p4-spin" /> : <Bot />} disabled={loading} onClick={() => void generate()}>{loading ? '分析中...' : brief ? '再生成' : '改善ブリーフ生成'}</Button>
      {error && <div className="p5-action-error">{error}</div>}
      {brief && <div className="p5-action-ai__result"><div><Bot /><strong>{model || 'AI'}</strong><span>SERP・本文未参照 / 数値上の仮説</span></div><pre>{brief}</pre></div>}
    </section>
  );
}

export function OpportunityActionDrawer({ opportunity, onClose }: { opportunity: Opportunity | null; onClose: () => void }) {
  const workspace = useGscWorkspace();
  const analysis = workspace.analysis;
  const pageRow = useMemo(() => opportunity && analysis ? analysis.pages.find((row) => row.label === opportunity.target) : undefined, [analysis, opportunity]);
  const queryRow = useMemo(() => opportunity && analysis ? analysis.queries.find((row) => row.label === opportunity.target) : undefined, [analysis, opportunity]);
  const performanceRow = pageRow ?? queryRow;
  const related = opportunity && analysis
    ? pageRow
      ? analysis.relations?.pageToQueries[pageRow.label] ?? []
      : queryRow
        ? analysis.relations?.queryToPages[queryRow.label] ?? []
        : []
    : [];

  useEffect(() => {
    if (!opportunity) return;
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, [onClose, opportunity]);

  if (!opportunity) return null;
  const detailHref = pageRow ? `/pages/${pageRow.id}` : queryRow ? `/queries/${queryRow.id}` : null;

  return (
    <div className="p5-action-backdrop" role="presentation" onMouseDown={onClose}>
      <aside className="p5-action-drawer" role="dialog" aria-modal="true" aria-label="SEOアクション詳細" onMouseDown={(event) => event.stopPropagation()}>
        <header className="p5-action-drawer__head">
          <div><div className="p5-action-badges"><Badge tone="info">{opportunity.type}</Badge><span>Impact {opportunity.impact}</span><span>Effort {opportunity.effort}</span><Badge tone={opportunity.score >= 80 ? 'danger' : opportunity.score >= 65 ? 'warning' : 'neutral'}>Score {opportunity.score}</Badge></div><h2>{opportunity.title}</h2><code>{opportunity.target}</code></div>
          <IconButton label="閉じる" onClick={onClose}><X /></IconButton>
        </header>

        <div className="p5-action-drawer__body">
          <section className="p5-action-diagnosis">
            <div className="p5-action-section-head"><div><strong>なぜ今やるのか</strong><span>分析エンジンの判定根拠</span></div><Sparkles /></div>
            <p>{opportunity.reason}</p>
            <div className="p5-action-metrics"><div><span>表示回数</span><strong>{opportunity.impressions.toLocaleString()}</strong></div><div><span>平均順位</span><strong>{opportunity.position.toFixed(1)}</strong></div><div><span>クリック変化</span><strong>{opportunity.delta > 0 ? '+' : ''}{opportunity.delta.toFixed(1)}%</strong></div>{performanceRow && <div><span>CTR</span><strong>{performanceRow.ctr.toFixed(2)}%</strong></div>}</div>
          </section>

          <section className="p5-action-next">
            <div className="p5-action-section-head"><div><strong>推奨アクション</strong><span>次に実行する作業</span></div><Target /></div>
            <div className="p5-action-recommendation"><ClipboardCheck /><strong>{opportunity.action}</strong></div>
            <div className="p5-action-links">
              {detailHref && <Link className="ui-button ui-button--secondary ui-button--sm" href={detailHref} onClick={onClose}>実データ詳細を見る</Link>}
              {pageRow?.label.startsWith('http') && <a className="ui-button ui-button--ghost ui-button--sm" href={pageRow.label} target="_blank" rel="noreferrer">実ページを開く<ExternalLink /></a>}
              {!pageRow && opportunity.target.startsWith('http') && <a className="ui-button ui-button--ghost ui-button--sm" href={opportunity.target} target="_blank" rel="noreferrer">対象URLを開く<ExternalLink /></a>}
            </div>
          </section>

          <RelatedList rows={related} title={pageRow ? 'このページの流入クエリ' : 'このクエリで表示されたページ'} />
          <ActionTracker id={`opportunity:${opportunity.id}`} />
          <AiBrief opportunityId={opportunity.id} />
        </div>
      </aside>
    </div>
  );
}

export function SignalActionDrawer({ row, mode, onClose }: { row: SignalRow | null; mode: 'growth' | 'decline' | 'ctr'; onClose: () => void }) {
  const workspace = useGscWorkspace();
  const analysis = workspace.analysis;
  const performanceRow = row && analysis ? [...analysis.queries, ...analysis.pages].find((item) => item.id === row.id) : undefined;
  const detailHref = performanceRow ? `${performanceRow.id.startsWith('q-') ? '/queries/' : '/pages/'}${performanceRow.id}` : null;

  useEffect(() => {
    if (!row) return;
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, [onClose, row]);

  if (!row) return null;
  const title = mode === 'growth' ? '成長シグナルの実行計画' : mode === 'decline' ? '下落シグナルの回復計画' : 'CTR改善の実行計画';

  return (
    <div className="p5-action-backdrop" role="presentation" onMouseDown={onClose}>
      <aside className="p5-action-drawer" role="dialog" aria-modal="true" aria-label={title} onMouseDown={(event) => event.stopPropagation()}>
        <header className="p5-action-drawer__head"><div><div className="p5-action-badges"><Badge tone={row.severity === '高' ? 'danger' : row.severity === '中' ? 'warning' : 'neutral'}>{row.severity}</Badge><span>{mode === 'growth' ? '急上昇' : mode === 'decline' ? '急落' : 'CTR改善'}</span></div><h2>{title}</h2><code>{row.label}</code></div><IconButton label="閉じる" onClick={onClose}><X /></IconButton></header>
        <div className="p5-action-drawer__body">
          <section className="p5-action-diagnosis"><div className="p5-action-section-head"><div><strong>検出理由</strong><span>Search Console実データ</span></div><Sparkles /></div><p>{row.reason}</p><div className="p5-action-metrics"><div><span>主要変化</span><strong>{row.primaryMetric}</strong></div><div><span>表示回数</span><strong>{row.impressions.toLocaleString()}</strong></div><div><span>平均順位</span><strong>{row.position.toFixed(1)}</strong></div><div><span>CTR</span><strong>{row.ctr.toFixed(2)}%</strong></div></div></section>
          <section className="p5-action-next"><div className="p5-action-section-head"><div><strong>推奨アクション</strong><span>このシグナルへの次の一手</span></div><Target /></div><div className="p5-action-recommendation"><ClipboardCheck /><strong>{row.action}</strong></div>{detailHref && <div className="p5-action-links"><Link className="ui-button ui-button--secondary ui-button--sm" href={detailHref} onClick={onClose}>実データ詳細を見る</Link></div>}</section>
          <ActionTracker id={`signal:${mode}:${row.id}`} />
        </div>
      </aside>
    </div>
  );
}
