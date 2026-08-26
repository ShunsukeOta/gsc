'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  AlertTriangle,
  Bell,
  CheckCheck,
  ChevronRight,
  CircleHelp,
  ExternalLink,
  FileText,
  Gauge,
  HelpCircle,
  Image as ImageIcon,
  LogIn,
  LogOut,
  Search,
  Settings,
  Sparkles,
  TrendingUp,
  UserRound,
  Video,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useGscWorkspace } from '@/components/application/gsc-context';
import type { GscSearchType } from '@/lib/gsc/types';

const READ_KEY = 'gsc-analyzer-notification-read-v1';

const searchTypeMeta: Record<GscSearchType, { label: string; icon: typeof Search }> = {
  web: { label: 'ウェブ', icon: Search },
  image: { label: '画像', icon: ImageIcon },
  video: { label: '動画', icon: Video },
};

function readSeenIds() {
  if (typeof window === 'undefined') return new Set<string>();
  try {
    const value = JSON.parse(window.localStorage.getItem(READ_KEY) ?? '[]');
    return new Set(Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []);
  } catch {
    return new Set<string>();
  }
}

function persistSeenIds(ids: Set<string>) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(READ_KEY, JSON.stringify([...ids].slice(-300)));
}

type HeaderNotification = {
  id: string;
  tone: 'danger' | 'warning' | 'info' | 'success';
  title: string;
  detail: string;
  href: string;
};

const helpBySection: Record<string, { title: string; text: string; tips: string[] }> = {
  dashboard: { title: 'ダッシュボード', text: 'サイト全体の変化と「今日やるSEO」を優先順に確認する画面です。', tips: ['まずCriticalな異常を確認', '次にOpportunity Score上位へ対応', '検索タイプごとにWeb・画像・動画を切替'] },
  queries: { title: 'クエリ分析', text: '検索語ごとの需要・CTR・順位・期間変化を比較します。', tips: ['表示回数が多い低CTRを優先', '選択した行は比較表示可能', '行メニューから値コピー・詳細表示'] },
  pages: { title: 'ページ分析', text: 'URL単位のパフォーマンスを分析します。#fragmentは同一ページへ集約済みです。', tips: ['急落と高需要ページを優先', '実ページを行メニューから開く', 'URL正規化の統合内容も確認'] },
  opportunities: { title: '改善機会', text: '検索需要・順位・CTR・変化量から実行候補をスコアリングします。', tips: ['詳しく見るでAction Drawerを開く', '対応メモとステータスを保存', '必要に応じてAIブリーフを生成'] },
  anomalies: { title: '異常検知', text: '順位・CTR・需要・流入を分解し、急変の原因候補を表示します。', tips: ['Criticalから確認', '信頼度と表示回数も見る', '未確定日は誤検知に注意'] },
  settings: { title: '設定', text: 'GSC接続、判定しきい値、通知プリファレンスを管理します。', tips: ['通知の種類を選択可能', 'しきい値変更で分析は自動再取得', 'Google tokenはブラウザJSへ公開しません'] },
};

