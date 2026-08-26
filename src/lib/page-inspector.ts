import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import type { PageHeadingInfo, PageInspection } from '@/lib/page-inspector-types';

const MAX_PAGE_BYTES = 2_000_000;
const MAX_REDIRECTS = 4;

function isPrivateIpv4(address: string) {
  const parts = address.split('.').map(Number);
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return true;
  const [a, b] = parts;
  if (a === 0 || a === 10 || a === 127) return true;
  if (a === 100 && b >= 64 && b <= 127) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 198 && (b === 18 || b === 19)) return true;
  return a >= 224;
}

function isPrivateAddress(address: string) {
  const normalized = address.toLowerCase().split('%')[0];
  const version = isIP(normalized);
  if (version === 4) return isPrivateIpv4(normalized);
  if (version !== 6) return true;
  if (normalized === '::' || normalized === '::1') return true;
  if (normalized.startsWith('fc') || normalized.startsWith('fd')) return true;
  if (/^fe[89ab]/.test(normalized)) return true;
  if (normalized.startsWith('::ffff:')) {
    const mapped = normalized.slice('::ffff:'.length);
    if (isIP(mapped) === 4) return isPrivateIpv4(mapped);
  }
  return false;
}

async function validatePublicUrl(url: URL) {
  if (url.protocol !== 'http:' && url.protocol !== 'https:') throw new Error('対象ページはhttp/https URLである必要があります。');
  if (url.username || url.password) throw new Error('認証情報付きURLは取得できません。');
  const hostname = url.hostname.replace(/^\[|\]$/g, '').toLowerCase();
  if (!hostname || hostname === 'localhost' || hostname.endsWith('.localhost')) throw new Error('ローカルURLは取得できません。');
  if (hostname === 'metadata.google.internal') throw new Error('内部メタデータURLは取得できません。');

  if (isIP(hostname)) {
    if (isPrivateAddress(hostname)) throw new Error('プライベートIPへのアクセスは拒否されました。');
    return;
  }

  const records = await lookup(hostname, { all: true, verbatim: true });
  if (!records.length) throw new Error('対象ページのホスト名を解決できませんでした。');
  if (records.some((record) => isPrivateAddress(record.address))) throw new Error('プライベートネットワークへ解決されるURLは取得できません。');
}

async function readLimitedText(response: Response) {
  const declaredLength = Number(response.headers.get('content-length') || 0);
  if (declaredLength > MAX_PAGE_BYTES) throw new Error('対象ページが大きすぎます。2MB以下のHTMLのみ対応しています。');
  if (!response.body) return '';

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let bytes = 0;
  let text = '';
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > MAX_PAGE_BYTES) {
        await reader.cancel();
        throw new Error('対象ページが大きすぎます。2MB以下のHTMLのみ対応しています。');
      }
      text += decoder.decode(value, { stream: true });
    }
    text += decoder.decode();
    return text;
  } finally {
    reader.releaseLock();
  }
}

async function fetchHtml(rawUrl: string) {
  const requestedUrl = new URL(rawUrl).toString();
  let current = new URL(requestedUrl);
  let redirectCount = 0;

  while (redirectCount <= MAX_REDIRECTS) {
    await validatePublicUrl(current);
    const response = await fetch(current, {
      method: 'GET',
      redirect: 'manual',
      cache: 'no-store',
      signal: AbortSignal.timeout(12_000),
      headers: {
        accept: 'text/html,application/xhtml+xml,text/plain;q=0.8,*/*;q=0.1',
        'user-agent': 'GSC-Analyzer/1.0 (+page inspector)',
      },
    });

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      if (!location) throw new Error(`対象ページのリダイレクト先が取得できませんでした (${response.status})。`);
      redirectCount += 1;
      if (redirectCount > MAX_REDIRECTS) throw new Error('リダイレクト回数が上限を超えました。');
      current = new URL(location, current);
      continue;
    }

    const contentType = (response.headers.get('content-type') || '').toLowerCase();
    const htmlLike = !contentType || contentType.includes('text/html') || contentType.includes('application/xhtml+xml') || contentType.includes('text/plain');
    const html = htmlLike ? await readLimitedText(response) : '';
    return {
      requestedUrl,
      finalUrl: current.toString(),
      status: response.status,
      redirectCount,
      contentType,
      xRobotsTag: response.headers.get('x-robots-tag') ?? '',
      html,
    };
  }

  throw new Error('対象ページを取得できませんでした。');
}

