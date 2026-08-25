import { NextRequest, NextResponse } from 'next/server';
import { buildGoogleAuthorizationUrl } from '@/lib/gsc/oauth';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const url = await buildGoogleAuthorizationUrl(new URL(request.url).origin, request.nextUrl.searchParams.get('returnTo'));
    return NextResponse.redirect(url);
  } catch (error) {
    const target = new URL('/settings', request.url);
    target.searchParams.set('gsc_error', error instanceof Error ? error.message.slice(0, 160) : 'OAuth configuration error');
    return NextResponse.redirect(target);
  }
}
