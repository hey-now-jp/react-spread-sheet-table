## MODIFIED Requirements

### Requirement: Keyboard Navigation

キーボードナビゲーションに undo/redo ショートカットを追加する（MUST）。

#### Scenario: Cmd/Ctrl+Z triggers undo
- **GIVEN** セルの値を編集確定済みで、編集モードではない
- **WHEN** Cmd+Z（macOS）または Ctrl+Z（Windows/Linux）を押す
- **THEN** 直前のデータ変更が取り消される

#### Scenario: Cmd/Ctrl+Y triggers redo
- **GIVEN** undo を実行済みで、編集モードではない
- **WHEN** Cmd+Y（macOS）または Ctrl+Y（Windows/Linux）を押す
- **THEN** 取り消した変更がやり直される

#### Scenario: Cmd/Ctrl+Shift+Z triggers redo (macOS convention)
- **GIVEN** undo を実行済みで、編集モードではない
- **WHEN** Cmd+Shift+Z を押す
- **THEN** 取り消した変更がやり直される

#### Scenario: Undo/redo disabled during edit mode
- **GIVEN** セルが編集モード中
- **WHEN** Cmd+Z または Cmd+Y を押す
- **THEN** テーブルの undo/redo は実行されない（ブラウザのテキスト入力 undo に委ねる）
