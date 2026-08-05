## Context

テーブルは非制御コンポーネントとして行データを内部に保持する。

現在の`onChange`第1引数は、編集基準から変更された行を返す。この情報は保存対象全体の取得には適しているが、今回の操作でどの状態からどの状態へ変わったかは表さない。

利用側が操作単位のAPI更新を作る場合、通知された行と比較するための行データをテーブルとは別に保持する必要がある。

## Goals / Non-Goals

### Goals

- 利用側が行データを二重管理せず、操作直前と確定後の行を取得できるようにする。
- 補正された複数項目を含む最終行を、1操作の結果として通知する。
- 拒否された変更候補と元の行を、行番号から引き直さず取得できるようにする。
- 既存の`onChange`利用側との互換性を保つ。

### Non-Goals

- APIリクエストや業務固有の更新イベントをライブラリ内で生成すること。
- 非同期の行検証を追加すること。
- 外部制御コンポーネントへ変更すること。
- 累積変更を返す`getChangedRows()`の意味を変更すること。

## Decisions

### 操作単位の確定通知を独立したコールバックとして追加する

`onChange`は編集基準からの累積変更を通知する既存APIとして維持する。

操作単位の確定結果は、新しい`onRowChangeCommitted`で通知する。

既存コールバックへ引数を追加すると、引数を厳密に検証する利用側のテストへ影響する可能性がある。独立したコールバックにすることで、既存`onChange`の型と実行時の呼び出しを変更しない。

```ts
type CommittedRowChange<T> = {
  rowIndex: number
  previousRow: T
  row: T
  changes: ReadonlyArray<CellChange<T>>
}

type RowChangeCommit<T> = {
  source: 'edit' | 'paste'
  rows: ReadonlyArray<CommittedRowChange<T>>
}

type RejectedRowChange<T> = {
  rowIndex: number
  previousRow: T
  candidateRow: T
  issues: ReadonlyArray<RowChangeIssue<T>>
}

type RowChangeRejection<T> = {
  source: 'edit' | 'paste'
  errors: ReadonlyArray<CellValidationError>
  rows: ReadonlyArray<RejectedRowChange<T>>
}
```

行オブジェクトはテーブルが保持するスナップショットとして渡し、利用側は読み取り専用として扱う。

### 変更トランザクションは操作直前のStoreから作る

編集確定直前に`store.getRows()`を取得し、確定後の行と比較してトランザクションを組み立てる。

これにより、`markAsSaved()`や編集基準からの累積変更に依存せず、今回の操作だけを表現できる。

`processRowChange`が補正した項目も、確定前後で値が異なる場合は`changes`へ含める。

### 拒否トランザクションは行変更準備中に保持する

`prepareCellUpdates`は変更前の行、入力候補の行、`processRowChange`が返した拒否理由をすでに参照している。

拒否時にこの情報を破棄せず、セルエラーとともに`useSpreadSheetTable`へ返す。

複数行ペーストでは拒否された行をまとめ、ペースト全体が確定されなかったことを1回のコールバックで通知する。

## Risks / Trade-offs

- 行オブジェクトをコールバックへ追加するため、通知データ量が増える。
  対象は1操作で影響を受けた行だけに限定する。
- `onChange`の累積変更と`onRowChangeCommitted`の操作変更は意味が異なる。
  コールバック名、型名、APIドキュメント、例で区別を明記する。
- 行オブジェクトはStoreのスナップショットであり、利用側が変更すると混乱を招く。
  公開型を`readonly`とし、ライブラリ内ではイミュータブルに扱う。

## Migration Plan

1. 公開型とテストを追加する。
2. 行変更準備処理から拒否コンテキストを返す。
3. 確定前後の行から変更トランザクションを作る。
4. 独立した確定コールバックと拒否コールバックから通知する。
5. ドキュメントと利用例を更新する。

既存の`onChange`を変更しないため、利用側の一括移行は不要である。
