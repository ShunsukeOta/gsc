'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { AnalysisThresholds, GscAnalysisBundle, GscDevice, GscProperty } from '@/lib/gsc/types';

type SessionInfo = {
  configured: boolean;
  authenticated: boolean;
  email?: string;
  expiresAt?: number;
  error?: string;
};

type WorkspaceContextValue = {
  session: SessionInfo;
  sessionLoading: boolean;
  properties: GscProperty[];
  propertiesLoading: boolean;
  selectedSite: string;
  setSelectedSite: (site: string) => void;
  days: number;
  setDays: (days: number) => void;
  device: GscDevice;
  setDevice: (device: GscDevice) => void;
  thresholds: AnalysisThresholds;
  updateThresholds: (patch: Partial<AnalysisThresholds>) => void;
  analysis: GscAnalysisBundle | null;
  analysisLoading: boolean;
  analysisError: string | null;
  refresh: (force?: boolean) => Promise<void>;
  reloadConnection: () => Promise<void>;
};

const GscWorkspaceContext = createContext<WorkspaceContextValue | null>(null);
const PREF_KEY = 'gsc-analyzer-workspace-v1';
const DEFAULT_THRESHOLDS: AnalysisThresholds = {
  growthPercent: 15,
  declinePercent: -10,
  minImpressions: 1000,
  opportunityMaxPosition: 20,
};

function loadPrefs() {
  if (typeof window === 'undefined') return null;
  try {
    return JSON.parse(window.localStorage.getItem(PREF_KEY) ?? 'null') as {
      selectedSite?: string;
      days?: number;
      device?: GscDevice;
      thresholds?: Partial<AnalysisThresholds>;
    } | null;
  } catch {
    return null;
  }
}

