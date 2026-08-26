'use client';

import { CircleDollarSign, RotateCcw, ShieldCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Badge, Button, Card, CardHeader, InputField } from '@/components/ui';
import {
  AI_PRICING_REFERENCE_DATE,
  DEFAULT_AI_COST_LIMIT_USD,
  DEFAULT_AI_REWRITE_MODEL,
  GPT_5_6_LUNA_PRICING,
  MAX_AI_COST_LIMIT_USD,
  MIN_AI_COST_LIMIT_USD,
} from '@/lib/ai/constants';
import { useAiCostLimit } from './use-ai-cost-limit';

export function AiCostSettings() {
  const { limitUsd, setLimitUsd } = useAiCostLimit();
  const [draft, setDraft] = useState(String(limitUsd));
  const [saved, setSaved] = useState(false);

  useEffect(() => setDraft(String(limitUsd)), [limitUsd]);

  const save = () => {
    const next = setLimitUsd(Number(draft));
    setDraft(String(next));
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1600);
  };

  const reset = () => {
    setLimitUsd(DEFAULT_AI_COST_LIMIT_USD);
    setDraft(String(DEFAULT_AI_COST_LIMIT_USD));
    setSaved(false);
  };

  return (
    <Card id="ai-cost" className="p2-settings-card p5-02-ai-settings">
      <CardHeader
        title="AIコスト上限"
        description="AI実リライト1回あたりのOpenAI APIコスト上限。初期値は$0.10です。"
        action={<Badge tone="info">上限 ${limitUsd.toFixed(6)}</Badge>}
      />
      <div className="p5-02-ai-settings__grid">
        <InputField
          label="1回あたり上限（USD）"
          type="number"
          min={MIN_AI_COST_LIMIT_USD}
          max={MAX_AI_COST_LIMIT_USD}
          step="0.001"
          value={draft}
          onChange={(event) => { setDraft(event.target.value); setSaved(false); }}
          hint={`$${MIN_AI_COST_LIMIT_USD}〜$${MAX_AI_COST_LIMIT_USD}`}
        />
        <div className="p5-02-ai-settings__actions">
          <Button size="sm" onClick={save}>{saved ? '保存しました' : '上限を保存'}</Button>
          <Button size="sm" variant="ghost" icon={<RotateCcw />} onClick={reset}>$0.10へ戻す</Button>
        </div>
      </div>

      <div className="p5-02-cost-rules">
        <div><CircleDollarSign /><span><strong>{DEFAULT_AI_REWRITE_MODEL}</strong>入力 ${GPT_5_6_LUNA_PRICING.inputPerMillion.toFixed(2)} / 1M tokens、キャッシュ入力 ${GPT_5_6_LUNA_PRICING.cachedInputPerMillion.toFixed(2)}、出力 ${GPT_5_6_LUNA_PRICING.outputPerMillion.toFixed(2)}。</span></div>
        <div><ShieldCheck /><span><strong>実行前ガード</strong>本文とGSC情報から保守的にtoken数を見積もり、上限を超えそうならOpenAI APIを呼びません。</span></div>
        <div><ShieldCheck /><span><strong>本文取得</strong>対象URLはVercelサーバーから通常fetchします。OpenAI Web Searchは使わないため、本文取得のOpenAI料金は $0.000000 です。</span></div>
      </div>
      <div className="p5-02-pricing-note">料金計算基準: {AI_PRICING_REFERENCE_DATE}。実行後はResponses APIの実使用token数から入力・キャッシュ入力・出力を分けて計算します。</div>
    </Card>
  );
}
