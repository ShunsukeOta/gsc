import {
  DEFAULT_AI_COST_LIMIT_USD,
  GPT_5_6_LUNA_PRICING,
  MAX_AI_COST_LIMIT_USD,
  MIN_AI_COST_LIMIT_USD,
} from './constants';

export type AiUsage = {
  inputTokens: number;
  cachedInputTokens: number;
  outputTokens: number;
  totalTokens: number;
};

export type AiCostBreakdown = {
  inputUsd: number;
  cachedInputUsd: number;
  outputUsd: number;
  totalUsd: number;
};

export function normalizeAiCostLimit(value: unknown) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return DEFAULT_AI_COST_LIMIT_USD;
  return Math.min(MAX_AI_COST_LIMIT_USD, Math.max(MIN_AI_COST_LIMIT_USD, parsed));
}

export function estimateTokenUpperBound(text: string) {
  // OpenAI text tokenizers are byte-based BPEs. UTF-8 byte length is deliberately used as
  // a conservative upper bound: normal text is encoded into far fewer tokens than bytes.
  return Math.max(1, new TextEncoder().encode(text).byteLength);
}

export function planRewriteBudget(prompt: string, limitUsd: number) {
  const normalizedLimit = normalizeAiCostLimit(limitUsd);
  const estimatedInputTokens = estimateTokenUpperBound(prompt);
  const estimatedInputUsd = estimatedInputTokens / 1_000_000 * GPT_5_6_LUNA_PRICING.inputPerMillion;
  const safetyBudgetUsd = normalizedLimit * 0.98;
  const remainingUsd = Math.max(0, safetyBudgetUsd - estimatedInputUsd);
  const budgetOutputTokens = Math.floor(remainingUsd / GPT_5_6_LUNA_PRICING.outputPerMillion * 1_000_000);
  const desiredOutputTokens = 20_000;
  const minUsefulOutputTokens = 1_500;
  const maxOutputTokens = Math.min(desiredOutputTokens, Math.max(0, budgetOutputTokens));
  const estimatedMaxUsd = estimatedInputUsd + maxOutputTokens / 1_000_000 * GPT_5_6_LUNA_PRICING.outputPerMillion;

  return {
    limitUsd: normalizedLimit,
    estimatedInputTokens,
    estimatedInputUsd,
    maxOutputTokens,
    estimatedMaxUsd,
    blocked: maxOutputTokens < minUsefulOutputTokens,
    minUsefulOutputTokens,
  };
}

export function calculateActualAiCost(usage: AiUsage): AiCostBreakdown {
  const cached = Math.min(Math.max(usage.cachedInputTokens, 0), Math.max(usage.inputTokens, 0));
  const uncached = Math.max(0, usage.inputTokens - cached);
  const inputUsd = uncached / 1_000_000 * GPT_5_6_LUNA_PRICING.inputPerMillion;
  const cachedInputUsd = cached / 1_000_000 * GPT_5_6_LUNA_PRICING.cachedInputPerMillion;
  const outputUsd = Math.max(0, usage.outputTokens) / 1_000_000 * GPT_5_6_LUNA_PRICING.outputPerMillion;
  return { inputUsd, cachedInputUsd, outputUsd, totalUsd: inputUsd + cachedInputUsd + outputUsd };
}
