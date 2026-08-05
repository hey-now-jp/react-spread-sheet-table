## ADDED Requirements

### Requirement: Data Replacement API

`TableInstance`は外部から取得した新しい行データを編集基準として差し替える`replaceData()`を提供しなければならない（MUST）。

データ差し替え時は変更追跡、undo/redo履歴、選択範囲、編集中状態を初期化し、ソート、フィルター、列幅を維持しなければならない（MUST）。

#### Scenario: Replace data after refetch

- **GIVEN** 利用者がテーブルを編集している
- **WHEN** `replaceData(nextData)`を呼び出す
- **THEN** テーブルは`nextData`を表示する
- **AND** ダーティ状態と変更行がクリアされる
- **AND** undo/redo履歴、選択範囲、編集中状態がクリアされる

#### Scenario: Reset after replacing data

- **GIVEN** `replaceData(nextData)`を呼び出した後にセルを編集している
- **WHEN** `resetToInitial()`を呼び出す
- **THEN** テーブルは`nextData`へ戻る

#### Scenario: Preserve view configuration

- **GIVEN** ソート、フィルター、列幅を設定している
- **WHEN** `replaceData(nextData)`を呼び出す
- **THEN** ソート、フィルター、列幅は維持される
