import { cookies } from 'next/headers';
import { decryptJson, encryptJson } from './crypto';
import { getSessionSecret } from './env';
import type { GoogleSession, OAuthStatePayload } from './types';

const SESSION_COOKIE = 'gsc_session_v1';
const OAUTH_COOKIE = 'gsc_oauth_v1';

const secure = process.env.NODE_ENV === 'production';
const baseCookie = { httpOnly: true, secure, sameSite: 'lax' as const, path: '/' };

export async function readGoogleSession() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  return token ? decryptJson<GoogleSession>(token, getSessionSecret()) : null;
}

export async function writeGoogleSession(session: GoogleSession) {
  const store = await cookies();
  store.set(SESSION_COOKIE, encryptJson(session, getSessionSecret()), {
    ...baseCookie,
    maxAge: 60 * 60 * 24 * 90,
  });
}

export async function clearGoogleSession() {
  const store = await cookies();
  store.set(SESSION_COOKIE, '', { ...baseCookie, maxAge: 0 });
}

export async function writeOAuthState(payload: OAuthStatePayload) {
  const store = await cookies();
  store.set(OAUTH_COOKIE, encryptJson(payload, getSessionSecret()), {
    ...baseCookie,
    maxAge: 60 * 10,
  });
}

export async function consumeOAuthState() {
  const store = await cookies();
  const token = store.get(OAUTH_COOKIE)?.value;
  store.set(OAUTH_COOKIE, '', { ...baseCookie, maxAge: 0 });
  if (!token) return null;
  const payload = decryptJson<OAuthStatePayload>(token, getSessionSecret());
  if (!payload || Date.now() - payload.createdAt > 10 * 60 * 1000) return null;
  return payload;
}
