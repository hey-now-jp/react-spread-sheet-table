# Change: テーブルデータ差し替えAPIを追加する

## Why

API再取得後のデータを反映するには、利用側がテーブルを再マウントする必要がある。
新しいデータを編集基準として安全に差し替えるパブリックAPIを提供する。

## What Changes

- `TableInstance`へ`replaceData()`を追加する。
- データ差し替え時に変更追跡、履歴、選択、編集中状態を初期化する。
- ソート、フィルター、列幅は利用者の表示設定として維持する。

## Impact

- Affected specs: `table-api`
- Affected code: data slice、table store、`useSpreadSheetTable`の公開型
