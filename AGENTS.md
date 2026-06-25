<!-- OPENSPEC:START -->
# OpenSpec Instructions

These instructions are for AI assistants working in this project.

Always open `@/openspec/AGENTS.md` when the request:
- Mentions planning or proposals (words like proposal, spec, change, plan)
- Introduces new capabilities, breaking changes, architecture shifts, or big performance/security work
- Sounds ambiguous and you need the authoritative spec before coding

Use `@/openspec/AGENTS.md` to learn:
- How to create and apply change proposals
- Spec format and conventions
- Project structure and guidelines

Keep this managed block so 'openspec update' can refresh the instructions.

<!-- OPENSPEC:END -->

# プロジェクト概要

`@heynow-jp/react-spread-sheet-table` - React スプレッドシートテーブルコンポーネントライブラリ。

## モノレポ構成

```
packages/core/   - メインライブラリ (@heynow-jp/react-spread-sheet-table)
apps/playground/ - デモアプリ (Vite + React)
openspec/        - 仕様駆動の変更管理
```

## 技術スタック

- **ランタイム**: React 19, TypeScript 5.7
- **ビルド**: Vite, tsup (ライブラリバンドル)
- **テスト**: Vitest (ユニット/インテグレーション), Playwright (E2E)
- **リント/フォーマット**: Biome 2 (Prettier/ESLint は不使用)
- **Git hooks**: lefthook (pre-commit: biome check)
- **パッケージマネージャ**: pnpm 9 (workspaces)

## コマンド

```bash
pnpm dev          # playground 開発サーバー起動
pnpm build        # コアライブラリのビルド
pnpm test         # ユニット/インテグレーションテスト (Vitest)
pnpm test:e2e     # E2E テスト (Playwright)
pnpm typecheck    # 全パッケージの TypeScript 型チェック
pnpm lint         # Biome チェック
pnpm lint:fix     # Biome 自動修正
```

## アーキテクチャ (packages/core)

### ストア (イミュータブルスライスパターン)

各関心事を純粋関数のスライスとして分離し、常に新しいオブジェクトを返す (ミューテーション禁止):

- `data-slice` - 行データ、変更追跡、差分検出
- `selection-slice` - アクティブセル、範囲選択
- `sort-slice` - ソート状態 (キー + 方向)
- `filter-slice` - カラムごとのフィルタ条件
- `edit-slice` - 編集中セルの位置と値
- `history-slice` - Undo/Redo スタック (上限25エントリ、操作ベース)

`create-store.ts` が全スライスを `TableStore<T>` に統合し、`subscribe`/`getSnapshot` で `useSyncExternalStore` と連携する。

### コンポーネント

- `SpreadSheetTable` - メインコンポーネント、キーボード操作、クリップボード、マウス選択
- `Cell` - セル描画、編集モード制御、バリデーション表示
- `editors/` - 型別エディタ (Text, Number, Date, Time, List, MultiList, Boolean)
- `HeaderRow` - カラムヘッダー、ソート/フィルタ操作

### カラム型 (DataColumnDef の判別共用体)

| type | 値の型 | エディタ | 備考 |
|------|--------|----------|------|
| `text` | `string` | `<input type="text">` | maxLength, pattern バリデーション |
| `number` | `number` | `<input type="number">` | min, max, step, precision |
| `date` | `string` (YYYY-MM-DD) | `<input type="date">` | minDate, maxDate |
| `time` | `string` (HH:MM) | `<input type="time">` | minTime, maxTime, step |
| `boolean` | `boolean` | `<input type="checkbox">` | 常時表示、Space/Enter でトグル |
| `list` | `string` | `<select>` | options から単一選択 |
| `multiList` | `string[]` | チェックボックス一覧 | options から複数選択、カンマ区切り表示 |
| `action` | - | カスタム render 関数 | 読み取り専用、ソート/フィルタ対象外 |

### 型定義

全型は `core/types/index.ts` からバレルエクスポートする。深いインポート (`core/types/column`) は biome ルール `noRestrictedImports` で禁止。

### パブリック API

`useSpreadSheetTable(options)` が `TableInstance<T>` を返し、`<SpreadSheetTable table={table} />` に渡して使う。

## コーディング規約

- イミュータブルのみ - スライス関数は必ず新しいオブジェクトを返す
- 型のバレルインポート (`../types` を使い `../types/column` は禁止)
- Biome 設定: シングルクォート、セミコロンなし、末尾カンマあり、行幅100文字
- スタイリングは全て CSS Modules
- 全コンポーネントに `memo()` を適用
- コードやドキュメントに絵文字を使わない
- コミットメッセージは日本語で書く
