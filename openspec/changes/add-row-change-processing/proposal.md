# Change: 行変更を確定前に処理できるAPIを追加する

## Why

現在は行内の複数項目にまたがる補正や業務ルールによる拒否を、利用側が`onChange`後に実装する必要がある。
単一セル編集とペーストで同じ処理を共有し、確定前の一貫した行データを扱えるようにする。

## What Changes

- `processRowChange`オプションを追加し、変更候補の行を確定前に処理する。
- 処理結果として、補正済みの行を受理するか、セル単位の理由を付けて変更を拒否できるようにする。
- 単一セル編集と複数セルペーストの両方へ同じ処理を適用する。
- 拒否時の`onRowChangeRejected`コールバックを追加する。
- 処理関数は同期関数に限定する。

## Impact

- Affected specs: `table-api`
- Affected code: public types、change preparation utility、`useSpreadSheetTable`、API documentation
