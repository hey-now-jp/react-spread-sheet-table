## Purpose

useSpreadSheetTableフックと非制御パターンによるパブリックAPIを提供する。テーブル状態管理、変更追跡、ダーティ管理を一つのフックに集約する。
useSpreadSheetTableフックと非制御パターンのパブリックAPI
## Requirements
### Requirement: useSpreadSheetTable Hook

テーブル状態管理のパブリックAPIとして `useSpreadSheetTable<T>` フックを提供しなければならない（MUST）。
パブリックAPIはこのフック一つに集約する。

#### Scenario: Basic initialization
- **WHEN** `useSpreadSheetTable({ columns, initialData, rowKey: 'id' })` を呼び出す
- **THEN** `table` オブジェクトが返される
- **AND** テーブルは `initialData` で初期化される

### Requirement: Uncontrolled State Management

テーブルは非制御パターンで状態を管理しなければならない（MUST）。

- `initialData` で初期データを受け取り、内部で状態を管理する
- セル編集のたびに親コンポーネントが再レンダリングされない
- 親はイベント通知を受けるが、状態の所有権はテーブル側にある

#### Scenario: Cell edit does not trigger parent re-render
- **WHEN** ユーザーがセルを編集する
- **THEN** テーブル内部の状態が更新される
- **AND** `useSpreadSheetTable` を呼び出しているコンポーネントは再レンダリングされない

### Requirement: onChange Callback

変更が発生した際、`onChange` コールバックで変更行の情報を通知しなければならない（MUST）。

```typescript
type ChangeInfo<T> = {
  row: T
  rowIndex: number
  changes: ReadonlyArray<{
    key: keyof T
    previousValue: T[keyof T]
    newValue: T[keyof T]
  }>
}
```

#### Scenario: Single cell edit notification
- **WHEN** ユーザーが1つのセルを編集する
- **THEN** `onChange` に長さ1の `ChangeInfo[]` が渡される
- **AND** `changes` に変更前後の値が含まれる

#### Scenario: Bulk paste notification
- **WHEN** ユーザーが3行分のデータをペーストする
- **THEN** `onChange` に長さ3の `ChangeInfo[]` が渡される

### Requirement: Dirty State Management

テーブルはダーティ状態（未保存の変更があるかどうか）を管理しなければならない（MUST）。

- `table.isDirty`: 未保存の変更があるかどうか
- `table.getChangedRows()`: 変更された行の一覧を取得
- `table.markAsSaved()`: ダーティ状態をクリア
- `table.resetToInitial()`: 初期データに戻す

#### Scenario: Track dirty state
- **WHEN** ユーザーがセルを編集する
- **THEN** `table.isDirty` が `true` になる
- **AND** `table.getChangedRows()` に変更行が含まれる

#### Scenario: Mark as saved
- **WHEN** `table.markAsSaved()` を呼び出す
- **THEN** `table.isDirty` が `false` になる
- **AND** `table.getChangedRows()` は空配列を返す

#### Scenario: Reset to initial data
- **WHEN** `table.resetToInitial()` を呼び出す
- **THEN** テーブルデータが `initialData` に戻る
- **AND** `table.isDirty` が `false` になる

### Requirement: Internal Store Architecture

内部状態管理は `useSyncExternalStore` とStore分離により、最小限の再レンダリングを実現しなければならない（MUST）。

- `dataSlice`: セルデータ、ダーティ管理
- `selectionSlice`: 選択範囲、アクティブセル
- `sortSlice`: ソート状態
- `filterSlice`: フィルタ状態
- `editSlice`: 編集モード状態（編集中セル位置、編集中の値）

#### Scenario: Cell component subscribes only to its data
- **WHEN** 別のセルのデータが変更される
- **THEN** 変更されていないセルのコンポーネントは再レンダリングされない

#### Scenario: Edit state isolated from data subscriptions
- **WHEN** セルが編集モードに入る
- **THEN** `editSlice` の状態のみが変更される
- **AND** 他のセルコンポーネントは再レンダリングされない

### Requirement: SpreadSheetTable Component

`<SpreadSheetTable table={table} />` コンポーネントを提供しなければならない（MUST）。

- `table` プロパティに `useSpreadSheetTable` の戻り値を渡す
- `readOnly` プロパティでテーブル全体を読み取り専用にできる

#### Scenario: Render table with hook
- **WHEN** `<SpreadSheetTable table={table} />` をレンダリングする
- **THEN** テーブルが列定義とデータに基づいて表示される

#### Scenario: Read-only mode
- **WHEN** `<SpreadSheetTable table={table} readOnly />` をレンダリングする
- **THEN** 全セルが編集不可となる

### Requirement: Undo/Redo API

`TableInstance` はセルデータの変更に対する undo/redo 操作を提供しなければならない（MUST）。

- `undo()`: 直前のデータ変更を取り消す
- `redo()`: 取り消した変更をやり直す
- `canUndo`: undo 可能な履歴が存在するか
- `canRedo`: redo 可能な履歴が存在するか

undo/redo の対象はセルデータの変更のみとし、ソート・フィルター・選択状態の変更は対象外とする。

#### Scenario: Undo single cell edit
- **GIVEN** セルの値を "A" から "B" に編集確定した
- **WHEN** `undo()` を呼ぶ
- **THEN** セルの値が "A" に戻る
- **AND** `canRedo` が `true` になる

#### Scenario: Redo after undo
- **GIVEN** undo を実行した
- **WHEN** `redo()` を呼ぶ
- **THEN** セルの値が "B" に戻る
- **AND** `canUndo` が `true` になる

#### Scenario: New edit clears redo stack
- **GIVEN** undo を実行した後、redo 可能な状態
- **WHEN** 新しいセル編集を確定する
- **THEN** `canRedo` が `false` になる

#### Scenario: Undo bulk paste
- **GIVEN** 複数セルにペーストした
- **WHEN** `undo()` を1回呼ぶ
- **THEN** ペーストで変更された全セルが元の値に戻る

#### Scenario: History stack limit
- **GIVEN** 25回以上のセル編集を行った
- **WHEN** 26回目の編集を確定する
- **THEN** 最も古い履歴エントリが破棄される
- **AND** undoStack のサイズは25以下を維持する

