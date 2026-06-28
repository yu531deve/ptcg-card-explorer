# @ptcgabc/design-system

PTCG ABC ビューアから切り出した、**再利用可能なUIプリミティブ＋デザイントークン**のパッケージです。新しいアプリを同じ見た目で素早く立ち上げるための土台で、`claude.ai/design`（Claude Design）への `design-sync` 取り込みを想定しています。

> このパッケージは**独立**しており、元のビューアアプリのコードには依存しません（アプリ側も変更していません）。

## スタイルの考え方

- **トークン駆動のクラスベース**です。すべての色・余白・角丸・影は `tokens.css` の CSS 変数（`--ds-*`）で定義され、各コンポーネントのクラス（`ds-btn` など）がそれを参照します。
- アプリ側では **`@ptcgabc/design-system/styles.css` を一度読み込むだけ**でトークンとコンポーネントスタイルが効きます。
- 独自レイアウトを書くときも `var(--ds-accent)` / `var(--ds-space-3)` などのトークンを使えば統一感が保てます。

## 使い方

```tsx
import '@ptcgabc/design-system/styles.css';
import { Button, Card, Chip, SegmentedControl, Field, Badge, Panel } from '@ptcgabc/design-system';

function Example() {
  return (
    <Panel title="フィルター" actions={<Button variant="subtle" size="sm">クリア</Button>}>
      <Field label="検索">
        <input type="search" placeholder="キーワード" />
      </Field>
      <div style={{ display: 'flex', gap: 'var(--ds-space-2)', marginTop: 'var(--ds-space-3)' }}>
        <Chip active count={12}>特性あり</Chip>
        <Chip count={8}>ex</Chip>
      </div>
    </Panel>
  );
}
```

## コンポーネント

| コンポーネント | 役割 | 主なprops |
| --- | --- | --- |
| `Button` | アクション | `variant`(primary/ghost/subtle), `size`(sm/md) |
| `Card` | 内容のまとまり | `interactive`, `padded` |
| `Panel` | 見出し付きコンテナ | `title`, `actions` |
| `Chip` | フィルター用トグル | `active`, `count` |
| `Badge` | ラベル/ステータス | `tone`(neutral/accent/warn/success) |
| `SegmentedControl` | 排他選択タブ | `options`, `value`, `onChange` |
| `Field` | ラベル付き入力ラッパ | `label`, `hint` |

## トークン（抜粋）

- 色: `--ds-surface` / `--ds-border` / `--ds-text` / `--ds-muted` / `--ds-accent` / `--ds-accent-soft`
- 余白: `--ds-space-1`〜`--ds-space-5`
- 角丸: `--ds-radius` / `--ds-radius-sm` / `--ds-radius-pill`
- 影: `--ds-shadow-sm` / `--ds-shadow` / `--ds-shadow-lg`
- フォーカス: `--ds-ring`

## ビルド・確認

```bash
# このディレクトリで
node build.mjs        # dist/（index.js + 型 + CSS）を生成
```

`preview.html` をブラウザで開くと、各コンポーネントの見た目を確認できます（`dist/styles.css` を読み込む静的プレビュー）。
