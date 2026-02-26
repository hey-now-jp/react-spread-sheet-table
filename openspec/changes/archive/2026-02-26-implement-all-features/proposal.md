# Change: Implement all 11 capability specs

## Why

型定義とテーマCSSのみが存在する状態から、全11スペック（column-types, table-api, cell-editing, selection, sort, filter, clipboard, validation, virtual-scroll, theming, playground）を一括実装し、動作するスプレッドシート風テーブルコンポーネントを完成させる。

## What Changes

- **Store基盤**: `useSyncExternalStore` + スライス分離（data, selection, sort, filter）によるステート管理
- **useSpreadSheetTable Hook**: パブリックAPI（TableInstance）を返すカスタムフック
- **SpreadSheetTable Component**: テーブル描画コンポーネント（CSS Modules）
- **Cell / Header / Editor Components**: セル表示・ヘッダー・型別エディタコンポーネント群
- **Selection**: クリック・ドラッグ・Shift+Arrow による範囲選択
- **Cell Editing**: ダブルクリック/Enter で編集モード、型別エディタ、キーボードナビゲーション
- **Sort**: ヘッダークリックでのソート切替、プログラマティックAPI
- **Filter**: 型別フィルタUI、プログラマティックAPI
- **Clipboard**: Ctrl+C/V/X でのTSV形式コピペ（Excel互換）
- **Validation**: 組み込みバリデーション + カスタムvalidate関数 + 視覚フィードバック
- **Virtual Scroll**: 仮想スクロールによる大量行の効率的レンダリング
- **Theming**: CSS Modules + CSS Custom Properties（`--sst-*`）
- **Playground**: 全機能のデモページ + Playwright E2Eテスト

## Impact

- Affected specs: column-types, table-api, cell-editing, selection, sort, filter, clipboard, validation, virtual-scroll, theming, playground（全11スペック）
- Affected code: `packages/core/src/` 全体（新規作成）、`apps/playground/src/`（デモ追加）、`apps/playground/e2e/`（E2Eテスト追加）
