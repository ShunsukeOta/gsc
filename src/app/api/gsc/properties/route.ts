import { NextResponse } from 'next/server';
import { listGscProperties, GscApiError } from '@/lib/gsc/client';
import { getFreshGoogleSession } from '@/lib/gsc/oauth';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const session = await getFreshGoogleSession();
    if (!session) return NextResponse.json({ error: 'Google Search Console is not connected.' }, { status: 401 });
    const properties = await listGscProperties(session.accessToken);
    return NextResponse.json({ properties });
  } catch (error) {
    if (error instanceof GscApiError) return NextResponse.json({ error: error.message }, { status: error.status });
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to load Search Console properties.' }, { status: 500 });
  }
}
