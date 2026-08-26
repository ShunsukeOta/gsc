import { NextRequest, NextResponse } from 'next/server';
import { inspectPage } from '@/lib/page-inspector';
import { listGscProperties } from '@/lib/gsc/client';
import { getFreshGoogleSession } from '@/lib/gsc/oauth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function urlBelongsToProperty(siteUrl: string, targetUrl: string) {
  let target: URL;
  try { target = new URL(targetUrl); } catch { return false; }

  if (siteUrl.startsWith('sc-domain:')) {
    const domain = siteUrl.slice('sc-domain:'.length).trim().toLowerCase().replace(/^\.+|\.+$/g, '');
    const hostname = target.hostname.toLowerCase();
    return Boolean(domain) && (hostname === domain || hostname.endsWith(`.${domain}`));
  }

  try {
    const property = new URL(siteUrl);
    return target.href.startsWith(property.href);
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getFreshGoogleSession();
    if (!session) return NextResponse.json({ error: 'Google Search Console is not connected.' }, { status: 401 });

    const body = await request.json().catch(() => null) as { site?: string; url?: string } | null;
    const site = body?.site?.trim() ?? '';
    const url = body?.url?.trim() ?? '';
    if (!site || !url) return NextResponse.json({ error: 'site and url are required.' }, { status: 400 });

    const properties = await listGscProperties(session.accessToken);
    if (!properties.some((property) => property.siteUrl === site)) {
      return NextResponse.json({ error: '選択中のSearch Consoleプロパティを確認できませんでした。' }, { status: 403 });
    }
    if (!urlBelongsToProperty(site, url)) {
      return NextResponse.json({ error: '選択中のSearch Consoleプロパティ外のURLは取得できません。' }, { status: 403 });
    }

    const inspection = await inspectPage(url);
    return NextResponse.json({ inspection }, {
      headers: { 'cache-control': 'private, no-store, max-age=0' },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'ページ情報の取得に失敗しました。';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
