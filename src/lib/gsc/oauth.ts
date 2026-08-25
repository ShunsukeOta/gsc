import { createHash, randomBytes } from 'node:crypto';
import { clearGoogleSession, consumeOAuthState, readGoogleSession, writeGoogleSession, writeOAuthState } from './session';
import { getGoogleCredentials, getGoogleOAuthConfig } from './env';
import type { GoogleSession } from './types';

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO_URL = 'https://openidconnect.googleapis.com/v1/userinfo';
const SCOPES = ['openid', 'email', 'https://www.googleapis.com/auth/webmasters.readonly'];

const safeReturnTo = (value: string | null) => value && value.startsWith('/') && !value.startsWith('//') ? value : '/settings';

export async function buildGoogleAuthorizationUrl(origin: string, returnToValue: string | null) {
  const config = getGoogleOAuthConfig(origin);
  const state = randomBytes(24).toString('base64url');
  const verifier = randomBytes(48).toString('base64url');
  const challenge = createHash('sha256').update(verifier).digest('base64url');
  const returnTo = safeReturnTo(returnToValue);

  await writeOAuthState({ state, verifier, returnTo, createdAt: Date.now() });

  const url = new URL(GOOGLE_AUTH_URL);
  url.searchParams.set('client_id', config.clientId);
  url.searchParams.set('redirect_uri', config.redirectUri);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', SCOPES.join(' '));
  url.searchParams.set('access_type', 'offline');
  url.searchParams.set('include_granted_scopes', 'true');
  url.searchParams.set('prompt', 'consent select_account');
  url.searchParams.set('state', state);
  url.searchParams.set('code_challenge', challenge);
  url.searchParams.set('code_challenge_method', 'S256');
  return url;
}

type TokenResponse = {
  access_token?: string;
  expires_in?: number;
  refresh_token?: string;
  scope?: string;
  error?: string;
  error_description?: string;
};

async function tokenRequest(body: URLSearchParams): Promise<TokenResponse> {
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body,
    cache: 'no-store',
  });
  const data = await response.json() as TokenResponse;
  if (!response.ok || data.error) throw new Error(data.error_description || data.error || `Google token request failed (${response.status})`);
  return data;
}

export async function handleGoogleOAuthCallback(origin: string, code: string, returnedState: string) {
  const oauthState = await consumeOAuthState();
  if (!oauthState || oauthState.state !== returnedState) throw new Error('OAuth state validation failed. Please connect again.');

  const config = getGoogleOAuthConfig(origin);
  const token = await tokenRequest(new URLSearchParams({
    code,
    client_id: config.clientId,
    client_secret: config.clientSecret,
    redirect_uri: config.redirectUri,
    grant_type: 'authorization_code',
    code_verifier: oauthState.verifier,
  }));

  if (!token.access_token || !token.refresh_token) throw new Error('Google did not return the required offline credentials. Revoke the app permission and connect again.');

  let email: string | undefined;
  try {
    const profileResponse = await fetch(GOOGLE_USERINFO_URL, {
      headers: { authorization: `Bearer ${token.access_token}` },
      cache: 'no-store',
    });
    if (profileResponse.ok) {
      const profile = await profileResponse.json() as { email?: string };
      email = profile.email;
    }
  } catch {
    // Search Console access remains usable even if profile lookup fails.
  }

  await writeGoogleSession({
    accessToken: token.access_token,
    refreshToken: token.refresh_token,
    expiresAt: Date.now() + (token.expires_in ?? 3600) * 1000,
    scope: token.scope,
    email,
  });
  return oauthState.returnTo;
}

export async function getFreshGoogleSession(): Promise<GoogleSession | null> {
  const session = await readGoogleSession();
  if (!session) return null;
  if (session.expiresAt - Date.now() > 60_000) return session;

  try {
    const credentials = getGoogleCredentials();
    const token = await tokenRequest(new URLSearchParams({
      client_id: credentials.clientId,
      client_secret: credentials.clientSecret,
      refresh_token: session.refreshToken,
      grant_type: 'refresh_token',
    }));
    if (!token.access_token) throw new Error('Refresh response did not contain an access token.');
    const refreshed: GoogleSession = {
      ...session,
      accessToken: token.access_token,
      expiresAt: Date.now() + (token.expires_in ?? 3600) * 1000,
      scope: token.scope ?? session.scope,
    };
    await writeGoogleSession(refreshed);
    return refreshed;
  } catch (error) {
    await clearGoogleSession();
    throw error;
  }
}

export { clearGoogleSession };
