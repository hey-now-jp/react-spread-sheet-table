## ADDED Requirements

### Requirement: Process Row Changes Before Commit

テーブルは単一セル編集とペーストによる行変更候補を、確定前に利用側の同期関数へ渡さなければならない（MUST）。

処理関数は補正済みの行を受理するか、セル単位の理由を付けて変更を拒否できなければならない（MUST）。

#### Scenario: Normalize a dependent value

- **GIVEN** 開始時刻から終了時刻を補正する`processRowChange`を指定している
- **WHEN** 開始時刻を編集する
- **THEN** 開始時刻と補正された終了時刻が一操作として確定される
- **AND** Undoで両方の値が元に戻る

#### Scenario: Reject a row change

- **GIVEN** 行全体の業務ルールを検証する`processRowChange`を指定している
- **WHEN** 処理関数が変更候補を拒否する
- **THEN** 行は変更されない
- **AND** `onChange`は通知されない
- **AND** `onRowChangeRejected`へ拒否理由が通知される

#### Scenario: Process a multi-cell clear as one transaction

- **WHEN** 範囲を選択してDeleteまたはCutでセルをクリアする
- **THEN** 処理関数は行ごとにクリア後の行を一回受け取る
- **AND** `context.source`は`clear`である
- **AND** いずれかの行が拒否された場合はクリア全体が確定されない
- **AND** 確定された場合はUndo一回で範囲全体が元に戻る

#### Scenario: Process the final paste candidate

- **WHEN** 同じ行の複数セルをペーストする
- **THEN** 処理関数は全候補値を反映した行を一回受け取る
- **AND** いずれかの行が拒否された場合はペースト全体が確定されない
