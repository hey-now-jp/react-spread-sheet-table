# Change: バリデーショントーストの表示を制御できるようにする

## Why

利用側が独自のエラー表示を持つ場合、ライブラリ内蔵のトーストと同じエラーが重複して表示される。
バリデーションや拒否通知は維持したまま、内蔵トーストだけを非表示にできるようにする。

## What Changes

- `SpreadSheetTable`に`showValidationToast`プロパティを追加する。
- 既定値は`true`とし、既存の表示挙動を維持する。
- `false`の場合もバリデーション処理と`onRowChangeRejected`などの通知は継続する。
- 非表示中に発生したメッセージを保持せず、再表示時に古いエラーが現れないようにする。
- APIリファレンスを更新する。

## Impact

- Affected specs: `validation`
- Affected code: `SpreadSheetTable`の公開型と表示、Toast、コンポーネントテスト、ドキュメント
