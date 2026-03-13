# @hey-now-jp/react-spread-sheet-table

React 向けのスプレッドシート風テーブルコンポーネントライブラリ。

[Playground デモ](https://hey-now-jp.github.io/react-spread-sheet-table/)

## 特徴

- 6 種類のカラム型（テキスト・数値・日付・時刻・真偽値・リスト）+ カスタムアクションカラム
- インライン編集、キーボードナビゲーション（矢印キー・Tab・Enter・Escape）
- セル範囲選択、クリップボード操作（Ctrl+C / Ctrl+V）
- ソート・フィルター（eq / contains / range / in）
- 組み込みバリデーション + カスタムバリデーション
- 仮想スクロール（10,000 行以上対応）
- CSS カスタムプロパティによるテーマカスタマイズ
- React 18 / 19 対応

## セットアップ

```bash
pnpm install
```

## 開発

```bash
# Playground 起動（http://localhost:5173）
pnpm dev

# ライブラリビルド
pnpm build

# ユニットテスト
pnpm test

# E2E テスト
pnpm test:e2e

# Lint & Format
pnpm lint
pnpm format
```

## プロジェクト構成

```
packages/
  core/           @hey-now-jp/react-spread-sheet-table 本体
apps/
  playground/     デモアプリケーション（GitHub Pages で公開）
```

## インストール

GitHub Packages で公開されています。プロジェクトの `.npmrc` にレジストリを設定してください。

```ini
# .npmrc
@hey-now-jp:registry=https://npm.pkg.github.com
```

GitHub の Personal Access Token (`read:packages` 権限) を `~/.npmrc` に設定する必要があります。

```ini
# ~/.npmrc (グローバル設定)
//npm.pkg.github.com/:_authToken=ghp_xxxxxxxxxxxx
```

```bash
pnpm add @hey-now-jp/react-spread-sheet-table
```

## クイックスタート

```tsx
import {
  SpreadSheetTable,
  useSpreadSheetTable,
  type ColumnDef,
} from '@hey-now-jp/react-spread-sheet-table'

type Row = { id: string; name: string; age: number }

const columns: ColumnDef<Row>[] = [
  { type: 'text', key: 'name', header: '名前', width: 200 },
  { type: 'number', key: 'age', header: '年齢', width: 100, min: 0, max: 150 },
]

function App() {
  const table = useSpreadSheetTable({
    columns,
    initialData: [{ id: '1', name: '太郎', age: 30 }],
    rowKey: 'id',
  })

  return <SpreadSheetTable table={table} height={400} />
}
```

## 技術スタック

| ツール | 用途 |
|--------|------|
| React 18+ | UI |
| TypeScript 5.7+ | 型安全 |
| Vite 6 | ビルド |
| Vitest | ユニットテスト |
| Playwright | E2E テスト |
| Biome | Lint / Format |
| pnpm | パッケージ管理 |

## ライセンス

MIT
