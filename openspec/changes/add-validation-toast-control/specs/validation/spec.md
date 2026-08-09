## ADDED Requirements

### Requirement: Validation Toast Visibility Control

`SpreadSheetTable`は、バリデーション処理や利用側への通知を無効にせず、組み込みバリデーショントーストの表示だけを制御できなければならない（MUST）。

表示設定を省略した場合は、後方互換性のため組み込みトーストを表示しなければならない（MUST）。

#### Scenario: Show the built-in toast by default

- **GIVEN** `showValidationToast`を指定していない
- **WHEN** セル編集がバリデーションエラーで拒否される
- **THEN** 組み込みトーストにエラーメッセージが表示される

#### Scenario: Hide only the built-in toast

- **GIVEN** `showValidationToast={false}`を指定している
- **WHEN** セル編集がバリデーションエラーで拒否される
- **THEN** 組み込みトーストは表示されない
- **AND** `onRowChangeRejected`には拒否理由が通知される

#### Scenario: Do not show a stale error after enabling the toast

- **GIVEN** 組み込みトーストを非表示にしている間にバリデーションエラーが発生した
- **WHEN** `showValidationToast`を`true`へ変更する
- **THEN** 非表示中に発生したエラーメッセージは表示されない
