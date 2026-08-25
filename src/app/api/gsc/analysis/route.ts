import { NextRequest, NextResponse } from 'next/server';
import { GscApiError } from '@/lib/gsc/client';
import { DEFAULT_THRESHOLDS } from '@/lib/gsc/env';
import { getFreshGoogleSession } from '@/lib/gsc/oauth';
import { getGscAnalysis } from '@/lib/gsc/service';
import type { GscDevice } from '@/lib/gsc/types';

export const runtime = 'nodejs';

const numberParam = (value: string | null, fallback: number, min: number, max: number) => {
  const number = Number(value);
  return Number.isFinite(number) ? Math.min(max, Math.max(min, number)) : fallback;
};

export async function GET(request: NextRequest) {
  const siteUrl = request.nextUrl.searchParams.get('site');
  if (!siteUrl) return NextResponse.json({ error: 'site is required.' }, { status: 400 });

  try {
    const session = await getFreshGoogleSession();
    if (!session) return NextResponse.json({ error: 'Google Search Console is not connected.' }, { status: 401 });

    const days = numberParam(request.nextUrl.searchParams.get('days'), 28, 7, 90);
    const rawDevice = request.nextUrl.searchParams.get('device');
    const device: GscDevice = rawDevice === 'MOBILE' || rawDevice === 'DESKTOP' || rawDevice === 'TABLET' ? rawDevice : 'all';
    const thresholds = {
      growthPercent: numberParam(request.nextUrl.searchParams.get('growth'), DEFAULT_THRESHOLDS.growthPercent, 1, 500),
      declinePercent: numberParam(request.nextUrl.searchParams.get('decline'), DEFAULT_THRESHOLDS.declinePercent, -100, -1),
      minImpressions: numberParam(request.nextUrl.searchParams.get('minImpressions'), DEFAULT_THRESHOLDS.minImpressions, 1, 1_000_000),
      opportunityMaxPosition: numberParam(request.nextUrl.searchParams.get('maxPosition'), DEFAULT_THRESHOLDS.opportunityMaxPosition, 5, 100),
    };

    const analysis = await getGscAnalysis(session.accessToken, siteUrl, {
      days,
      device,
      thresholds,
      force: request.nextUrl.searchParams.get('force') === '1',
    });
    return NextResponse.json(analysis);
  } catch (error) {
    if (error instanceof GscApiError) return NextResponse.json({ error: error.message, details: error.details }, { status: error.status });
    return NextResponse.json({ error: error instanceof Error ? error.message : 'GSC analysis failed.' }, { status: 500 });
  }
}
