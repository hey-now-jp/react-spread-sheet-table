# @hey-now-jp/react-spread-sheet-table

React 向けのスプレッドシート風テーブルコンポーネントライブラリ。

## インストール

このパッケージは GitHub Packages で公開されています。インストールするには、まずプロジェクトの `.npmrc` にレジストリを設定してください。

```ini
# .npmrc
@hey-now-jp:registry=https://npm.pkg.github.com
```

GitHub の Personal Access Token (`read:packages` 権限) を `~/.npmrc` に設定する必要があります。

```ini
# ~/.npmrc (グローバル設定)
//npm.pkg.github.com/:_authToken=ghp_xxxxxxxxxxxx
```

その後、パッケージをインストールします。

```bash
npm install @hey-now-jp/react-spread-sheet-table
# or
pnpm add @hey-now-jp/react-spread-sheet-table
```

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
