# Change: 変更操作の行コンテキストを通知する

## Why

`onChange`は編集基準からの累積変更行だけを通知するため、利用側が操作直前と確定後の行を比較するには、テーブル内部と同じ行データを別途保持する必要がある。

`onRowChangeRejected`も行番号とセルエラーだけを通知するため、利用側は拒否された行の識別情報を自前の行データから引き直している。

テーブルがすでに保持している操作単位の行コンテキストを公開し、利用側による状態の二重管理を不要にする。

## What Changes

- `onRowChangeCommitted`を追加し、操作種別と確定前後の行を操作単位で通知する。
- `onRowChangeRejected`は、操作種別、セルエラー、変更前の行、変更候補の行、拒否理由を一つのオブジェクトで通知する。
- 単一セル編集と複数セルペーストのどちらも、1操作につき1トランザクションを通知する。
- 既存の`onChange`の型と呼び出し方は変更せず、既存利用側との互換性を保つ。

## Impact

- Affected specs: `table-api`
- Affected code: public types、行変更準備、`useSpreadSheetTable`、APIドキュメント
- Consumer impact: 既存の`onChange`利用側は変更不要。操作単位の前後行が必要な利用側だけ新しいコールバックを使用する。
