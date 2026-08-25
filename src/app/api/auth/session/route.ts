import { NextResponse } from 'next/server';
import { isGoogleOAuthConfigured } from '@/lib/gsc/env';
import { getFreshGoogleSession } from '@/lib/gsc/oauth';

export const runtime = 'nodejs';

export async function GET() {
  if (!isGoogleOAuthConfigured()) {
    return NextResponse.json({ configured: false, authenticated: false });
  }
  try {
    const session = await getFreshGoogleSession();
    return NextResponse.json({
      configured: true,
      authenticated: Boolean(session),
      email: session?.email,
      expiresAt: session?.expiresAt,
    });
  } catch (error) {
    return NextResponse.json({
      configured: true,
      authenticated: false,
      error: error instanceof Error ? error.message : 'Session refresh failed',
    });
  }
}
