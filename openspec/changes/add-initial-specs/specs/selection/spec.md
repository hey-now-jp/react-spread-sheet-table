## ADDED Requirements

### Requirement: Active Cell

テーブルは常に1つのアクティブセル（フォーカスされたセル）を持たなければならない（MUST）。

#### Scenario: Click to set active cell
- **WHEN** ユーザーがデータセルをクリックする
- **THEN** そのセルがアクティブセルになる
- **AND** 視覚的にハイライトされる

#### Scenario: Active cell on action column
- **WHEN** ユーザーがアクション列のセルをクリックする
- **THEN** アクティブセルは移動しない（アクション列内のボタン等が動作する）

### Requirement: Range Selection

Shift+クリックまたはドラッグで矩形範囲を選択できなければならない（MUST）。

#### Scenario: Shift+Click range selection
- **WHEN** アクティブセルがある状態でShift+クリックする
- **THEN** アクティブセルからクリック先のセルまでの矩形範囲が選択される

#### Scenario: Drag range selection
- **WHEN** セル上でマウスダウンしてドラッグする
- **THEN** ドラッグ開始セルから現在のセルまでの矩形範囲が選択される

#### Scenario: Shift+Arrow key range selection
- **WHEN** Shift+矢印キーを押す
- **THEN** 選択範囲がその方向に拡張される

#### Scenario: Action columns excluded from range
- **WHEN** 範囲選択がアクション列をまたぐ
- **THEN** アクション列のセルは選択範囲に含まれない

### Requirement: Selection Visual Feedback

選択範囲は視覚的に明確に表示されなければならない（MUST）。

- アクティブセルは太い枠線で表示
- 選択範囲は背景色で表示
- 選択範囲の外枠は点線または実線の枠で表示

#### Scenario: Active cell highlight
- **WHEN** セルがアクティブである
- **THEN** セルの枠線がCSS変数 `--sst-selected-border` の色で表示される

#### Scenario: Selection range highlight
- **WHEN** 複数セルが選択されている
- **THEN** 選択範囲の背景色が `--sst-selected-bg` で表示される

### Requirement: Selection API

プログラムから選択範囲を制御できるAPIを提供しなければならない（MUST）。

- `table.selection`: 現在の選択状態の取得
- `table.select(range)`: 範囲を選択
- `table.clearSelection()`: 選択を解除

#### Scenario: Get current selection
- **WHEN** `table.selection` を参照する
- **THEN** アクティブセルの位置と選択範囲の情報が返される
