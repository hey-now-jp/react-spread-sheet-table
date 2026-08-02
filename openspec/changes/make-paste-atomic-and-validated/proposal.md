# Change: ペーストを原子的に検証して確定する

## Why

現在のペーストはセルごとにStoreと`onChange`を更新し、列の型変換以外の制約を確定前に検証しない。
利用側がペースト専用の検証と変更集約を実装せずに済むよう、一操作として検証、確定、通知する。

## What Changes

- ペースト候補へ組み込み制約とカスタム`validate`を適用する。
- エラーがあればペースト全体を確定せず、警告だけなら確定する。
- ペースト中のStore通知と`onChange`を一回にまとめる。
- **BREAKING**: 一部セルだけを反映するペーストを廃止し、全体を成功または拒否する。

## Impact

- Affected specs: `clipboard`、`validation`
- Affected code: clipboard処理、validation utility、table store、`useSpreadSheetTable`