const ENTITY_MAP: Record<string, string> = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', hellip: '…', mdash: '—', ndash: '–',
  lsquo: '‘', rsquo: '’', ldquo: '“', rdquo: '”', copy: '©', reg: '®', trade: '™',
};

function codePoint(value: number, fallback: string) {
  return Number.isFinite(value) && value >= 0 && value <= 0x10ffff ? String.fromCodePoint(value) : fallback;
}

function decodeEntities(value: string) {
  return value
    .replace(/&#x([0-9a-f]+);/gi, (match, hex: string) => codePoint(Number.parseInt(hex, 16), match))
    .replace(/&#(\d+);/g, (match, decimal: string) => codePoint(Number.parseInt(decimal, 10), match))
    .replace(/&([a-z]+);/gi, (match, name: string) => ENTITY_MAP[name.toLowerCase()] ?? match);
}

function stripTags(value: string) {
  return decodeEntities(value.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
}

function attr(tag: string, name: string) {
  const quoted = tag.match(new RegExp(`${name}\\s*=\\s*(["'])([\\s\\S]*?)\\1`, 'i'));
  if (quoted?.[2] !== undefined) return decodeEntities(quoted[2].trim());
  const bare = tag.match(new RegExp(`${name}\\s*=\\s*([^\\s>]+)`, 'i'));
  return bare?.[1] ? decodeEntities(bare[1].trim()) : '';
}

function metaContent(html: string, key: string) {
  for (const tag of html.match(/<meta\b[^>]*>/gi) ?? []) {
    const identity = (attr(tag, 'name') || attr(tag, 'property')).toLowerCase();
    if (identity === key.toLowerCase()) return attr(tag, 'content');
  }
  return '';
}

function canonicalUrl(html: string, baseUrl: string) {
  for (const tag of html.match(/<link\b[^>]*>/gi) ?? []) {
    if (!attr(tag, 'rel').toLowerCase().split(/\s+/).includes('canonical')) continue;
    const href = attr(tag, 'href');
    if (!href) return '';
    try { return new URL(href, baseUrl).toString(); } catch { return href; }
  }
  return '';
}

function absoluteValue(value: string, baseUrl: string) {
  if (!value) return '';
  try { return new URL(value, baseUrl).toString(); } catch { return value; }
}

function collectHeadings(html: string) {
  const headings: PageHeadingInfo[] = [];
  const regex = /<(h[1-6])\b[^>]*>([\s\S]*?)<\/\1>/gi;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(html)) && headings.length < 120) {
    const text = stripTags(match[2]);
    if (!text) continue;
    headings.push({ level: Number(match[1].slice(1)) as PageHeadingInfo['level'], text });
  }
  return headings;
}

function visibleBodyText(html: string) {
  const body = html.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i)?.[1] ?? html;
  return decodeEntities(body
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<(script|style|noscript|svg|iframe|canvas|template|form)\b[^>]*>[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]+>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim();
}

function charsetValue(html: string) {
  for (const tag of html.match(/<meta\b[^>]*>/gi) ?? []) {
    const direct = attr(tag, 'charset');
    if (direct) return direct;
    if (attr(tag, 'http-equiv').toLowerCase() === 'content-type') {
      const content = attr(tag, 'content');
      const match = content.match(/charset\s*=\s*([^;\s]+)/i);
      if (match?.[1]) return match[1];
    }
  }
  return '';
}

function htmlLang(html: string) {
  const tag = html.match(/<html\b[^>]*>/i)?.[0] ?? '';
  return attr(tag, 'lang');
}

function structuredDataInfo(html: string) {
  const types = new Set<string>();
  let blocks = 0;
  let invalidBlocks = 0;
  const regex = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;

  const collectTypes = (value: unknown) => {
    if (Array.isArray(value)) {
      value.forEach(collectTypes);
      return;
    }
    if (!value || typeof value !== 'object') return;
    const record = value as Record<string, unknown>;
    const type = record['@type'];
    if (typeof type === 'string') types.add(type);
    if (Array.isArray(type)) type.forEach((item) => { if (typeof item === 'string') types.add(item); });
    Object.values(record).forEach(collectTypes);
  };

  while ((match = regex.exec(html))) {
    const openTag = `<script${match[1]}>`;
    if (attr(openTag, 'type').toLowerCase() !== 'application/ld+json') continue;
    blocks += 1;
    try {
      collectTypes(JSON.parse(match[2].trim()));
    } catch {
      invalidBlocks += 1;
    }
  }

  return { types: [...types].sort(), blocks, invalidBlocks };
}

function linkInfo(html: string, baseUrl: string) {
  let internal = 0;
  let external = 0;
  let nofollow = 0;
  const base = new URL(baseUrl);

  for (const tag of html.match(/<a\b[^>]*>/gi) ?? []) {
    const href = attr(tag, 'href').trim();
    if (!href || href.startsWith('#') || /^(mailto:|tel:|javascript:|data:)/i.test(href)) continue;
    let resolved: URL;
    try { resolved = new URL(href, base); } catch { continue; }
    if (resolved.protocol !== 'http:' && resolved.protocol !== 'https:') continue;
    if (resolved.hostname === base.hostname) internal += 1;
    else external += 1;
    if (attr(tag, 'rel').toLowerCase().split(/\s+/).includes('nofollow')) nofollow += 1;
  }

  return { total: internal + external, internal, external, nofollow };
}

function imageInfo(html: string) {
  let total = 0;
  let missingAlt = 0;
  let emptyAlt = 0;
  let lazyLoaded = 0;
  for (const tag of html.match(/<img\b[^>]*>/gi) ?? []) {
    total += 1;
    const hasAlt = /\balt\s*=/i.test(tag);
    if (!hasAlt) missingAlt += 1;
    else if (!attr(tag, 'alt').trim()) emptyAlt += 1;
    if (attr(tag, 'loading').toLowerCase() === 'lazy') lazyLoaded += 1;
  }
  return { total, missingAlt, emptyAlt, lazyLoaded };
}

export async function inspectPage(rawUrl: string): Promise<PageInspection> {
  const fetched = await fetchHtml(rawUrl);
  const html = fetched.html;
  const headings = collectHeadings(html);
  const headingCounts = { h1: 0, h2: 0, h3: 0, h4: 0, h5: 0, h6: 0 };
  headings.forEach((heading) => { headingCounts[`h${heading.level}` as keyof typeof headingCounts] += 1; });
  const title = stripTags(html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? '');

  return {
    requestedUrl: fetched.requestedUrl,
    finalUrl: fetched.finalUrl,
    fetchedAt: new Date().toISOString(),
    status: fetched.status,
    redirectCount: fetched.redirectCount,
    contentType: fetched.contentType,
    title,
    metaDescription: metaContent(html, 'description'),
    canonical: canonicalUrl(html, fetched.finalUrl),
    metaRobots: metaContent(html, 'robots'),
    googlebotRobots: metaContent(html, 'googlebot'),
    xRobotsTag: fetched.xRobotsTag,
    lang: htmlLang(html),
    charset: charsetValue(html),
    viewport: metaContent(html, 'viewport'),
    h1s: headings.filter((heading) => heading.level === 1).map((heading) => heading.text),
    headings,
    headingCounts,
    bodyTextChars: visibleBodyText(html).length,
    openGraph: {
      title: metaContent(html, 'og:title'),
      description: metaContent(html, 'og:description'),
      image: absoluteValue(metaContent(html, 'og:image'), fetched.finalUrl),
      type: metaContent(html, 'og:type'),
      url: absoluteValue(metaContent(html, 'og:url'), fetched.finalUrl),
    },
    twitter: {
      card: metaContent(html, 'twitter:card'),
      title: metaContent(html, 'twitter:title'),
      description: metaContent(html, 'twitter:description'),
      image: absoluteValue(metaContent(html, 'twitter:image'), fetched.finalUrl),
    },
    structuredData: structuredDataInfo(html),
    links: linkInfo(html, fetched.finalUrl),
    images: imageInfo(html),
  };
}
