export const DEFAULT_AI_COST_LIMIT_USD = 0.1;
export const MIN_AI_COST_LIMIT_USD = 0.001;
export const MAX_AI_COST_LIMIT_USD = 10;
export const DEFAULT_AI_REWRITE_MODEL = 'gpt-5.6-luna';

export const GPT_5_6_LUNA_PRICING = {
  inputPerMillion: 0.2,
  cachedInputPerMillion: 0.02,
  cacheWritePerMillion: 0.25,
  outputPerMillion: 1.2,
} as const;

export const AI_PRICING_REFERENCE_DATE = '2026-08-26';
