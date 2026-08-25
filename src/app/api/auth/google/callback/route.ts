import { NextRequest, NextResponse } from 'next/server';
import { handleGoogleOAuthCallback } from '@/lib/gsc/oauth';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  const state = request.nextUrl.searchParams.get('state');
  const oauthError = request.nextUrl.searchParams.get('error');

  if (oauthError || !code || !state) {
    const target = new URL('/settings', request.url);
    target.searchParams.set('gsc_error', oauthError || 'Google OAuth callback is missing code/state.');
    return NextResponse.redirect(target);
  }

  try {
    const returnTo = await handleGoogleOAuthCallback(new URL(request.url).origin, code, state);
    const target = new URL(returnTo, request.url);
    target.searchParams.set('gsc_connected', '1');
    return NextResponse.redirect(target);
  } catch (error) {
    const target = new URL('/settings', request.url);
    target.searchParams.set('gsc_error', error instanceof Error ? error.message.slice(0, 180) : 'Google OAuth failed.');
    return NextResponse.redirect(target);
  }
}
