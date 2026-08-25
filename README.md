# GSC Analyzer

Google Search Console のデータを「見る」だけではなく、次に実行すべきSEO改善へ変換するための分析アプリです。

## Current phase

**Phase 4 — Production Intelligence / URL Normalization / Anomaly Detection**

Phase 3のGoogle OAuth / Search Console API / Opportunity Scoreを土台に、本番利用で問題になりやすいURLバリアント、未確定データ、取得上限、異常検知、実CSV出力、軽量履歴、任意のAI改善ブリーフまで対応しています。

## Stack

- Next.js 15 / App Router
- React 19
- TypeScript
- SCSS
- Noto Sans JP only
- Google OAuth 2.0 (Web Server / PKCE / state)
- Search Console API
- Node.js crypto (AES-256-GCM encrypted HttpOnly session cookie)
- Optional OpenAI Responses API for SEO briefs
- lucide-react
- GitHub Actions CI

## Phase 4 data flow

```text
Google OAuth 2.0
   ↓
Encrypted HttpOnly session
   ↓
Search Console API
   ├─ current / previous totals
   ├─ query
   ├─ page
   ├─ query × page
   ├─ device
   └─ date
   ↓
URL normalization
   ├─ #fragmentをページ識別から除外
   ├─ 同一ページのclicks / impressionsを合算
   ├─ CTRを再計算
   ├─ positionをimpressions加重平均
   └─ 元URL variantを診断情報として保持
   ↓
Period comparison / Analysis Engine
   ├─ Opportunity Score
   ├─ Growth / Decline / CTR signals
   ├─ Cannibalization
   └─ Relations
   ↓
Production Intelligence
   ├─ rank-loss / ctr-loss / demand-loss
   ├─ traffic-drop / growth-breakout / daily-drop
   └─ data quality score
   ↓
Dashboard / Anomalies / CSV / local snapshots / optional AI brief
```

## URL normalization policy

Phase 4では、Search Consoleが次のようなURLを返した場合に同一ページとして集約します。

```text
https://campaign-navi.com/betimo/
https://campaign-navi.com/betimo/#新規登録キャンペーンコードは必要
https://campaign-navi.com/betimo/#section-2
```

分析上のページIDは以下になります。

```text
https://campaign-navi.com/betimo/
```

重要な方針:

- **`#fragment` のみ自動除外**
- `?query=...` は別ページの可能性があるため保持
- 元URL variantは捨てず `urlNormalization.groups` に保持
- current page / previous page / query×page を同じ規則で正規化
- Cannibalization判定でもfragment違いを別ページ扱いしない
- Opportunity / CTR / Page detail / Relations は正規化後URLを使用

集約時は単純に1行を残すのではなく、clicks / impressionsを合算し、CTRを `clicks / impressions` で再計算、positionをimpressions加重平均します。これによりfragment単位の0% CTRカードや疑似カニバリを防ぎます。

## Production anomaly detection

`/anomalies` では単なる増減率ではなく原因候補を分類します。

- `rank-loss` — 順位悪化 + クリック減
- `ctr-loss` — 順位維持 + CTR低下
- `demand-loss` — 順位維持 + 表示回数減
- `traffic-drop` — 大幅なクリック減
- `growth-breakout` — クリック / 表示回数の強い成長
- `daily-drop` — 確定済み直近日が直近7日中央値を大幅に下回る

各シグナルはscore / confidence / evidence / recommended action / scopeを持ちます。`metadata.first_incomplete_date` 以降は日次異常検知の基準から除外し、Google側の処理遅延による誤検知を抑えます。

## Data quality

分析結果そのものだけでなく、分析データの状態も0〜100でスコア化します。

- incomplete data
- query row cap
- page row cap
- query×page row cap
- normalized URL groups

`queryAllSearchAnalytics` が設定上限までフルに取得した場合は `truncated` として診断します。ただしSearch Analytics API自体がGoogle内部の上位行制限を受ける可能性があるため、取得上限未満でも「全検索行の完全取得」を保証するものではありません。

## CTR benchmark / Opportunity Score

CTR改善判定では固定の業界CTR値を使わず、対象サイト自身のGSCデータから順位帯別CTRベンチマークを生成します。

Opportunity Scoreは以下を組み合わせた0〜100のスコアです。

- impressions
- rank band
- own-site CTR gap
- click growth / decline
- position risk

ページ行はPhase 4のURL正規化後データを使うため、fragmentごとにCTR 0%の候補が量産される問題を防ぎます。

## Optional AI improvement brief

`/opportunities` では任意でAI改善ブリーフを生成できます。通常のGSC分析・Opportunity・異常検知にはOpenAI設定は不要です。

