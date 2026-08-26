'use client';

import {
  CheckCircle2,
  CircleDollarSign,
  Clipboard,
  FilePenLine,
  LoaderCircle,
  ShieldCheck,
  TriangleAlert,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Badge, Button } from '@/components/ui';
import { useGscWorkspace } from './gsc-context';
import { useAiCostLimit } from './use-ai-cost-limit';

const usd = (value: number) => `$${value.toFixed(6)}`;

type RewriteResult = {
  configured: true;
  model: string;
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
  configured?: boolean;
  estimate?: { estimatedMaxUsd?: number };
};

export function AiRewriteDrawer({ opportunityId }: { opportunityId: string }) {
  const workspace = useGscWorkspace();
  const { limitUsd } = useAiCostLimit();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RewriteResult | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setResult(null);
    setError('');
    setCopied(false);
  }, [opportunityId, workspace.searchType, workspace.selectedSite]);

  const run = async () => {
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
          opportunityId,
          days: workspace.days,
          device: workspace.device,
          searchType: workspace.searchType,
          thresholds: workspace.thresholds,
          costLimitUsd: limitUsd,
        }),
      });
      const data = await response.json() as RewriteResult | RewriteError;

      if (!response.ok) {
        if ('configured' in data && data.configured === false) {
          throw new Error('OPENAI_API_KEYが未設定です。設定後に再実行してください。');
        }
        const estimate = 'estimate' in data && data.estimate?.estimatedMaxUsd
          ? ` 推定最大コスト ${usd(data.estimate.estimatedMaxUsd)}。`
          : '';
        throw new Error(`${'error' in data ? data.error || 'AIリライトに失敗しました。' : 'AIリライトに失敗しました。'}${estimate}`);
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
    <section className="p5-action-ai p5-02-drawer-rewrite">
      <div className="p5-action-section-head">
        <div>
          <strong>AIで本文リライト</strong>
          <span>このOpportunityをそのまま引き継いで、対象ページ本文を取得・改善します</span>
        </div>
        <Badge tone="info">上限 {usd(limitUsd)}</Badge>
      </div>

      <Button
        icon={loading ? <LoaderCircle className="p4-spin" /> : <FilePenLine />}
        disabled={loading}
        onClick={() => void run()}
      >
        {loading ? '本文取得・リライト中...' : result ? '再リライト' : 'AIで本文リライト'}
      </Button>

      <div className="p5-02-budget-line">
        <ShieldCheck />
        <span>
          <strong>このOpportunityを固定して実行</strong>
          候補の選び直しは不要です。本文取得は通常fetchのためOpenAI Web Search料金は発生しません。
        </span>
      </div>

      {error && <div className="p5-02-rewrite-error"><TriangleAlert />{error}</div>}

      {result && (
        <div className="p5-02-rewrite-result">
          <div className="p5-02-cost-summary">
            <div><span>本文取得</span><strong>{usd(result.cost.pageFetchUsd)}</strong><small>Web Search 0回</small></div>
            <div><span>AI入力</span><strong>{usd(result.cost.inputUsd + result.cost.cachedInputUsd + result.cost.cacheWriteUsd)}</strong><small>{result.usage.inputTokens.toLocaleString()} tokens</small></div>
            <div><span>AI出力</span><strong>{usd(result.cost.outputUsd)}</strong><small>{result.usage.outputTokens.toLocaleString()} tokens</small></div>
            <div className={result.cost.exceededLimit ? 'is-danger' : 'is-total'}><span>今回のAIコスト</span><strong>{usd(result.cost.totalUsd)}</strong><small>上限 {usd(result.cost.limitUsd)}</small></div>
          </div>

          <div className="p5-02-source-meta">
            <div><span>取得ページ</span><code>{result.targetUrl}</code></div>
            <div><span>現在title</span><strong>{result.page.title || '-'}</strong></div>
            <div><span>本文文字数</span><strong>{result.page.sourceChars.toLocaleString()} chars</strong></div>
            <div><span>残予算</span><strong>{usd(result.cost.headroomUsd)}</strong></div>
          </div>

          <div className="p5-02-rewrite-output-head">
            <div>
              <CircleDollarSign />
              <span><strong>リライト案</strong><small>{result.model} / 実使用tokenから料金計算</small></span>
            </div>
            <Button size="sm" variant="secondary" icon={copied ? <CheckCircle2 /> : <Clipboard />} onClick={() => void copy()}>
              {copied ? 'コピー済み' : '全文コピー'}
            </Button>
          </div>
          <pre className="p5-02-rewrite-output">{result.rewrite}</pre>
        </div>
      )}
    </section>
  );
}
