import type { AnalysisThresholds, GscDataState } from './types';

export const DEFAULT_THRESHOLDS: AnalysisThresholds = {
  growthPercent: 15,
  declinePercent: -10,
  minImpressions: 1000,
  opportunityMaxPosition: 20,
};

const integerEnv = (name: string, fallback: number, min: number, max: number) => {
  const parsed = Number.parseInt(process.env[name] ?? '', 10);
  return Number.isFinite(parsed) ? Math.min(max, Math.max(min, parsed)) : fallback;
};

export function isGoogleOAuthConfigured() {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.GSC_SESSION_SECRET);
}

export function getGoogleCredentials() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const sessionSecret = process.env.GSC_SESSION_SECRET;
  if (!clientId || !clientSecret || !sessionSecret) {
    throw new Error('Google OAuth is not configured. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET and GSC_SESSION_SECRET.');
  }
  if (sessionSecret.length < 32) throw new Error('GSC_SESSION_SECRET must be at least 32 characters.');
  return { clientId, clientSecret, sessionSecret };
}

export function getGoogleOAuthConfig(origin: string) {
  const credentials = getGoogleCredentials();
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${origin}/api/auth/google/callback`;
  return { ...credentials, redirectUri };
}

export function getSessionSecret() {
  return getGoogleCredentials().sessionSecret;
}

export function getGscRuntimeConfig() {
  const state = process.env.GSC_DATA_STATE === 'final' ? 'final' : 'all';
  return {
    dataState: state as GscDataState,
    cacheTtlMs: integerEnv('GSC_CACHE_TTL_SECONDS', 300, 0, 3600) * 1000,
    maxRows: integerEnv('GSC_MAX_ROWS', 25000, 100, 100000),
  };
}