export function HeaderActions() {
  const workspace = useGscWorkspace();
  const pathname = usePathname();
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [panel, setPanel] = useState<'notifications' | 'help' | 'profile' | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [seenIds, setSeenIds] = useState<Set<string>>(new Set());

  useEffect(() => setSeenIds(readSeenIds()), []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setPanel(null);
        setSearchOpen(true);
        window.setTimeout(() => searchInputRef.current?.focus(), 0);
      }
      if (event.key === 'Escape') {
        setPanel(null);
        setSearchOpen(false);
      }
    };
    const onPointerDown = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setPanel(null);
    };
    window.addEventListener('keydown', onKeyDown);
    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, []);

  const notifications = useMemo<HeaderNotification[]>(() => {
    const items: HeaderNotification[] = [];
    if (workspace.analysisError) items.push({ id: `error:${workspace.analysisError}`, tone: 'danger', title: 'GSCデータ取得エラー', detail: workspace.analysisError, href: '/settings' });
    if (!workspace.sessionLoading && workspace.session.configured && !workspace.session.authenticated) items.push({ id: 'connection:required', tone: 'warning', title: 'Google Search Consoleが未接続です', detail: '実データ分析を開始するにはGoogleアカウントを接続してください。', href: '/settings' });
    const analysis = workspace.analysis;
    if (!analysis) return items;

    if (workspace.notificationPreferences.quality && analysis.partialDataFrom) {
      items.push({ id: `partial:${analysis.partialDataFrom}:${analysis.searchType}`, tone: 'warning', title: '未確定データを含みます', detail: `${analysis.partialDataFrom} 以降はGoogle側で処理中です。`, href: '/dashboard' });
    }
    if (workspace.notificationPreferences.quality && analysis.dataQuality && analysis.dataQuality.score < 90) {
      items.push({ id: `quality:${analysis.siteUrl}:${analysis.searchType}:${analysis.dataQuality.level}`, tone: analysis.dataQuality.score < 70 ? 'danger' : 'warning', title: `データ品質 ${analysis.dataQuality.score}/100`, detail: analysis.dataQuality.notes[0] ?? '取得データの状態を確認してください。', href: '/anomalies' });
    }
    if (workspace.notificationPreferences.anomalies) {
      for (const anomaly of (analysis.anomalies ?? []).filter((item) => item.severity !== 'info').slice(0, 5)) {
        items.push({ id: `anomaly:${analysis.searchType}:${anomaly.id}`, tone: anomaly.severity === 'critical' ? 'danger' : 'warning', title: anomaly.title, detail: anomaly.summary, href: '/anomalies' });
      }
    }
    if (workspace.notificationPreferences.growth) {
      for (const anomaly of (analysis.anomalies ?? []).filter((item) => item.kind === 'growth-breakout').slice(0, 2)) {
        items.push({ id: `growth:${analysis.searchType}:${anomaly.id}`, tone: 'success', title: anomaly.title, detail: anomaly.summary, href: '/growth' });
      }
    }
    return items.slice(0, 10);
  }, [workspace.analysis, workspace.analysisError, workspace.notificationPreferences, workspace.session.authenticated, workspace.session.configured, workspace.sessionLoading]);

  const unread = notifications.filter((item) => !seenIds.has(item.id)).length;

  const markRead = (id: string) => {
    setSeenIds((current) => {
      const next = new Set(current);
      next.add(id);
      persistSeenIds(next);
      return next;
    });
  };

  const markAllRead = () => {
    setSeenIds((current) => {
      const next = new Set(current);
      notifications.forEach((item) => next.add(item.id));
      persistSeenIds(next);
      return next;
    });
  };

  const searchResults = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword || !workspace.analysis) return [];
    const queryRows = workspace.analysis.queries
      .filter((row) => `${row.label} ${row.secondary ?? ''}`.toLowerCase().includes(keyword))
      .slice(0, 6)
      .map((row) => ({ id: `q:${row.id}`, kind: 'クエリ', label: row.label, sub: `${row.clicks.toLocaleString()} click / ${row.position.toFixed(1)}位`, href: `/queries/${row.id}` }));
    const pageRows = workspace.analysis.pages
      .filter((row) => `${row.label} ${row.secondary ?? ''}`.toLowerCase().includes(keyword))
      .slice(0, 6)
      .map((row) => ({ id: `p:${row.id}`, kind: 'ページ', label: row.label, sub: `${row.clicks.toLocaleString()} click / ${row.position.toFixed(1)}位`, href: `/pages/${row.id}` }));
    return [...queryRows, ...pageRows].slice(0, 10);
  }, [query, workspace.analysis]);

  const section = pathname.split('/').filter(Boolean)[0] ?? 'dashboard';
  const help = helpBySection[section] ?? { title: 'GSC Analyzer', text: 'Search Console実データから改善優先度を判断するための分析ツールです。', tips: ['Ctrl / ⌘ + Kで横断検索', '上部フィルターで検索タイプを切替', '設定画面で判定しきい値を調整'] };
  const SearchTypeIcon = searchTypeMeta[workspace.searchType].icon;
  const email = workspace.session.email ?? '';
  const initials = email ? email.split('@')[0].slice(0, 2).toUpperCase() : 'GA';

  const openPanel = (next: typeof panel) => setPanel((current) => current === next ? null : next);

  return (
    <div className="p5-header-actions" ref={rootRef}>
      <button className="app-header__search p5-command-trigger" type="button" onClick={() => { setPanel(null); setSearchOpen(true); window.setTimeout(() => searchInputRef.current?.focus(), 0); }}>
        <Search aria-hidden="true" />
        <span>クエリ・ページを検索...</span>
        <kbd>⌘K</kbd>
      </button>

      <div className="p5-header-anchor">
        <button className="ui-icon-button p5-notification-button" type="button" aria-label={`通知${unread ? ` ${unread}件` : ''}`} aria-expanded={panel === 'notifications'} onClick={() => openPanel('notifications')}>
          <Bell size={14} />
          {unread > 0 && <span className="p5-notification-count">{Math.min(unread, 9)}</span>}
        </button>
        {panel === 'notifications' && (
          <div className="p5-header-popover p5-notifications" role="dialog" aria-label="通知">
            <div className="p5-popover-head"><div><strong>通知</strong><span>{unread}件の未読</span></div><button type="button" disabled={!unread} onClick={markAllRead}><CheckCheck />すべて既読</button></div>
            <div className="p5-notification-list">
              {!notifications.length && <div className="p5-popover-empty"><Bell />現在、確認が必要な通知はありません。</div>}
              {notifications.map((item) => (
                <button key={item.id} type="button" className={`p5-notification is-${item.tone}${seenIds.has(item.id) ? ' is-read' : ''}`} onClick={() => { markRead(item.id); setPanel(null); router.push(item.href); }}>
                  <span className="p5-notification__dot" />
                  <span><strong>{item.title}</strong><small>{item.detail}</small></span>
                  <ChevronRight />
                </button>
              ))}
            </div>
            <Link href="/settings#notifications" onClick={() => setPanel(null)} className="p5-popover-foot">通知設定を変更<Settings /></Link>
          </div>
        )}
      </div>

      <div className="p5-header-anchor">
        <button className="ui-icon-button" type="button" aria-label="ヘルプ" aria-expanded={panel === 'help'} onClick={() => openPanel('help')}><HelpCircle size={14} /></button>
        {panel === 'help' && (
          <div className="p5-header-popover p5-help" role="dialog" aria-label="ヘルプ">
            <div className="p5-help-title"><CircleHelp /><span><strong>{help.title}の使い方</strong><small>{help.text}</small></span></div>
            <ol>{help.tips.map((tip) => <li key={tip}>{tip}</li>)}</ol>
            <div className="p5-help-shortcut"><kbd>Ctrl / ⌘</kbd><kbd>K</kbd><span>クエリ・ページ横断検索</span></div>
            <div className="p5-help-links"><Link href="/settings" onClick={() => setPanel(null)}><Settings />分析設定</Link><Link href="/reports" onClick={() => setPanel(null)}><FileText />データ出力</Link><Link href="/dashboard" onClick={() => setPanel(null)}><Gauge />概要へ戻る</Link></div>
          </div>
        )}
      </div>

      <div className="p5-header-anchor">
        <button className="app-user p5-user-button" type="button" aria-expanded={panel === 'profile'} onClick={() => openPanel('profile')}>
          <span className="app-user__avatar">{initials}</span>
          <span className="app-user__name">{email || (workspace.session.authenticated ? 'Google Account' : '未接続')}</span>
        </button>
        {panel === 'profile' && (
          <div className="p5-header-popover p5-profile" role="dialog" aria-label="プロフィール">
            <div className="p5-profile-account"><span className="app-user__avatar">{initials}</span><span><strong>{email || 'Google Search Console'}</strong><small>{workspace.session.authenticated ? 'Google接続済み' : '未接続'}</small></span></div>
            <div className="p5-profile-context"><div><span>プロパティ</span><strong>{workspace.selectedSite || '-'}</strong></div><div><span>検索タイプ</span><strong><SearchTypeIcon />{searchTypeMeta[workspace.searchType].label}</strong></div></div>
            <Link href="/settings" onClick={() => setPanel(null)}><Settings />設定を開く</Link>
            {workspace.session.authenticated ? <a href="/api/auth/logout"><LogOut />Google接続を解除</a> : <a href="/api/auth/google?returnTo=/dashboard"><LogIn />Googleで接続</a>}
          </div>
        )}
      </div>

      {searchOpen && (
        <div className="p5-command-backdrop" role="presentation" onMouseDown={() => setSearchOpen(false)}>
          <div className="p5-command" role="dialog" aria-modal="true" aria-label="横断検索" onMouseDown={(event) => event.stopPropagation()}>
            <div className="p5-command-input"><Search /><input ref={searchInputRef} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="クエリまたはURLを入力..." /><button type="button" aria-label="閉じる" onClick={() => setSearchOpen(false)}><X /></button></div>
            <div className="p5-command-meta"><span><SearchTypeIcon />{searchTypeMeta[workspace.searchType].label}</span><span>{workspace.selectedSite || 'プロパティ未選択'}</span></div>
            <div className="p5-command-results">
              {!workspace.analysis && <div className="p5-popover-empty"><Search />GSCデータ取得後に横断検索を利用できます。</div>}
              {workspace.analysis && !query.trim() && <div className="p5-popover-empty"><Search />検索語を入力してください。</div>}
              {workspace.analysis && query.trim() && !searchResults.length && <div className="p5-popover-empty"><AlertTriangle />一致するクエリ・ページはありません。</div>}
              {searchResults.map((item) => <button key={item.id} type="button" onClick={() => { setSearchOpen(false); setQuery(''); router.push(item.href); }}><span><strong>{item.kind}</strong><code>{item.label}</code><small>{item.sub}</small></span><ChevronRight /></button>)}
            </div>
            <div className="p5-command-foot"><span><Sparkles />現在取得済みのGSC上位行から検索</span><a href="https://search.google.com/search-console" target="_blank" rel="noreferrer">Search Console<ExternalLink /></a></div>
          </div>
        </div>
      )}
    </div>
  );
}
