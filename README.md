# GSC Analyzer

Google Search Console のデータを「見る」だけではなく、次に実行すべきSEO改善へ変換するための分析アプリです。

## Current phase

**Phase 3 — Google OAuth / Search Console API / Analysis Engine**

Phase 2の全画面UIを維持したまま、Google OAuth 2.0、Search Console API、前期間比較、Opportunity Score、急上昇・急落・CTR改善・カニバリ判定を実データへ接続しています。OAuth未設定・未接続時はデモデータへ自動フォールバックします。

## Stack

- Next.js 15 / App Router
- React 19
- TypeScript
- SCSS
- Noto Sans JP only
- Google OAuth 2.0 (Web Server / PKCE / state)
- Search Console API
- Node.js crypto (AES-256-GCM encrypted HttpOnly session cookie)
- lucide-react
- GitHub Actions CI

## Phase 3 data flow

```text
Google OAuth 2.0
   ↓
Encrypted HttpOnly session
   ↓
Search Console API
   ├─ property list
   ├─ current period totals
   ├─ previous period totals
   ├─ query
   ├─ page
   ├─ query × page
   ├─ device
   └─ date
   ↓
Normalization / period comparison
   ↓
Analysis Engine
   ├─ Opportunity Score
   ├─ Growth signals
   ├─ Decline signals
   ├─ CTR gap vs own-site rank bucket benchmark
   ├─ Rank opportunities
   └─ Cannibalization candidates
   ↓
Phase 2 application UI
```

## Google Cloud setup

1. Google Cloud Consoleでプロジェクトを作成します。
2. **Google Search Console API** を有効化します。
3. OAuth consent screenを設定します。
4. OAuth Client IDを **Web application** として作成します。
5. Authorized redirect URIへ以下を登録します。

Local:

```text
http://localhost:3000/api/auth/google/callback
```

Production:

```text
https://YOUR_DOMAIN/api/auth/google/callback
```

Google側のredirect URIは完全一致が必要です。

`.env.example` を `.env.local` へコピーして設定してください。

```bash
cp .env.example .env.local
```

Required:

```env
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GSC_SESSION_SECRET=32文字以上の十分に長いランダム値
```

Optional:

```env
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
GSC_DATA_STATE=all
GSC_CACHE_TTL_SECONDS=300
GSC_MAX_ROWS=25000
```

`GOOGLE_REDIRECT_URI` を省略すると、実行中のoriginから `/api/auth/google/callback` を組み立てます。本番環境で固定したい場合のみ明示設定してください。

## OAuth security

- Search Console scopeは `webmasters.readonly` のみ
- `access_type=offline` でrefresh tokenを取得
- PKCE (`S256`) を使用
- OAuth `state` をHttpOnly cookieで検証
- Google access/refresh tokenはブラウザJavaScriptへ返却しない
- sessionはAES-256-GCMで暗号化したHttpOnly / SameSite=Lax cookie
- access token期限切れ前にサーバー側でrefresh
- refresh失敗時はsessionを破棄

## Search Console API behavior

Search Analytics APIは1リクエスト最大25,000行です。`GSC_MAX_ROWS` が25,000を超える場合は `startRow` を利用してページングします。ただしGoogle Search Console API自体が全データ行の返却を保証するAPIではなく、内部制限により上位データのみになる場合があります。

`GSC_DATA_STATE=all` の場合は新しい未確定データも含め、`metadata.first_incomplete_date` が返った場合はUIに警告を表示します。確定データだけで分析したい場合は `final` を指定してください。

## Analysis Engine

### Period comparison

7日 / 28日 / 90日の現在期間と、直前の同日数期間を比較します。

- clicks delta (%)
- impressions delta (%)
- CTR delta (percentage points)
- average position delta

### Opportunity Score

0〜100のスコアを以下から算出します。

- 検索需要（impressions）
- 現在の順位帯
- CTR改善余地
- クリック成長 / 下落
- 順位悪化リスク

CTR改善判定では固定の業界CTR値を使わず、**対象サイト自身のGSCデータから順位帯別CTRベンチマークを生成**して比較します。

### Cannibalization

`query × page` のGSCデータを集計し、同一クエリで複数URLが競合している候補を検出します。クリックシェアの分散、URL数、表示回数から重複度と優先度を算出します。

## API routes

- `GET /api/auth/google` — Google OAuth開始
- `GET /api/auth/google/callback` — OAuth callback
- `GET /api/auth/logout` — session破棄
- `GET /api/auth/session` — 接続状態（tokenは返しません）
- `GET /api/gsc/properties` — Search Console property list
- `GET /api/gsc/analysis` — 正規化済み分析bundle

## Application routes

- `/dashboard` — KPI・実日次推移・今日やるSEO・デバイス・順位分布
- `/queries` — クエリ実データ分析
- `/queries/[slug]` — クエリ詳細
- `/pages` — ページ実データ分析
- `/pages/[slug]` — ページ詳細
- `/opportunities` — Opportunity Score
- `/growth` — 急上昇
- `/declines` — 急落
- `/ctr` — CTR改善候補
- `/cannibalization` — query×pageカニバリ候補
- `/reports` — レポートUI
- `/settings` — OAuth接続・プロパティ・分析しきい値
- `/design-system` — live UI catalog

## Architecture

```text
src/
├─ app/
│  ├─ api/
│  │  ├─ auth/
│  │  └─ gsc/
│  └─ (app)/
├─ components/
│  ├─ ui/
│  ├─ analytics/
│  ├─ application/
│  │  ├─ gsc-context.tsx
│  │  ├─ live-workspaces.tsx
│  │  ├─ visuals.tsx
│  │  └─ workspaces.tsx
│  └─ layout/
├─ lib/
│  ├─ gsc/
│  │  ├─ analysis.ts
│  │  ├─ client.ts
│  │  ├─ crypto.ts
│  │  ├─ dates.ts
│  │  ├─ env.ts
│  │  ├─ oauth.ts
│  │  ├─ service.ts
│  │  ├─ session.ts
│  │  └─ types.ts
│  ├─ application-data.ts
│  └─ mock-data.ts
└─ styles/
   ├─ globals.scss
   ├─ phase2.scss
   └─ phase3.scss
```

## Development

```bash
npm install
npm run dev
```

Production build:

```bash
npm run build
```

## Phase roadmap

1. Foundation / Design System ✅
2. Application UI / Dummy Data / UX ✅
3. Google OAuth / GSC API / Analysis Engine ← current
4. Production intelligence / anomaly detection / AI assistance