export function GscWorkspaceProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<SessionInfo>({ configured: false, authenticated: false });
  const [sessionLoading, setSessionLoading] = useState(true);
  const [properties, setProperties] = useState<GscProperty[]>([]);
  const [propertiesLoading, setPropertiesLoading] = useState(false);
  const [selectedSite, setSelectedSiteState] = useState('');
  const [days, setDaysState] = useState(28);
  const [device, setDeviceState] = useState<GscDevice>('all');
  const [thresholds, setThresholds] = useState<AnalysisThresholds>(DEFAULT_THRESHOLDS);
  const [analysis, setAnalysis] = useState<GscAnalysisBundle | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const prefs = loadPrefs();
    if (prefs?.selectedSite) setSelectedSiteState(prefs.selectedSite);
    if (prefs?.days && [7, 28, 90].includes(prefs.days)) setDaysState(prefs.days);
    if (prefs?.device) setDeviceState(prefs.device);
    if (prefs?.thresholds) setThresholds((current) => ({ ...current, ...prefs.thresholds }));
    setHydrated(true);
  }, []);

  const persist = useCallback((patch: Record<string, unknown>) => {
    if (typeof window === 'undefined') return;
    const current = loadPrefs() ?? {};
    window.localStorage.setItem(PREF_KEY, JSON.stringify({ ...current, ...patch }));
  }, []);

  const reloadConnection = useCallback(async () => {
    setSessionLoading(true);
    try {
      const response = await fetch('/api/auth/session', { cache: 'no-store' });
      const data = await response.json() as SessionInfo;
      setSession(data);
      if (!data.authenticated) {
        setProperties([]);
        setAnalysis(null);
      }
    } catch (error) {
      setSession({ configured: false, authenticated: false, error: error instanceof Error ? error.message : 'Connection check failed' });
    } finally {
      setSessionLoading(false);
    }
  }, []);

  useEffect(() => { void reloadConnection(); }, [reloadConnection]);

  useEffect(() => {
    if (!session.authenticated) return;
    let cancelled = false;
    setPropertiesLoading(true);
    fetch('/api/gsc/properties', { cache: 'no-store' })
      .then(async (response) => {
        const data = await response.json() as { properties?: GscProperty[]; error?: string };
        if (!response.ok) throw new Error(data.error || 'プロパティ取得に失敗しました。');
        if (cancelled) return;
        const next = data.properties ?? [];
        setProperties(next);
        setSelectedSiteState((current) => {
          if (current && next.some((property) => property.siteUrl === current)) return current;
          const first = next[0]?.siteUrl ?? '';
          if (first) persist({ selectedSite: first });
          return first;
        });
      })
      .catch((error) => { if (!cancelled) setAnalysisError(error instanceof Error ? error.message : 'プロパティ取得に失敗しました。'); })
      .finally(() => { if (!cancelled) setPropertiesLoading(false); });
    return () => { cancelled = true; };
  }, [persist, session.authenticated]);

  const buildAnalysisUrl = useCallback((force = false) => {
    const params = new URLSearchParams({
      site: selectedSite,
      days: String(days),
      device,
      growth: String(thresholds.growthPercent),
      decline: String(thresholds.declinePercent),
      minImpressions: String(thresholds.minImpressions),
      maxPosition: String(thresholds.opportunityMaxPosition),
    });
    if (force) params.set('force', '1');
    return `/api/gsc/analysis?${params.toString()}`;
  }, [days, device, selectedSite, thresholds]);

  const refresh = useCallback(async (force = false) => {
    if (!session.authenticated || !selectedSite) return;
    setAnalysisLoading(true);
    setAnalysisError(null);
    try {
      const response = await fetch(buildAnalysisUrl(force), { cache: 'no-store' });
      const data = await response.json() as GscAnalysisBundle & { error?: string };
      if (!response.ok) throw new Error(data.error || 'Search Console分析に失敗しました。');
      setAnalysis(data);
    } catch (error) {
      setAnalysisError(error instanceof Error ? error.message : 'Search Console分析に失敗しました。');
    } finally {
      setAnalysisLoading(false);
    }
  }, [buildAnalysisUrl, selectedSite, session.authenticated]);

  useEffect(() => {
    if (!hydrated || !session.authenticated || !selectedSite) return;
    const timer = window.setTimeout(() => { void refresh(false); }, 450);
    return () => window.clearTimeout(timer);
  }, [hydrated, refresh, selectedSite, session.authenticated]);

  const setSelectedSite = useCallback((site: string) => {
    setSelectedSiteState(site);
    persist({ selectedSite: site });
  }, [persist]);
  const setDays = useCallback((value: number) => {
    const next = [7, 28, 90].includes(value) ? value : 28;
    setDaysState(next);
    persist({ days: next });
  }, [persist]);
  const setDevice = useCallback((value: GscDevice) => {
    setDeviceState(value);
    persist({ device: value });
  }, [persist]);
  const updateThresholds = useCallback((patch: Partial<AnalysisThresholds>) => {
    setThresholds((current) => {
      const next = { ...current, ...patch };
      persist({ thresholds: next });
      return next;
    });
  }, [persist]);

  const value = useMemo<WorkspaceContextValue>(() => ({
    session,
    sessionLoading,
    properties,
    propertiesLoading,
    selectedSite,
    setSelectedSite,
    days,
    setDays,
    device,
    setDevice,
    thresholds,
    updateThresholds,
    analysis,
    analysisLoading,
    analysisError,
    refresh,
    reloadConnection,
  }), [analysis, analysisError, analysisLoading, days, device, properties, propertiesLoading, refresh, reloadConnection, selectedSite, session, sessionLoading, setDays, setDevice, setSelectedSite, thresholds, updateThresholds]);

  return <GscWorkspaceContext.Provider value={value}>{children}</GscWorkspaceContext.Provider>;
}

export function useGscWorkspace() {
  const context = useContext(GscWorkspaceContext);
  if (!context) throw new Error('useGscWorkspace must be used inside GscWorkspaceProvider.');
  return context;
}
