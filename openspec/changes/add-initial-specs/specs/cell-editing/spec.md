## ADDED Requirements

### Requirement: Edit Mode Activation

セルはダブルクリックまたはEnterキーで編集モードに入らなければならない（MUST）。

#### Scenario: Double-click to edit
- **WHEN** ユーザーがデータセルをダブルクリックする
- **THEN** セルが編集モードになる
- **AND** 型に応じたエディタUIが表示される

#### Scenario: Enter key to edit
- **WHEN** アクティブセルがある状態でEnterキーを押す
- **THEN** セルが編集モードになる

#### Scenario: Read-only cell cannot be edited
- **WHEN** `readOnly: true` が設定されたセルをダブルクリックする
- **THEN** 編集モードにならない

#### Scenario: Action column cannot be edited
- **WHEN** アクション列のセルをダブルクリックする
- **THEN** 編集モードにならない

### Requirement: Edit Mode Deactivation

編集モードはEscapeキーでキャンセル、Tab/Enterキーで確定しなければならない（MUST）。

#### Scenario: Escape cancels edit
- **WHEN** 編集モード中にEscapeキーを押す
- **THEN** 変更が破棄される
- **AND** 編集前の値に戻る

#### Scenario: Enter confirms edit
- **WHEN** 編集モード中にEnterキーを押す
- **THEN** 変更が確定される
- **AND** アクティブセルが下のセルに移動する

#### Scenario: Tab confirms and moves right
- **WHEN** 編集モード中にTabキーを押す
- **THEN** 変更が確定される
- **AND** アクティブセルが右のセルに移動する

### Requirement: Type-Specific Editors

各データ型に応じた入力補助UIを提供しなければならない（MUST）。

- `text`: テキスト入力フィールド
- `number`: 数値入力フィールド（ステッパー付き）
- `date`: 日付ピッカー
- `time`: 時刻ピッカー
- `boolean`: チェックボックス（クリックでトグル、編集モード不要）
- `list`: ドロップダウンセレクト

#### Scenario: Boolean cell toggles on click
- **WHEN** boolean型セルをクリックする
- **THEN** 値がトグルされる（true ↔ false）
- **AND** 編集モードに入らずに即座に変更が確定される

#### Scenario: List cell shows dropdown
- **WHEN** list型セルが編集モードに入る
- **THEN** `options` で定義された選択肢のドロップダウンが表示される

### Requirement: Keyboard Navigation

矢印キー、Tab、Shift+Tabによるセル間のキーボードナビゲーションを提供しなければならない（MUST）。

#### Scenario: Arrow key navigation
- **WHEN** 非編集モードで矢印キーを押す
- **THEN** アクティブセルが対応する方向に移動する

#### Scenario: Tab moves to next cell
- **WHEN** 非編集モードでTabキーを押す
- **THEN** アクティブセルが右の次のデータセルに移動する
- **AND** アクション列はスキップされる

#### Scenario: Shift+Tab moves to previous cell
- **WHEN** 非編集モードでShift+Tabを押す
- **THEN** アクティブセルが左の前のデータセルに移動する

#### Scenario: Navigation wraps at row boundary
- **WHEN** 行末のセルでTabキーを押す
- **THEN** 次の行の最初のデータセルに移動する

### Requirement: Direct Input

非編集モードで文字を入力すると、既存の値をクリアして編集モードに入らなければならない（MUST）。

#### Scenario: Type to replace
- **WHEN** 非編集モードでアルファベットや数字を入力する
- **THEN** セルが編集モードになる
- **AND** 既存の値がクリアされ、入力した文字が反映される
