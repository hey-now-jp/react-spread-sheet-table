# Change: Initial Capability Specs

## Why

プロジェクトの初期段階として、スプレッドシート風テーブルコンポーネントライブラリの
全capabilityを定義する。インターフェース設計とパフォーマンスを重視した設計方針を
正式なspecとして文書化する。

## What Changes

- **ADDED** column-types: Discriminated Unionによる型安全な列定義
- **ADDED** table-api: useSpreadSheetTable フックと非制御パターンのパブリックAPI
- **ADDED** cell-editing: セル編集とキーボードナビゲーション
- **ADDED** selection: 範囲選択とアクティブセル管理
- **ADDED** sort: 列ソート機能
- **ADDED** filter: 列フィルタ機能
- **ADDED** clipboard: TSV形式でのコピー & ペースト
- **ADDED** validation: 組み込み + カスタムバリデーション
- **ADDED** virtual-scroll: 仮想スクロールによる大量データ対応
- **ADDED** theming: CSS Modules + CSS Custom Propertiesによるテーミング
- **ADDED** playground: 開発用アプリ、デモページ、E2Eテスト環境（pnpm workspacesモノレポ）

## Impact

- Affected specs: 全て新規
- Affected code: なし（初期定義）
