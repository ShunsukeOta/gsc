import { Download, Filter, Plus, Save, Trash2 } from 'lucide-react';
import { InsightCard, MetricGrid, QueryTable } from '@/components/analytics';
import {
  Alert,
  Badge,
  Button,
  Card,
  CardHeader,
  Checkbox,
  Chip,
  EmptyState,
  IconButton,
  InputField,
  PageHead,
  Radio,
  SelectField,
  Skeleton,
  Switch,
  Tabs,
  TextareaField,
} from '@/components/ui';
import { metrics, queryRows } from '@/lib/mock-data';

const swatches = [
  ['Primary 700', '#0B3F86'], ['Primary 600', '#0A55B7'], ['Primary 500', '#116BD8'], ['Primary 400', '#4B8EE8'],
  ['Primary 200', '#C7DDF7'], ['Primary 50', '#F3F8FE'], ['Neutral 950', '#14213A'], ['Neutral 700', '#4D5D75'],
  ['Neutral 300', '#CDD4DF'], ['Neutral 100', '#F2F5F8'], ['Success', '#087443'], ['Danger', '#C53232'],
];

const sampleInsight = {
  title: '11〜20位でチャンス',
  value: '42件',
  meta: '表示回数 84,210',
  action: 'タイトル・内部リンク改善',
  tone: 'warning' as const,
};

