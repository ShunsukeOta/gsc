// Phase 5 compatibility bridge.
// Production analysis types live in analysis-types.ts. Historical imports are re-exported
// here temporarily so the analysis engine can evolve without carrying any demo dataset.
export type { Opportunity, PerformanceRow, Priority, SignalRow, TrendDirection } from './analysis-types';
