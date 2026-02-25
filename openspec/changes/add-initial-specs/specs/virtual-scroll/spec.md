## ADDED Requirements

### Requirement: Virtual Row Rendering

大量の行データに対して仮想スクロールを提供しなければならない（MUST）。
表示領域内の行のみをDOMにレンダリングし、スクロールに応じて動的に更新する。

#### Scenario: Only visible rows are rendered
- **WHEN** 10,000行のデータでテーブルをレンダリングする
- **THEN** 表示領域内の行 + バッファ分のみがDOMに存在する
- **AND** スクロール位置に応じて表示行が切り替わる

#### Scenario: Smooth scrolling
- **WHEN** ユーザーがスクロールする
- **THEN** ちらつきなく滑らかにスクロールされる

### Requirement: Render Optimization

不要な再レンダリングを最小限に抑えなければならない（MUST）。

- セルコンポーネントは自身のデータが変更されたときのみ再レンダリングされる
- 選択状態の変更は関連するセルのみに影響する
- ソート・フィルタの結果はメモ化される

#### Scenario: Cell isolation
- **WHEN** セル(0,0)の値が変更される
- **THEN** セル(0,1)やセル(1,0)は再レンダリングされない

#### Scenario: Selection change optimization
- **WHEN** 選択範囲がセル(0,0)-(2,2)からセル(1,1)-(3,3)に変更される
- **THEN** 選択状態が変わったセルのみが再レンダリングされる

### Requirement: Immutable Data Operations

データ操作は全てイミュータブルに行わなければならない（MUST）。
元のデータオブジェクトを直接変更してはならない。

#### Scenario: Cell edit creates new data
- **WHEN** セルの値を編集する
- **THEN** 新しいデータオブジェクトが生成される
- **AND** 元のデータオブジェクトは変更されない
