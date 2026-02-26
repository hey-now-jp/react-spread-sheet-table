## ADDED Requirements

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
