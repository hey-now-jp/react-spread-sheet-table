# E2E テスト導入

## 概要

playground 上で Playwright を使った E2E テストを機能ごとに整備する。
既存の `smoke.test.ts` は最小限のスモークテストで、各機能の網羅的なテストが不足している。
スペックで定義されたシナリオをブラウザ操作で検証できるよう、機能別のテストファイルを追加する。

## 動機

- 既存スモークテストは11件のみで、11スペック・111シナリオの大部分が未カバー
- キーボード操作、クリップボード、範囲選択、フィルタなど複合的な動作はユニットテストだけでは不十分
- リグレッション防止のため、各機能の主要フローを E2E で保護したい

## スコープ

### 対象 (機能別テストファイル)

| テストファイル | 対象スペック | 主なテスト内容 |
|---|---|---|
| `cell-editing.test.ts` | cell-editing | ダブルクリック/Enter 編集、Escape キャンセル、Tab 確定移動、直接入力、boolean トグル (Space/Enter)、list ドロップダウン |
| `selection.test.ts` | selection | クリック選択、Shift+クリック範囲、ドラッグ範囲、Shift+矢印、Escape 解除、選択ハイライト |
| `keyboard-nav.test.ts` | cell-editing, selection | 矢印キー移動、Tab/Shift+Tab、ソート後のナビゲーション、仮想スクロール連動 |
| `clipboard.test.ts` | clipboard | Ctrl+C/V/X、範囲コピペ、read-only スキップ、Excel 互換 TSV |
| `sort.test.ts` | sort | asc→desc→解除サイクル、インジケーター表示、データ並替え確認 |
| `filter.test.ts` | filter | テキスト/数値/リスト/真偽値フィルタ、フィルタ解除、フィルタ UI 操作 |
| `validation.test.ts` | validation | エラー/警告表示、ツールチップ、エラーカウント、isValid |
| `undo-redo.test.ts` | table-api (undo/redo) | Ctrl+Z/Y、複数 undo/redo、ペースト一括 undo、新編集でredo消去 |
| `virtual-scroll.test.ts` | virtual-scroll | DOM ノード数制限、スクロール後のデータ表示、キー操作でのスクロール追従 |
| `column-types.test.ts` | column-types | 各型のエディタ表示確認、action 列の描画、read-only |

### 対象外

- テーミング (視覚的なCSS変数テストはスナップショットツールが適切)
- パフォーマンス計測 (別途ベンチマーク)
- playground 自体の内部実装テスト

## 方針

- 既存 `smoke.test.ts` はそのまま残す (CI ゲートの最小テスト)
- 機能別ファイルを `apps/playground/e2e/` に追加
- 各テストは独立して実行可能 (テスト間の状態依存なし)
- テストデータは playground のデモデータをそのまま利用
- 必要に応じてデモページにテスト用の data-testid を追加
