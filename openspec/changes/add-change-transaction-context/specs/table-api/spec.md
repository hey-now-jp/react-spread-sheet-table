## ADDED Requirements

### Requirement: Row Change Commit Notification

テーブルは、単一セル編集またはペーストによる変更を確定した際、`onRowChangeCommitted`へ今回の操作で確定した行変更を通知しなければならない（MUST）。

確定通知は操作種別、および影響を受けた各行の変更前の行、確定後の行、セル単位の変更詳細を含まなければならない（MUST）。

既存の`onChange`の型と呼び出し方を変更してはならない（MUST NOT）。

```typescript
type RowChangeCommit<T> = {
  source: 'edit' | 'paste'
  rows: ReadonlyArray<{
    rowIndex: number
    previousRow: T
    row: T
    changes: ReadonlyArray<{
      key: keyof T
      previousValue: T[keyof T]
      newValue: T[keyof T]
    }>
  }>
}
```

#### Scenario: Single cell edit notification

- **WHEN** ユーザーが1つのセルを編集する
- **THEN** `onRowChangeCommitted`が1回だけ呼ばれる
- **AND** 操作種別`edit`と変更前後の行が渡される
- **AND** `changes`に今回変更したセルの変更前後の値が含まれる

#### Scenario: Normalized row notification

- **GIVEN** `processRowChange`が同じ行の別項目を補正する
- **WHEN** ユーザーがセル編集を確定する
- **THEN** 確定後の行に補正済みの値が含まれる
- **AND** `changes`に入力項目と補正項目が含まれる

#### Scenario: Bulk paste notification

- **WHEN** ユーザーが3行分のデータをペーストする
- **THEN** `onRowChangeCommitted`は1回だけ呼ばれる
- **AND** 操作種別は`paste`である
- **AND** 影響を受けた3行の変更前後の行が含まれる

#### Scenario: Existing onChange compatibility

- **GIVEN** 利用側が既存の`onChange`だけを指定している
- **WHEN** ユーザーがセルを編集する
- **THEN** `onChange`は従来と同じ1引数で呼ばれる

### Requirement: Row Change Rejection Context

`processRowChange`が行変更を拒否した場合、`onRowChangeRejected`は操作種別、セルエラー、および拒否された各行の変更前の行、変更候補の行、拒否理由を一つの拒否オブジェクトとして通知しなければならない（MUST）。

#### Scenario: Rejected single edit context

- **WHEN** `processRowChange`が単一セル編集を拒否する
- **THEN** `onRowChangeRejected`が1回だけ呼ばれる
- **AND** 操作種別`edit`、セルエラー、変更前の行、変更候補の行、拒否理由が渡される

#### Scenario: Rejected atomic paste context

- **WHEN** 複数行ペーストの一部を`processRowChange`が拒否する
- **THEN** ペースト全体は確定されない
- **AND** `onRowChangeRejected`は1回だけ呼ばれる
- **AND** 拒否された各行の変更前の行、変更候補の行、拒否理由が含まれる
