# @hey-now-jp/react-spread-sheet-table

React 向けのスプレッドシート風テーブルコンポーネントライブラリ。

## インストール

このパッケージは GitHub Packages (`https://npm.pkg.github.com`) で配布されています。`@hey-now-jp` スコープを GitHub Packages に向け、認証トークンを環境変数経由で渡す形で利用します。

### 1. プロジェクトの `.npmrc` を設定

利用側リポジトリの **ルートに `.npmrc`** を作り、以下を追加します。トークン本体は書かず、環境変数参照にしてください。

```ini
@hey-now-jp:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${NODE_AUTH_TOKEN}
```

### 2. 認証トークン `NODE_AUTH_TOKEN` を設定

利用シーン別に「どんなトークンを」「どこに」入れるかは以下のとおりです。

#### ローカル開発（各メンバー）

自分の GitHub アカウントで **Classic Personal Access Token** を発行し、シェルに export します。

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

**Secret 登録は不要**です。ワークフロー内で自動発行される `secrets.GITHUB_TOKEN` を `NODE_AUTH_TOKEN` に渡すだけで読み取れます。`permissions.packages: read` を付けるのを忘れないでください。

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
          node-version: 20
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

## 基本的な使い方

```tsx
import {
  SpreadSheetTable,
  useSpreadSheetTable,
  type ColumnDef,
} from '@hey-now-jp/react-spread-sheet-table'

type Employee = {
  id: string
  name: string
  age: number
  joinDate: string
  active: boolean
  department: string
}

const columns: ColumnDef<Employee>[] = [
  { type: 'text', key: 'name', header: '名前', width: 200, required: true },
  { type: 'number', key: 'age', header: '年齢', width: 100, min: 0, max: 150 },
  { type: 'date', key: 'joinDate', header: '入社日', width: 150, minDate: '2000-01-01' },
  { type: 'boolean', key: 'active', header: '有効', width: 80 },
  { type: 'list', key: 'department', header: '部署', width: 150, options: ['営業', '開発', '人事'] },
]

function App() {
  const table = useSpreadSheetTable({
    columns,
    initialData,
    rowKey: 'id',
    onChange: (changedRows) => console.log(changedRows),
  })

  return (
    <div>
      <SpreadSheetTable table={table} height={500} />
      <button onClick={() => table.markAsSaved()} disabled={!table.isDirty}>
        保存
      </button>
    </div>
  )
}
```

## カラム型

### データカラム

| 型 | 説明 | 主なオプション |
|----|------|---------------|
| `text` | テキスト入力 | `maxLength`, `pattern` |
| `number` | 数値入力 | `min`, `max`, `step`, `precision` |
| `date` | 日付選択 | `minDate`, `maxDate` |
| `time` | 時刻入力 | `minTime`, `maxTime`, `step` |
| `boolean` | チェックボックス | - |
| `list` | ドロップダウン | `options` |

全データカラム共通: `key`, `header`, `width`, `readOnly`, `required`, `hidden`

### アクションカラム

行ごとにカスタム UI を配置するためのカラム。

```tsx
const columns: ColumnDef<Row>[] = [
  // ...data columns
  {
    type: 'action',
    key: 'actions',
    header: '',
    width: 100,
    render: (row, rowIndex) => <button onClick={() => deleteRow(row.id)}>削除</button>,
  },
]
```

## useSpreadSheetTable

テーブルの状態管理を行うフック。

```tsx
const table = useSpreadSheetTable<T>({
  // 必須
  columns: ColumnDef<T>[],
  initialData: T[],
  rowKey: keyof T,

  // コールバック（任意）
  onChange?: (changedRows: ChangeInfo<T>[]) => void,
  onSort?: (sortState: SortState<T>) => void,
  onFilter?: (filterState: FilterState<T>) => void,
  onValidationError?: (errors: CellValidationError[]) => void,

  // カスタムバリデーション（任意）
  validate?: (value: unknown, row: T, columnKey: keyof T) => ValidationResult | null,
})
```

### 戻り値: TableInstance

```tsx
// データ
table.isDirty                           // 変更があるか
table.getData()                         // 現在のデータ
table.getChangedRows()                  // 変更された行の詳細
table.markAsSaved()                     // dirty フラグをクリア
table.resetToInitial()                  // 初期データに戻す

// 選択
table.selection                         // 現在の選択状態
table.select({ start, end })            // セル範囲を選択
table.clearSelection()                  // 選択解除

// ソート
table.sortState                         // 現在のソート状態
table.sort('age', 'asc')               // ソート適用
table.clearSort()                       // ソート解除

// フィルター
table.filterState                       // 現在のフィルター状態
table.filter('name', { type: 'contains', value: '太' })
table.clearFilter('name')               // 特定カラムのフィルター解除
table.clearFilter()                     // 全フィルター解除

// バリデーション
table.getValidationErrors()             // エラー一覧
table.isValid()                         // error レベルのエラーがないか
```

## SpreadSheetTable

テーブル描画コンポーネント。

```tsx
<SpreadSheetTable
  table={table}       // useSpreadSheetTable の戻り値（必須）
  height={500}         // テーブル高さ px（デフォルト: 400）
  readOnly={false}     // 読み取り専用（デフォルト: false）
/>
```

## バリデーション

### 組み込みバリデーション

カラム定義の `required`, `min`, `max`, `maxLength`, `pattern`, `minDate`, `maxDate` 等が自動適用される。

### カスタムバリデーション

```tsx
const table = useSpreadSheetTable({
  columns,
  initialData,
  rowKey: 'id',
  validate: (value, row, columnKey) => {
    if (columnKey === 'score' && typeof value === 'number' && value > 80) {
      return { level: 'warn', message: '高スコアです - 再確認してください' }
    }
    return null
  },
})
```

## フィルター

```tsx
// 完全一致
table.filter('status', { type: 'eq', value: 'active' })

// 部分一致（大文字小文字無視）
table.filter('name', { type: 'contains', value: '太' })

// 範囲
table.filter('age', { type: 'range', min: 20, max: 40 })

// 複数値
table.filter('department', { type: 'in', values: ['営業', '開発'] })
```

## キーボード操作

| キー | 動作 |
|------|------|
| 矢印キー | セル移動 |
| Tab / Shift+Tab | 次 / 前のセルへ移動 |
| Enter | 編集開始 / 確定 |
| Escape | 編集キャンセル |
| Ctrl+C / Cmd+C | セルコピー |
| Ctrl+V / Cmd+V | ペースト |
| Ctrl+A / Cmd+A | 全選択 |
| 文字入力 | 直接編集開始 |

## テーマカスタマイズ

CSS カスタムプロパティでスタイルを上書きできる。

```css
:root {
  --sst-font-family: 'Noto Sans JP', sans-serif;
  --sst-font-size: 13px;
  --sst-cell-height: 36px;
  --sst-cell-padding: 4px 12px;

  --sst-border-color: #d0d0d0;
  --sst-header-bg: #f0f0f0;
  --sst-header-color: #222;
  --sst-row-bg: #fff;
  --sst-row-alt-bg: #f8f8f8;

  --sst-selected-bg: rgba(33, 150, 243, 0.15);
  --sst-selected-border: #2196f3;
  --sst-selection-range-border: rgba(33, 150, 243, 0.6);

  --sst-error-bg: #fff0f0;
  --sst-error-border: #e53935;
  --sst-warn-bg: #fffbe6;
  --sst-warn-border: #f9a825;
}
```

## ライセンス

MIT
