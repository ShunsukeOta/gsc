import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';

const MAX_PAGE_BYTES = 2_000_000;
const MAX_TEXT_CHARS = 45_000;
const MAX_REDIRECTS = 4;

export type FetchedPageContent = {
  url: string;
  title: string;
  metaDescription: string;
  canonical: string;
  h1: string;
  headings: string[];
  text: string;
  sourceChars: number;
};

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

  const ipVersion = isIP(hostname);
  if (ipVersion) {
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
  let total = 0;
  let text = '';
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_PAGE_BYTES) {
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
  let current = new URL(rawUrl);
  for (let redirectCount = 0; redirectCount <= MAX_REDIRECTS; redirectCount += 1) {
    await validatePublicUrl(current);
    const response = await fetch(current, {
      method: 'GET',
      redirect: 'manual',
      cache: 'no-store',
      signal: AbortSignal.timeout(12_000),
      headers: {
        accept: 'text/html,application/xhtml+xml,text/plain;q=0.8,*/*;q=0.1',
        'user-agent': 'GSC-Analyzer/1.0 (+AI rewrite page fetch)',
      },
    });

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      if (!location) throw new Error(`対象ページのリダイレクト先が取得できませんでした (${response.status})。`);
      current = new URL(location, current);
      continue;
    }
    if (!response.ok) throw new Error(`対象ページの取得に失敗しました (${response.status})。`);

    const contentType = (response.headers.get('content-type') || '').toLowerCase();
    if (contentType && !contentType.includes('text/html') && !contentType.includes('application/xhtml+xml') && !contentType.includes('text/plain')) {
      throw new Error(`HTMLページではないため本文を取得できません (${contentType})。`);
    }
    return { finalUrl: current.toString(), contentType, html: await readLimitedText(response) };
  }
  throw new Error('リダイレクト回数が上限を超えました。');
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
  if (quoted?.[2]) return decodeEntities(quoted[2].trim());
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

function collectHeadings(html: string) {
  const rows: string[] = [];
  const regex = /<(h[1-3])\b[^>]*>([\s\S]*?)<\/\1>/gi;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(html)) && rows.length < 40) {
    const text = stripTags(match[2]);
    if (text) rows.push(`${match[1].toUpperCase()}: ${text}`);
  }
  return rows;
}

function pickContentRoot(html: string) {
  const main = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1];
  if (main && stripTags(main).length >= 300) return main;

  const articles: string[] = [];
  const articleRegex = /<article\b[^>]*>([\s\S]*?)<\/article>/gi;
  let articleMatch: RegExpExecArray | null;
  while ((articleMatch = articleRegex.exec(html))) articles.push(articleMatch[1]);
  const article = articles.sort((a, b) => stripTags(b).length - stripTags(a).length)[0];
  if (article && stripTags(article).length >= 300) return article;

  return html.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i)?.[1] ?? html;
}

function visibleText(html: string) {
  const root = pickContentRoot(html);
  const cleaned = root
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<(script|style|noscript|svg|iframe|canvas|template|form|nav|footer|aside)\b[^>]*>[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|section|article|main|li|h[1-6]|tr|blockquote)>/gi, '\n')
    .replace(/<li\b[^>]*>/gi, '・')
    .replace(/<[^>]+>/g, ' ');
  const decoded = decodeEntities(cleaned).replace(/\r/g, '');
  const lines = decoded.split('\n').map((line) => line.replace(/[\t ]+/g, ' ').trim()).filter(Boolean);
  const deduped: string[] = [];
  for (const line of lines) {
    if (line.length < 2) continue;
    if (deduped.at(-1) === line) continue;
    deduped.push(line);
  }
  return deduped.join('\n').slice(0, MAX_TEXT_CHARS);
}

export async function fetchPageContent(rawUrl: string): Promise<FetchedPageContent> {
  const fetched = await fetchHtml(rawUrl);
  if (fetched.contentType.includes('text/plain')) {
    const text = fetched.html.slice(0, MAX_TEXT_CHARS).trim();
    return { url: fetched.finalUrl, title: '', metaDescription: '', canonical: '', h1: '', headings: [], text, sourceChars: text.length };
  }

  const title = stripTags(fetched.html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? '');
  const headings = collectHeadings(fetched.html);
  const h1 = headings.find((heading) => heading.startsWith('H1: '))?.slice(4) ?? '';
  const text = visibleText(fetched.html);
  if (text.length < 80) throw new Error('対象ページから十分な本文を抽出できませんでした。JavaScript描画ページの可能性があります。');
  return {
    url: fetched.finalUrl,
    title,
    metaDescription: metaContent(fetched.html, 'description'),
    canonical: canonicalUrl(fetched.html, fetched.finalUrl),
    h1,
    headings,
    text,
    sourceChars: text.length,
  };
}