Required only for AI:

```env
OPENAI_API_KEY=...
OPENAI_MODEL=gpt-5.6-luna
```

設計方針:

- API keyはサーバー側のみで使用
- Google/GSC認証済みsessionが必要
- clientから自由なpromptは送らず、Opportunity IDだけを受け取りサーバー側で分析データを再構築
- GSC数値・関連クエリ/ページ・URL正規化・データ品質だけを入力
- SERPや対象ページ本文を実際に見たとは回答させない
- URLやクエリ内の文字列を命令として扱わないようprompt injection対策を明示
- 原因は断定せず、データから確定できないものは仮説として提示

## Analysis snapshot history

`/reports` では、実GSC分析完了時に軽量スナップショットをブラウザのlocalStorageへ最大24件保存します。

保存するもの:

- site URL
- generatedAt / range
- KPI
- Opportunity件数
- anomaly件数
- data quality score

保存しないもの:

- OAuth token
- Search Consoleの全query/page行
- Google認証情報

履歴はブラウザローカルのみで、JSONとして書き出し・サイト単位削除ができます。サーバーDBやクロスデバイス同期は勝手に外部providerを選定せず、必要になった時点で別途設計します。

## Google Cloud setup

1. Google Cloud Consoleでプロジェクトを作成
2. **Google Search Console API** を有効化
3. OAuth consent screenを設定
4. OAuth Client IDを **Web application** として作成
5. Authorized redirect URIを登録

Local:

```text
http://localhost:3000/api/auth/google/callback
```

Production:

```text
https://YOUR_DOMAIN/api/auth/google/callback
```

`.env.example` を `.env.local` へコピーして設定してください。

```env
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GSC_SESSION_SECRET=32文字以上の十分に長いランダム値

# optional GSC settings
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
GSC_DATA_STATE=all
GSC_CACHE_TTL_SECONDS=300
GSC_MAX_ROWS=25000

# optional AI
OPENAI_API_KEY=
OPENAI_MODEL=gpt-5.6-luna
```

## OAuth security

- Search Console scopeは `webmasters.readonly` のみ
- `access_type=offline`
- PKCE (`S256`)
- OAuth `state` 検証
- Google tokenはブラウザJavaScriptへ返却しない
- AES-256-GCM encrypted HttpOnly / SameSite=Lax cookie
- access token自動refresh
- refresh失敗時session破棄

## API routes

- `GET /api/auth/google`
- `GET /api/auth/google/callback`
- `GET /api/auth/logout`
- `GET /api/auth/session`
- `GET /api/gsc/properties`
- `GET /api/gsc/analysis`
- `POST /api/gsc/ai-brief` — optional AI brief

## Application routes

- `/dashboard` — KPI / 今日やるSEO / Production Intelligence
- `/queries` — Query analysis + real CSV
- `/queries/[slug]` — Query detail
- `/pages` — normalized page analysis + real CSV
- `/pages/[slug]` — Page detail
- `/opportunities` — Opportunity Score + URL normalization + optional AI brief
- `/anomalies` — Production anomaly detection
- `/growth` — Growth signals
- `/declines` — Decline signals
- `/ctr` — CTR opportunities
- `/cannibalization` — query×normalized-page analysis
- `/reports` — live CSV exports + local snapshot history
- `/settings` — OAuth / thresholds / display
- `/design-system` — live UI catalog

## Architecture

```text
src/
├─ app/
│  ├─ api/
│  │  └─ gsc/
│  │     ├─ analysis/
│  │     └─ ai-brief/
│  └─ (app)/
├─ components/
│  ├─ ui/
│  ├─ analytics/
│  ├─ application/
│  │  ├─ gsc-context.tsx
│  │  ├─ live-workspaces.tsx
│  │  ├─ empty-aware-workspaces.tsx
│  │  ├─ production-workspaces.tsx
│  │  ├─ ai-opportunity-assistant.tsx
│  │  └─ analysis-history.tsx
│  └─ layout/
├─ lib/
│  └─ gsc/
│     ├─ analysis.ts
│     ├─ client.ts
│     ├─ production-intelligence.ts
│     ├─ relations.ts
│     ├─ service.ts
│     ├─ url-normalization.ts
│     └─ types.ts
└─ styles/
   ├─ app.scss
   ├─ phase2.scss
   ├─ phase3.scss
   ├─ phase3-live.scss
   ├─ phase4.scss
   ├─ phase4-ai.scss
   └─ phase4-history.scss
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
3. Google OAuth / GSC API / Analysis Engine ✅
4. Production Intelligence / URL normalization / anomaly detection / quality / exports / optional AI ✅
