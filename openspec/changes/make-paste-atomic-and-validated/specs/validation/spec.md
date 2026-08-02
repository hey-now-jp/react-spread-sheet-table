## ADDED Requirements

### Requirement: Paste Validation Consistency

ペースト候補には通常のセルと同じ組み込み制約とカスタム`validate`を適用しなければならない（MUST）。

複数セルをペーストするとき、カスタム`validate`は同じ行の全候補値を反映した行を受け取らなければならない（MUST）。

#### Scenario: Reject number outside column range

- **GIVEN** 数値列に`min: 0, max: 150`を指定している
- **WHEN** `200`をペーストする
- **THEN** 最大値の検証エラーが表示される
- **AND** 値は変更されない

#### Scenario: Validate final row candidate

- **WHEN** 同じ行の複数セルを同時にペーストする
- **THEN** カスタム`validate`は全候補値を反映した行を検証する

#### Scenario: Commit warnings

- **WHEN** ペースト候補の検証結果が警告だけである
- **THEN** ペーストは確定される
- **AND** 警告状態が表示される
