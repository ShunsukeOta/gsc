'use client';

import Link from 'next/link';
import {
  Bot,
  CheckCircle2,
  Clipboard,
  CircleDollarSign,
  FileText,
  LoaderCircle,
  ShieldCheck,
  TriangleAlert,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Badge, Button, Card, CardHeader, EmptyState } from '@/components/ui';
import type { Opportunity } from '@/lib/analysis-types';
import { useGscWorkspace } from './gsc-context';
import { searchTypeLabel } from './live-workspaces';
import { useAiCostLimit } from './use-ai-cost-limit';

const usd = (value: number) => `$${value.toFixed(6)}`;

function isHttpUrl(value?: string) {
  return Boolean(value && /^https?:\/\//i.test(value));
}

type RewriteResult = {
  configured: true;
  model: string;
  searchType: string;
  targetUrl: string;
  page: {
    title: string;
    metaDescription: string;
    canonical: string;
    h1: string;
    headings: string[];
    sourceChars: number;
  };
  rewrite: string;
  usage: {
    inputTokens: number;
    cachedInputTokens: number;
    cacheWriteInputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
  estimate: {
    estimatedInputTokens: number;
    estimatedInputUsd: number;
    maxOutputTokens: number;
    estimatedMaxUsd: number;
  };
  cost: {
    pageFetchUsd: number;
    webSearchUsd: number;
    inputUsd: number;
    cachedInputUsd: number;
    cacheWriteUsd: number;
    outputUsd: number;
    totalUsd: number;
    limitUsd: number;
    headroomUsd: number;
    exceededLimit: boolean;
    pricingReferenceDate: string;
  };
};

type RewriteError = {
  error?: string;
  code?: string;
  configured?: boolean;
  estimate?: { estimatedInputUsd?: number; estimatedMaxUsd?: number; maxOutputTokens?: number };
};

function resolveTargetUrl(opportunity: Opportunity | undefined, workspace: ReturnType<typeof useGscWorkspace>) {
  if (!opportunity || !workspace.analysis) return '';
  if (isHttpUrl(opportunity.target)) return opportunity.target;
  return workspace.analysis.relations?.queryToPages[opportunity.target]?.find((row) => isHttpUrl(row.label))?.label ?? '';
}

export function AiRewriteWorkspace() {
  const workspace = useGscWorkspace();
  const { limitUsd } = useAiCostLimit();
  const opportunities = workspace.analysis?.opportunities ?? [];
  const [selectedId, setSelectedId] = useState('');
  const [result, setResult] = useState<RewriteResult | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!opportunities.length) { setSelectedId(''); return; }
    if (!opportunities.some((item) => item.id === selectedId)) setSelectedId(opportunities[0].id);
  }, [opportunities, selectedId]);

  useEffect(() => {
    setResult(null);
    setError('');
    setCopied(false);
  }, [selectedId, workspace.searchType, workspace.selectedSite]);

  const selected = useMemo(() => opportunities.find((item) => item.id === selectedId), [opportunities, selectedId]);
  const targetUrl = resolveTargetUrl(selected, workspace);

  if (!workspace.analysis) return null;
  if (!opportunities.length) return (
    <Card className="p5-02-rewrite-card"><CardHeader title="AI実リライト" description="Opportunityに紐づく実ページ本文を取得し、GSCデータと合わせてリライト案を作ります" action={<Badge tone="neutral">0件</Badge>} /><EmptyState title="リライト候補がありません" text="現在の分析条件ではOpportunityが検出されていません。" /></Card>
  );

  const run = async () => {
    if (!selectedId || !targetUrl) return;
    setLoading(true);
    setError('');
    setResult(null);
    setCopied(false);
    try {
      const response = await fetch('/api/gsc/ai-rewrite', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          site: workspace.selectedSite,
          opportunityId: selectedId,
          days: workspace.days,
          device: workspace.device,
          searchType: workspace.searchType,
          thresholds: workspace.thresholds,
          costLimitUsd: limitUsd,
        }),
      });
      const data = await response.json() as RewriteResult | RewriteError;
      if (!response.ok) {
        if ('configured' in data && data.configured === false) throw new Error('OPENAI_API_KEYが未設定です。VercelのEnvironment Variablesへ設定してください。');
        const detail = 'estimate' in data && data.estimate?.estimatedMaxUsd
          ? ` 推定最大コスト ${usd(data.estimate.estimatedMaxUsd)}。`
          : '';
        throw new Error(`${'error' in data ? data.error || 'AIリライトに失敗しました。' : 'AIリライトに失敗しました。'}${detail}`);
      }
      setResult(data as RewriteResult);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'AIリライトに失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  const copy = async () => {
    if (!result?.rewrite) return;
    await navigator.clipboard.writeText(result.rewrite);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <Card className="p5-02-rewrite-card">
      <CardHeader
        title="AI実リライト"
        description="対象ページを通常fetchで取得し、GSC実データと本文をGPT-5.6 Lunaへ渡して全文リライト案を生成します"
        action={<Badge tone="info">上限 {usd(limitUsd)}</Badge>}
      />

      <div className="p5-02-rewrite-controls">
        <label>
          <span>リライトするOpportunity</span>
          <select value={selectedId} onChange={(event) => setSelectedId(event.target.value)}>
            {opportunities.slice(0, 80).map((item) => <option value={item.id} key={item.id}>{item.score} / {item.type} / {item.target}</option>)}
          </select>
        </label>
        <Button icon={loading ? <LoaderCircle className="p4-spin" /> : <Bot />} disabled={loading || !targetUrl} onClick={() => void run()}>{loading ? '本文取得・リライト中...' : result ? '再リライト' : '本文を取得してリライト'}</Button>
      </div>

      <div className="p5-02-rewrite-target">
        <FileText />
        <span><strong>{selected?.title}</strong><code>{targetUrl || 'query × pageデータから対象ページを特定できません'}</code><small>{searchTypeLabel(workspace.searchType)} / 本文取得のOpenAI Web Search料金 $0.000000</small></span>
      </div>

      {!targetUrl && <div className="p5-02-rewrite-warning"><TriangleAlert />このOpportunityはページURLへ解決できないため、実リライトを実行できません。別のOpportunityを選択してください。</div>}
      {error && <div className="p5-02-rewrite-error"><TriangleAlert />{error}<Link href="/settings#ai-cost">AIコスト設定</Link></div>}

      {result && (
        <div className="p5-02-rewrite-result">
          <div className="p5-02-cost-summary">
            <div><span>本文取得</span><strong>{usd(result.cost.pageFetchUsd)}</strong><small>OpenAI Web Search 0回</small></div>
            <div><span>AI入力</span><strong>{usd(result.cost.inputUsd + result.cost.cachedInputUsd + result.cost.cacheWriteUsd)}</strong><small>{result.usage.inputTokens.toLocaleString()} tokens / write {result.usage.cacheWriteInputTokens.toLocaleString()}</small></div>
            <div><span>AI出力</span><strong>{usd(result.cost.outputUsd)}</strong><small>{result.usage.outputTokens.toLocaleString()} tokens</small></div>
            <div className={result.cost.exceededLimit ? 'is-danger' : 'is-total'}><span>今回のAIコスト</span><strong>{usd(result.cost.totalUsd)}</strong><small>上限 {usd(result.cost.limitUsd)}</small></div>
          </div>

          <div className="p5-02-budget-line">
            <ShieldCheck />
            <span><strong>残予算 {usd(result.cost.headroomUsd)}</strong>実使用tokenから計算 / {result.model} / 料金基準 {result.cost.pricingReferenceDate}</span>
          </div>

          <div className="p5-02-source-meta">
            <div><span>取得ページ</span><code>{result.targetUrl}</code></div>
            <div><span>現在title</span><strong>{result.page.title || '-'}</strong></div>
            <div><span>本文文字数</span><strong>{result.page.sourceChars.toLocaleString()} chars</strong></div>
            <div><span>総token</span><strong>{result.usage.totalTokens.toLocaleString()}</strong></div>
          </div>

          <div className="p5-02-rewrite-output-head"><div><CircleDollarSign /><span><strong>リライト案</strong><small>自動公開はしません。内容を確認してから反映してください。</small></span></div><Button size="sm" variant="secondary" icon={copied ? <CheckCircle2 /> : <Clipboard />} onClick={() => void copy()}>{copied ? 'コピー済み' : '全文コピー'}</Button></div>
          <pre className="p5-02-rewrite-output">{result.rewrite}</pre>
        </div>
      )}
    </Card>
  );
}
