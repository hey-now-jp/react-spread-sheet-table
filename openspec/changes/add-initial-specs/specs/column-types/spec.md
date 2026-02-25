## ADDED Requirements

### Requirement: Column Definition Type System

ColumnDef<T> は DataColumnDef<T> と ActionColumnDef<T> の Union 型として定義されなければならない（MUST）。

#### Scenario: Data column restricts key to keyof T
- **WHEN** DataColumnDef<T> を定義する
- **THEN** `key` プロパティは `keyof T` に制約される
- **AND** T に存在しないキーを指定した場合はコンパイルエラーとなる

#### Scenario: Type-specific properties via Discriminated Union
- **WHEN** `type: 'number'` を指定する
- **THEN** `min`, `max`, `step`, `precision` プロパティが利用可能になる
- **AND** `type: 'text'` では `min`, `max` はコンパイルエラーとなる

### Requirement: Data Column Types

DataColumnDef は以下の型を Discriminated Union としてサポートしなければならない（MUST）。

- `text`: 文字列入力。`maxLength`, `pattern` をオプションで指定可能。
- `number`: 数値入力。`min`, `max`, `step`, `precision` をオプションで指定可能。
- `date`: 日付入力。`minDate`, `maxDate` をオプションで指定可能。
- `time`: 時刻入力。`minTime`, `maxTime`, `step` をオプションで指定可能。
- `boolean`: 真偽値。チェックボックスとして表示。
- `list`: リスト選択。`options` を必須で指定。

#### Scenario: Text column definition
- **WHEN** `{ key: 'name', type: 'text', maxLength: 100 }` と定義する
- **THEN** 有効な TextColumnDef として型チェックを通過する

#### Scenario: Number column definition
- **WHEN** `{ key: 'age', type: 'number', min: 0, max: 150 }` と定義する
- **THEN** 有効な NumberColumnDef として型チェックを通過する

#### Scenario: List column requires options
- **WHEN** `type: 'list'` を指定する
- **THEN** `options` プロパティが必須となる
- **AND** `options` を省略した場合はコンパイルエラーとなる

### Requirement: Action Column

ActionColumnDef<T> はカスタムレンダリング列として定義されなければならない（MUST）。

- `type` は `'action'` 固定
- `key` は任意の `string`（`keyof T` の制約なし）
- `render: (row: T, rowIndex: number) => React.ReactNode` を必須とする
- `pin?: 'left' | 'right'` で列の固定位置を指定可能
- ソート、フィルタ、コピペ、範囲選択の対象外とする

#### Scenario: Action column with delete button
- **WHEN** `{ type: 'action', key: 'actions', render: (row) => <button>削除</button> }` と定義する
- **THEN** 有効な ActionColumnDef として型チェックを通過する
- **AND** ソート・フィルタの対象に含まれない

#### Scenario: Action column pinned to right
- **WHEN** `pin: 'right'` を指定する
- **THEN** 列はテーブルの右端に固定表示される

### Requirement: Column Type Guard

`isDataColumn<T>(col: ColumnDef<T>): col is DataColumnDef<T>` 型ガード関数を提供しなければならない（MUST）。

#### Scenario: Type guard narrows to DataColumnDef
- **WHEN** `isDataColumn(column)` が `true` を返す
- **THEN** TypeScript はそのブロック内で column を DataColumnDef<T> として推論する

### Requirement: Common Column Properties

全ての列定義は以下の共通プロパティを持たなければならない（MUST）。

- `key`: 列の識別子（DataColumnDef では `keyof T`、ActionColumnDef では `string`）
- `header`: 列ヘッダーのラベル（ActionColumnDef では省略可能）
- `width?`: 列幅（ピクセル）
- `readOnly?`: 編集不可（DataColumnDef のみ）

#### Scenario: Column with width specified
- **WHEN** `width: 200` を指定する
- **THEN** 列は200pxの幅で表示される
