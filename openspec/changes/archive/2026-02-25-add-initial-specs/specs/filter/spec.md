## ADDED Requirements

### Requirement: Column Filter

データ列にフィルタ機能を提供しなければならない（MUST）。

#### Scenario: Text column filter
- **WHEN** text型列のフィルタに文字列を入力する
- **THEN** その文字列を含む行のみが表示される

#### Scenario: Number column filter
- **WHEN** number型列のフィルタに範囲を指定する
- **THEN** 指定範囲内の値を持つ行のみが表示される

#### Scenario: List column filter
- **WHEN** list型列のフィルタで選択肢を選ぶ
- **THEN** 選択した値を持つ行のみが表示される

#### Scenario: Boolean column filter
- **WHEN** boolean型列のフィルタでtrue/falseを選ぶ
- **THEN** 一致する行のみが表示される

#### Scenario: Action column has no filter
- **WHEN** アクション列が定義されている
- **THEN** フィルタUIは表示されない

### Requirement: Filter Configuration

テーブルレベルでフィルタの有効/無効を制御できなければならない（MUST）。

- `filterable: boolean` でテーブル全体のフィルタ可否を設定
- 列定義で `filterable: false` を指定して個別に無効化可能

#### Scenario: Disable filtering globally
- **WHEN** `filterable: false` をフックに渡す
- **THEN** フィルタUIが全列で非表示になる

### Requirement: Filter API

プログラムからフィルタを制御できるAPIを提供しなければならない（MUST）。

- `table.filter(key, condition)`: 指定列にフィルタを適用
- `table.clearFilter(key?)`: フィルタを解除（key省略で全解除）
- `table.filterState`: 現在のフィルタ状態

#### Scenario: Programmatic filter
- **WHEN** `table.filter('department', { eq: '開発' })` を呼び出す
- **THEN** department列が '開発' の行のみが表示される

#### Scenario: Clear specific filter
- **WHEN** `table.clearFilter('department')` を呼び出す
- **THEN** department列のフィルタのみが解除される

### Requirement: Filter Callback

外部フィルタ（サーバーサイド等）に対応するため `onFilter` コールバックを提供しなければならない（MUST）。

#### Scenario: Server-side filter
- **WHEN** `onFilter` コールバックが設定されている
- **THEN** 内部フィルタは行わず、コールバックにフィルタ状態を渡す
