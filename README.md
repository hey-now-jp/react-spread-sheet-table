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

このパッケージは GitHub Packages (`https://npm.pkg.github.com`) で配布されています。`@hey-now-jp` スコープを GitHub Packages に向け、認証トークンを環境変数経由で渡す形で利用します。

### 1. プロジェクトの `.npmrc` を設定

利用側リポジトリのルートに `.npmrc` を作り、以下を追加します。トークン本体は書かず、環境変数参照にしてください。

```ini
@hey-now-jp:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${NODE_AUTH_TOKEN}
```

### 2. 認証トークン `NODE_AUTH_TOKEN` を設定

利用シーン別に「どんなトークンを」「どこに」入れるかは以下のとおりです。

#### ローカル開発（各メンバー）

自分の GitHub アカウントで Classic Personal Access Token を発行し、シェルに export します。

1. https://github.com/settings/tokens/new にアクセス（Classic のページ）
2. Note: 例) `@hey-now-jp read:packages`
3. Expiration: 90日 〜 1年など任意
4. Select scopes: **`read:packages`** のみチェック
   - Private パッケージを使うリポジトリからのインストールで 401 が出る場合のみ、`repo` も追加
5. Generate token → 発行された `ghp_...` をコピー
6. `~/.zshrc` / `~/.bashrc` に export を追記

   ```bash
   export NODE_AUTH_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx
   ```

#### CI: GitHub Actions（同じ `hey-now-jp` Organization のリポジトリ）

Secret 登録は不要です。ワークフロー内で自動発行される `secrets.GITHUB_TOKEN` を `NODE_AUTH_TOKEN` に渡すだけで読み取れます。`permissions.packages: read` を付けるのを忘れないでください。

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: read
    steps:
      - uses: actions/checkout@v5
      - uses: pnpm/action-setup@v5
      - uses: actions/setup-node@v6
        with:
          node-version: 22
          cache: pnpm
          registry-url: https://npm.pkg.github.com
          scope: '@hey-now-jp'
      - run: pnpm install --frozen-lockfile
        env:
          NODE_AUTH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

#### CI: 外部サービス (Vercel / Netlify など) または別 Organization

`GITHUB_TOKEN` は使えないため、`read:packages` スコープの Classic PAT を発行して Secrets / 環境変数に登録してください。Organization で machine user アカウントを作り、そのアカウントで発行するのが一般的です。

- GitHub Actions (別 org): Repository or Organization Secret に `PACKAGES_READ_TOKEN` として保存し、`NODE_AUTH_TOKEN: ${{ secrets.PACKAGES_READ_TOKEN }}` として渡す
- Vercel / Netlify: 管理画面の Environment Variables に `NODE_AUTH_TOKEN=ghp_...` を登録

### 3. インストール

```bash
pnpm add @hey-now-jp/react-spread-sheet-table
# or
npm install @hey-now-jp/react-spread-sheet-table
```

### 4. スタイルの読み込み

アプリのエントリポイントで CSS を import してください。テーマ変数を含むグローバルな CSS です。

```ts
import '@hey-now-jp/react-spread-sheet-table/styles.css'
```

読み込み箇所の例:

| フレームワーク | ファイル |
|----------------|----------|
| Next.js (Pages Router) | `src/pages/_app.tsx` |
| Next.js (App Router) | `src/app/layout.tsx` |
| Vite / CRA | `src/main.tsx` など |

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
