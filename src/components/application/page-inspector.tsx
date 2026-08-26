'use client';

import {
  AlertTriangle,
  CheckCircle2,
  Code2,
  ExternalLink,
  FileText,
  Globe2,
  Image as ImageIcon,
  Link2,
  LoaderCircle,
  RefreshCw,
  SearchCheck,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Badge, Button, Card } from '@/components/ui';
import type { PageInspection } from '@/lib/page-inspector-types';

const number = (value: number) => new Intl.NumberFormat('ja-JP').format(value);

type CheckItem = {
  label: string;
  detail: string;
  tone: 'success' | 'warning' | 'danger' | 'info';
};

function textLengthLabel(value: string) {
  return value ? `${value.length}文字` : '未設定';
}

function PageValue({ label, value, meta, mono = false }: { label: string; value: string; meta?: string; mono?: boolean }) {
  return (
    <div className="p6-page-value">
      <span>{label}</span>
      <strong className={mono ? 'is-mono' : ''}>{value || '-'}</strong>
      {meta && <small>{meta}</small>}
    </div>
  );
}

export function PageInspector({ site, url }: { site: string; url: string }) {
  const [inspection, setInspection] = useState<PageInspection | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!site || !url) return;
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/page-inspector', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ site, url }),
      });
      const data = await response.json() as { inspection?: PageInspection; error?: string };
      if (!response.ok || !data.inspection) throw new Error(data.error || 'ページ情報の取得に失敗しました。');
      setInspection(data.inspection);
    } catch (cause) {
      setInspection(null);
      setError(cause instanceof Error ? cause.message : 'ページ情報の取得に失敗しました。');
    } finally {
      setLoading(false);
    }
  }, [site, url]);

  useEffect(() => { void load(); }, [load]);

  const checks = useMemo<CheckItem[]>(() => {
    if (!inspection) return [];
    const robots = `${inspection.metaRobots} ${inspection.googlebotRobots} ${inspection.xRobotsTag}`.toLowerCase();
    const items: CheckItem[] = [];
    items.push(inspection.status >= 200 && inspection.status < 300
      ? { label: 'HTTP', detail: `${inspection.status} で取得できています`, tone: 'success' }
      : { label: 'HTTP', detail: `${inspection.status} を返しています`, tone: inspection.status >= 400 ? 'danger' : 'warning' });
    items.push(!inspection.title
      ? { label: 'Title', detail: 'titleが未設定です', tone: 'danger' }
      : inspection.title.length >= 15 && inspection.title.length <= 60
        ? { label: 'Title', detail: `${inspection.title.length}文字`, tone: 'success' }
        : { label: 'Title', detail: `${inspection.title.length}文字。長さを確認してください`, tone: 'warning' });
    items.push(!inspection.metaDescription
      ? { label: 'Description', detail: 'meta descriptionが未設定です', tone: 'warning' }
      : inspection.metaDescription.length >= 50 && inspection.metaDescription.length <= 160
        ? { label: 'Description', detail: `${inspection.metaDescription.length}文字`, tone: 'success' }
        : { label: 'Description', detail: `${inspection.metaDescription.length}文字。長さを確認してください`, tone: 'info' });
    items.push(inspection.h1s.length === 1
      ? { label: 'H1', detail: 'H1は1件です', tone: 'success' }
      : inspection.h1s.length === 0
        ? { label: 'H1', detail: 'H1が見つかりません', tone: 'danger' }
        : { label: 'H1', detail: `H1が${inspection.h1s.length}件あります`, tone: 'warning' });
    items.push(robots.includes('noindex')
      ? { label: 'Index', detail: 'noindex指定を検出しました', tone: 'danger' }
      : { label: 'Index', detail: 'noindexは検出されていません', tone: 'success' });
    items.push(inspection.canonical
      ? { label: 'Canonical', detail: inspection.canonical === inspection.finalUrl ? '最終URLと一致' : '最終URLと異なります', tone: inspection.canonical === inspection.finalUrl ? 'success' : 'info' }
      : { label: 'Canonical', detail: 'canonicalが未設定です', tone: 'warning' });
    if (!inspection.viewport) items.push({ label: 'Viewport', detail: 'viewportが見つかりません', tone: 'warning' });
    if (inspection.images.missingAlt > 0) items.push({ label: '画像alt', detail: `alt属性なし ${inspection.images.missingAlt}件`, tone: 'warning' });
    if (inspection.structuredData.invalidBlocks > 0) items.push({ label: 'JSON-LD', detail: `解析できないブロック ${inspection.structuredData.invalidBlocks}件`, tone: 'warning' });
    return items;
  }, [inspection]);

  return (
    <Card className="p6-page-inspector" padded={false}>
      <div className="p6-page-inspector__head">
        <div>
          <div className="p6-page-inspector__eyebrow"><SearchCheck />LIVE PAGE INSPECTOR</div>
          <h2>ページ情報</h2>
          <p>GSC上の実URLからHTMLを直接取得し、SEOの基本情報を確認します。OpenAI / Web Searchは使用しません。</p>
        </div>
        <div className="p6-page-inspector__head-actions">
          {inspection && <Badge tone={inspection.status >= 200 && inspection.status < 300 ? 'success' : 'danger'}>HTTP {inspection.status}</Badge>}
          <Button size="sm" variant="secondary" icon={loading ? <LoaderCircle className="p4-spin" /> : <RefreshCw />} disabled={loading} onClick={() => void load()}>{loading ? '取得中' : '再取得'}</Button>
        </div>
      </div>

      {loading && !inspection && (
        <div className="p6-page-inspector__loading"><LoaderCircle className="p4-spin" /><span>実ページからtitle・description・見出し・構造化データなどを取得しています...</span></div>
      )}

      {error && !inspection && (
        <div className="p6-page-inspector__error"><AlertTriangle /><span><strong>ページ情報を取得できませんでした</strong><small>{error}</small></span></div>
      )}

      {inspection && (
        <div className="p6-page-inspector__body">
          <div className="p6-seo-checks">
            {checks.map((item) => (
              <div key={`${item.label}:${item.detail}`} className={`is-${item.tone}`}>
                {item.tone === 'success' ? <CheckCircle2 /> : <AlertTriangle />}
                <span><strong>{item.label}</strong><small>{item.detail}</small></span>
              </div>
            ))}
          </div>

          <section className="p6-inspector-section">
            <div className="p6-inspector-section__title"><Globe2 /><div><strong>クロール・URL</strong><span>実際に取得したレスポンス</span></div></div>
            <div className="p6-page-values p6-page-values--two">
              <PageValue label="GSC URL" value={inspection.requestedUrl} mono />
              <PageValue label="最終URL" value={inspection.finalUrl} meta={inspection.redirectCount ? `リダイレクト ${inspection.redirectCount}回` : 'リダイレクトなし'} mono />
              <PageValue label="Canonical" value={inspection.canonical} mono />
              <PageValue label="Content-Type" value={inspection.contentType} mono />
              <PageValue label="Meta robots" value={inspection.metaRobots || '未指定'} mono />
              <PageValue label="X-Robots-Tag" value={inspection.xRobotsTag || '未指定'} mono />
              <PageValue label="Googlebot" value={inspection.googlebotRobots || '未指定'} mono />
              <PageValue label="HTML lang / charset" value={`${inspection.lang || '-'} / ${inspection.charset || '-'}`} />
            </div>
          </section>

          <section className="p6-inspector-section">
            <div className="p6-inspector-section__title"><FileText /><div><strong>検索向けメタ情報</strong><span>現在配信されているHTML</span></div></div>
            <div className="p6-page-values">
              <PageValue label="Meta title" value={inspection.title} meta={textLengthLabel(inspection.title)} />
              <PageValue label="Meta description" value={inspection.metaDescription} meta={textLengthLabel(inspection.metaDescription)} />
              <PageValue label="H1" value={inspection.h1s.join(' / ')} meta={`${inspection.h1s.length}件`} />
              <PageValue label="Viewport" value={inspection.viewport || '未設定'} mono />
            </div>
          </section>

          <div className="p6-inspector-columns">
            <section className="p6-inspector-section">
              <div className="p6-inspector-section__title"><Code2 /><div><strong>見出し構造</strong><span>H1〜H6 / 最大120件</span></div></div>
              <div className="p6-heading-counts">
                {(['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] as const).map((key) => <span key={key}><strong>{key.toUpperCase()}</strong>{inspection.headingCounts[key]}</span>)}
              </div>
              <div className="p6-heading-tree">
                {inspection.headings.length ? inspection.headings.map((heading, index) => <div key={`${heading.level}:${heading.text}:${index}`} className={`is-level-${heading.level}`}><span>H{heading.level}</span><strong>{heading.text}</strong></div>) : <p>見出しが見つかりませんでした。</p>}
              </div>
            </section>

            <section className="p6-inspector-section">
              <div className="p6-inspector-section__title"><Code2 /><div><strong>構造化データ</strong><span>JSON-LD</span></div></div>
              <div className="p6-structured-summary">
                <div><span>JSON-LD</span><strong>{inspection.structuredData.blocks}ブロック</strong></div>
                <div><span>解析エラー</span><strong>{inspection.structuredData.invalidBlocks}件</strong></div>
              </div>
              <div className="p6-schema-types">
                {inspection.structuredData.types.length ? inspection.structuredData.types.map((type) => <Badge tone="info" key={type}>{type}</Badge>) : <span>検出された @type はありません。</span>}
              </div>
            </section>
          </div>

          <div className="p6-inspector-columns">
            <section className="p6-inspector-section">
              <div className="p6-inspector-section__title"><ImageIcon /><div><strong>OGP / SNS</strong><span>Open Graph・Twitter Card</span></div></div>
              <div className="p6-page-values">
                <PageValue label="og:title" value={inspection.openGraph.title} />
                <PageValue label="og:description" value={inspection.openGraph.description} />
                <PageValue label="og:type / og:url" value={`${inspection.openGraph.type || '-'} / ${inspection.openGraph.url || '-'}`} mono />
                <PageValue label="og:image" value={inspection.openGraph.image} mono />
                <PageValue label="twitter:card" value={inspection.twitter.card} mono />
                <PageValue label="twitter:title" value={inspection.twitter.title} />
                <PageValue label="twitter:description" value={inspection.twitter.description} />
                <PageValue label="twitter:image" value={inspection.twitter.image} mono />
              </div>
            </section>

            <section className="p6-inspector-section">
              <div className="p6-inspector-section__title"><Link2 /><div><strong>コンテンツ統計</strong><span>HTML上の要素数</span></div></div>
              <div className="p6-content-stats">
                <div><FileText /><span>抽出本文</span><strong>{number(inspection.bodyTextChars)}文字</strong></div>
                <div><Link2 /><span>内部リンク</span><strong>{number(inspection.links.internal)}</strong></div>
                <div><ExternalLink /><span>外部リンク</span><strong>{number(inspection.links.external)}</strong></div>
                <div><Link2 /><span>nofollow</span><strong>{number(inspection.links.nofollow)}</strong></div>
                <div><ImageIcon /><span>画像</span><strong>{number(inspection.images.total)}</strong></div>
                <div><AlertTriangle /><span>alt属性なし</span><strong>{number(inspection.images.missingAlt)}</strong></div>
                <div><ImageIcon /><span>空alt</span><strong>{number(inspection.images.emptyAlt)}</strong></div>
                <div><ImageIcon /><span>lazy画像</span><strong>{number(inspection.images.lazyLoaded)}</strong></div>
              </div>
            </section>
          </div>

          <div className="p6-page-inspector__foot">取得日時 {new Date(inspection.fetchedAt).toLocaleString('ja-JP')} ・ OpenAI $0.000000 ・ Web Search 0回</div>
        </div>
      )}
    </Card>
  );
}
