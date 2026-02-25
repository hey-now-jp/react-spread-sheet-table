## MODIFIED Requirements

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
