## ADDED Requirements

### Requirement: Column Sort

データ列のヘッダークリックでソートを切り替えられなければならない（MUST）。

#### Scenario: Click header to sort ascending
- **WHEN** ソートされていない列のヘッダーをクリックする
- **THEN** その列で昇順ソートされる
- **AND** ヘッダーにソート方向のインジケーターが表示される

#### Scenario: Click again to sort descending
- **WHEN** 昇順ソート中の列のヘッダーをクリックする
- **THEN** 降順ソートに切り替わる

#### Scenario: Click again to clear sort
- **WHEN** 降順ソート中の列のヘッダーをクリックする
- **THEN** ソートが解除される

#### Scenario: Action column header is not sortable
- **WHEN** アクション列のヘッダーをクリックする
- **THEN** ソートは発生しない

### Requirement: Sort Configuration

テーブルレベルでソートの有効/無効を制御できなければならない（MUST）。

- `sortable: boolean` でテーブル全体のソート可否を設定
- 列定義で `sortable: false` を指定して個別に無効化可能

#### Scenario: Disable sorting globally
- **WHEN** `sortable: false` をフックに渡す
- **THEN** 全列のヘッダークリックでソートが発生しない

### Requirement: Sort API

プログラムからソートを制御できるAPIを提供しなければならない（MUST）。

- `table.sort(key, direction)`: 指定列でソート
- `table.clearSort()`: ソートを解除
- `table.sortState`: 現在のソート状態

#### Scenario: Programmatic sort
- **WHEN** `table.sort('age', 'asc')` を呼び出す
- **THEN** age列で昇順ソートされる

### Requirement: Sort Callback

外部ソート（サーバーサイド等）に対応するため `onSort` コールバックを提供しなければならない（MUST）。

#### Scenario: Server-side sort
- **WHEN** `onSort` コールバックが設定されている
- **THEN** 内部ソートは行わず、コールバックにソート状態を渡す
- **AND** 利用側が新しいデータを `initialData` として再設定する
