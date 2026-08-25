# GSC Analyzer

Google Search Console のデータを「見る」だけではなく、次に実行すべきSEO改善へ変換するための分析アプリです。

## Current phase

**Phase 2 — Application UI / Dummy Data / UX**

Phase 1 で作成した Design Token → UI Primitive → Analytics Component → Page の設計を維持したまま、主要画面をダミーデータで実用レベルまで実装しています。

## Stack

- Next.js 15 / App Router
- React 19
- TypeScript
- SCSS
- Noto Sans JP only
- lucide-react
- GitHub Actions CI

## Routes

- `/dashboard` — 全体KPI・今日やるSEO・デバイス・順位分布
- `/queries` — クエリ分析 / 検索・優先度フィルター・ソート・選択
- `/queries/[id]` — クエリ詳細
- `/pages` — ページ分析
- `/pages/[id]` — ページ詳細
- `/opportunities` — Opportunity Scoreによる改善機会
- `/growth` — 急上昇
- `/declines` — 急落
- `/ctr` — CTR改善候補
- `/cannibalization` — カニバリ分析
- `/reports` — レポート履歴・生成モーダル
- `/settings` — プロパティ・分析条件・通知・表示設定
- `/design-system` — Phase 1から継続するlive UI catalog

## Architecture

```text
src/
├─ app/
│  └─ (app)/
├─ components/
│  ├─ ui/             # 汎用UI primitive
│  ├─ analytics/      # GSC向けの基礎分析部品
│  ├─ application/    # Phase 2の複合・操作系コンポーネント
│  └─ layout/
├─ lib/
│  ├─ mock-data.ts
│  └─ application-data.ts
└─ styles/
   ├─ _tokens.scss
   ├─ globals.scss
   └─ phase2.scss
```

## Responsive policy

PCは固定サイドバー + 高密度テーブル + 複数カラムで情報量を最大化します。SPでは単純縮小せず、下部ナビ、カード再配置、横スクロール可能なデータテーブル、操作領域の再配置を使って情報を落とさず閲覧できる構成にしています。

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
2. Application UI / Dummy Data / UX ← current
3. Google OAuth / GSC API / Analysis Engine
4. Production intelligence / anomaly detection / AI assistance