export default function DesignSystemPage() {
  return (
    <>
      <PageHead
        eyebrow="Foundation / UI Kit"
        title="Search Console分析ツール UIシステム"
        description="添付デザインをコード上の共通ルールへ変換した、生きたデザインシステムです。小さめのタイポグラフィ、高い情報密度、青ベース、PC/SP双方の操作性を共通コンポーネントで担保します。"
        actions={<Button variant="secondary" icon={<Download />}>仕様を書き出す</Button>}
      />

      <div className="ds-hero">
        <Card>
          <CardHeader title="1. カラーパレット" description="用途ベースのトークンとして管理" />
          <div className="ds-swatch-grid">
            {swatches.map(([name, hex]) => (
              <div className="ds-swatch" key={name}>
                <div className="ds-swatch__color" style={{ background: hex }} />
                <div className="ds-swatch__meta">
                  <div className="ds-swatch__name">{name}</div>
                  <div className="ds-swatch__hex">{hex}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader title="2. タイポグラフィ" description="Noto Sans JP / compact density" />
          <div className="ds-type-list">
            <div className="ds-type-row"><span className="ds-type-label">H1 / 22px</span><span className="ds-type-h1">分析概要</span></div>
            <div className="ds-type-row"><span className="ds-type-label">H2 / 17px</span><span className="ds-type-h2">サイトパフォーマンス</span></div>
            <div className="ds-type-row"><span className="ds-type-label">H3 / 13px</span><span className="ds-type-h3">クエリの検索推移</span></div>
            <div className="ds-type-row"><span className="ds-type-label">Body / 10px</span><span className="ds-type-body">情報量を確保しながら視線移動を抑えます。</span></div>
            <div className="ds-type-row"><span className="ds-type-label">Caption / 8px</span><span className="ds-type-caption">データは過去28日間を基準に表示</span></div>
            <div className="ds-type-row"><span className="ds-type-label">KPI / 23px</span><span className="ds-type-kpi">24,531</span></div>
          </div>
        </Card>
      </div>

      <section className="ds-section">
        <div className="ds-section__head"><h2 className="ds-section__title">3. ボタン・アクション</h2><span className="ds-section__description">variant / size / disabled を統一APIで制御</span></div>
        <div className="ds-grid ds-grid--2">
          <Card>
            <CardHeader title="Button variants" description="通常アクション" />
            <div className="ds-stack">
              <div className="ds-row">
                <Button icon={<Plus />}>分析開始</Button>
                <Button variant="secondary" icon={<Download />}>CSV出力</Button>
                <Button variant="ghost" icon={<Save />}>保存</Button>
                <Button variant="danger" icon={<Trash2 />}>削除</Button>
              </div>
              <div className="ds-row">
                <Button size="sm">Small</Button><Button>Medium</Button><Button size="lg">Large</Button><Button disabled>Disabled</Button>
              </div>
            </div>
          </Card>
          <Card>
            <CardHeader title="Icon / Status actions" description="狭い領域でも操作を維持" />
            <div className="ds-row">
              <IconButton label="ダウンロード"><Download size={14} /></IconButton>
              <IconButton label="フィルター"><Filter size={14} /></IconButton>
              <Badge tone="success">成功</Badge>
              <Badge tone="warning">警告</Badge>
              <Badge tone="danger">エラー</Badge>
              <Badge tone="info">情報</Badge>
            </div>
          </Card>
        </div>
      </section>

      <section className="ds-section">
        <div className="ds-section__head"><h2 className="ds-section__title">4. フォームパーツ</h2><span className="ds-section__description">34px高を基本に、密度とタップ性を両立</span></div>
        <div className="ds-grid ds-grid--2">
          <Card>
            <CardHeader title="Input / Select" description="検索・URL・期間・デバイス" />
            <div className="ui-form-grid">
              <InputField label="検索" icon placeholder="キーワードを検索..." />
              <InputField label="URL" defaultValue="https://example.com/" />
              <SelectField label="デバイス" defaultValue="mobile"><option value="all">すべて</option><option value="mobile">モバイル</option><option value="desktop">デスクトップ</option></SelectField>
              <SelectField label="日付範囲" defaultValue="28"><option value="28">過去28日</option><option value="90">過去3か月</option></SelectField>
            </div>
            <div style={{ marginTop: 10 }}><TextareaField label="分析メモ" placeholder="改善仮説や確認事項を入力..." /></div>
          </Card>
          <Card>
            <CardHeader title="Selection controls" description="Filter UIの基礎部品" />
            <div className="ds-stack">
              <div className="ui-control-row"><Checkbox label="すべて選択" /><Checkbox label="モバイル" defaultChecked /><Checkbox label="デスクトップ" defaultChecked /></div>
              <div className="ui-control-row"><Radio name="device" label="すべて" /><Radio name="device" label="モバイル" defaultChecked /><Radio name="device" label="デスクトップ" /></div>
              <div className="ui-control-row"><Switch label="比較表示" initial /><Switch label="ブランド除外" /></div>
              <Tabs items={['概要', 'クエリ', 'ページ', 'デバイス', '国', '比較']} />
              <div className="ds-row"><Chip removable>モバイル</Chip><Chip removable>日本</Chip><Chip removable>過去28日</Chip><Chip removable>ブランド除外</Chip></div>
            </div>
          </Card>
        </div>
      </section>

      <section className="ds-section">
        <div className="ds-section__head"><h2 className="ds-section__title">5. KPI・分析カード</h2><span className="ds-section__description">データの意味を部品側に閉じ込める</span></div>
        <MetricGrid metrics={metrics} />
        <div className="ds-grid" style={{ marginTop: 9 }}>
          <InsightCard {...sampleInsight} />
          <InsightCard title="急上昇クエリ" value="18件" meta="最大 +124%" action="関連見出しを追加" tone="success" />
          <InsightCard title="急落ページ" value="7件" meta="最大 -45%" action="順位下落要因を確認" tone="danger" />
        </div>
      </section>

      <section className="ds-section">
        <div className="ds-section__head"><h2 className="ds-section__title">6. テーブル・高密度データ表示</h2><span className="ds-section__description">SPは横スクロールし、列情報を安易に捨てない</span></div>
        <QueryTable rows={queryRows} />
      </section>

      <section className="ds-section">
        <div className="ds-section__head"><h2 className="ds-section__title">7. 状態・フィードバック</h2><span className="ds-section__description">Loading / Empty / Success / Warning / Error</span></div>
        <div className="ds-status-grid">
          <Card><CardHeader title="Loading" /><div className="ds-stack"><Skeleton height={14} /><Skeleton width="82%" height={10} /><Skeleton width="58%" height={10} /><Skeleton height={54} /></div></Card>
          <Card padded={false}><EmptyState action={<Button size="sm" variant="secondary">条件をリセット</Button>} /></Card>
          <Card><CardHeader title="Feedback" /><div className="ds-stack"><Alert tone="success">レポートを正常に生成しました。</Alert><Alert tone="warning">一部データが欠落しています。</Alert></div></Card>
          <Card><CardHeader title="Error / Info" /><div className="ds-stack"><Alert tone="danger">データ取得に失敗しました。</Alert><Alert tone="info">現在はPhase 1のダミーデータです。</Alert></div></Card>
        </div>
      </section>

      <section className="ds-section">
        <div className="ds-section__head"><h2 className="ds-section__title">8. モーダル・ドロワー骨格</h2><span className="ds-section__description">Phase 2で実動作を接続するための表現基準</span></div>
        <Card>
          <div className="ui-overlay-demo">
            <div className="ui-modal-preview">
              <div className="ui-modal-preview__panel">
                <div className="ui-preview-title">レポート生成</div>
                <div className="ui-preview-text">期間と含めるデータを指定してレポートを作成します。</div>
                <SelectField label="期間" defaultValue="28"><option value="28">過去28日</option></SelectField>
                <div className="ds-row" style={{ marginTop: 10 }}><Button size="sm" variant="ghost">キャンセル</Button><Button size="sm">生成する</Button></div>
              </div>
            </div>
            <div className="ui-drawer-preview">
              <div className="ui-drawer-preview__panel">
                <div className="ui-preview-title">比較条件を追加</div>
                <div className="ui-preview-text">ページを離れずに分析条件を変更します。</div>
                <SelectField label="比較対象" defaultValue="device"><option value="device">デバイス</option></SelectField>
                <div style={{ marginTop: 10 }}><Button size="sm" style={{ width: '100%' }}>追加</Button></div>
              </div>
            </div>
          </div>
        </Card>
      </section>
    </>
  );
}
