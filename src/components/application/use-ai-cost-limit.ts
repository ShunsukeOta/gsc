'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  DEFAULT_AI_COST_LIMIT_USD,
  MAX_AI_COST_LIMIT_USD,
  MIN_AI_COST_LIMIT_USD,
} from '@/lib/ai/constants';

const STORAGE_KEY = 'gsc-analyzer-ai-cost-limit-v1';
const EVENT_NAME = 'gsc-analyzer-ai-cost-limit-change';

function normalize(value: number) {
  if (!Number.isFinite(value)) return DEFAULT_AI_COST_LIMIT_USD;
  return Number(Math.min(MAX_AI_COST_LIMIT_USD, Math.max(MIN_AI_COST_LIMIT_USD, value)).toFixed(6));
}

function readLimit() {
  if (typeof window === 'undefined') return DEFAULT_AI_COST_LIMIT_USD;
  const parsed = Number(window.localStorage.getItem(STORAGE_KEY));
  return Number.isFinite(parsed) && parsed > 0 ? normalize(parsed) : DEFAULT_AI_COST_LIMIT_USD;
}

export function useAiCostLimit() {
  const [limitUsd, setLimitUsdState] = useState(DEFAULT_AI_COST_LIMIT_USD);

  useEffect(() => {
    setLimitUsdState(readLimit());
    const onStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) setLimitUsdState(readLimit());
    };
    const onCustom = (event: Event) => setLimitUsdState(normalize((event as CustomEvent<number>).detail));
    window.addEventListener('storage', onStorage);
    window.addEventListener(EVENT_NAME, onCustom);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener(EVENT_NAME, onCustom);
    };
  }, []);

  const setLimitUsd = useCallback((value: number) => {
    const next = normalize(value);
    window.localStorage.setItem(STORAGE_KEY, String(next));
    window.dispatchEvent(new CustomEvent<number>(EVENT_NAME, { detail: next }));
    setLimitUsdState(next);
    return next;
  }, []);

  return { limitUsd, setLimitUsd };
}
