import { NextRequest, NextResponse } from 'next/server';
import { clearGoogleSession } from '@/lib/gsc/oauth';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  await clearGoogleSession();
  const target = new URL('/settings', request.url);
  target.searchParams.set('gsc_disconnected', '1');
  return NextResponse.redirect(target);
}
