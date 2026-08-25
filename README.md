# GSC Analyzer

Google Search Console のデータを「見る」だけでなく、**次に何を改善すべきか判断するための分析ツール**です。

## Phase 1

Phase 1 では、添付の青ベース UI キットを実際に使える Web デザインシステムへ変換しています。

- Next.js / TypeScript / SCSS
- Noto Sans JP のみ使用
- 小さめの文字サイズと高い情報密度
- PC: 固定サイドバー + 高密度ダッシュボード
- SP: 下部ナビ + カード再配置 + データテーブル横スクロール
- Design Tokens
- Button / Badge / Chip / Form / Tabs / Alert / Skeleton / Empty State / Pagination
- KPI / Trend / Insight / Chart / Query Table
- `/design-system` に live UI catalog
- `/dashboard` に Phase 1 モックダッシュボード
- Phase 2 用の分析ルート骨格

## Setup

```bash
npm install
npm run dev
```

Open:

```text
http://localhost:3000/dashboard
http://localhost:3000/design-system
```

## Structure

```text
src/
├─ app/
│  ├─ (app)/
│  │  ├─ dashboard/
│  │  ├─ design-system/
│  │  └─ [section]/
│  ├─ layout.tsx
│  └─ page.tsx
├─ components/
│  ├─ analytics/
│  ├─ layout/
│  └─ ui/
├─ lib/
│  └─ mock-data.ts
└─ styles/
   ├─ _tokens.scss
   ├─ _mixins.scss
   └─ globals.scss
```

## Development policy

- 画面固有の色・余白・角丸を増やさず、Design Tokens を優先する
- 共通操作は `components/ui` に閉じ込める
- GSC 固有の表現は `components/analytics` に閉じ込める
- PC/SP で DOM を安易に二重化しない
- データ列は SP で削除せず、必要に応じて横スクロールで情報量を維持する
- Phase 2 以降も `/design-system` を UI の基準として維持する

## Roadmap

1. Phase 1: Foundation / Design System / App Shell
2. Phase 2: Full application UI with mock data
3. Phase 3: Google OAuth / Search Console API / Analysis Engine
4. Phase 4: Recommendation engine / anomaly detection / production hardening
