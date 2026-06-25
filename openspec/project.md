# Project Context

## Purpose

React用のスプレッドシート風テーブルコンポーネントライブラリ。
通常のテーブル操作をスプレッドシートのような直感的なUXで提供する。
npmパッケージとして公開配布する。

重要な設計指針:
- **インターフェース設計**: 利用者側が直感的に使えるAPI設計を最優先する
- **パフォーマンス**: 大量データでも快適に動作する（仮想スクロール、メモ化、最小限の再レンダリング）

## Tech Stack

- **Runtime**: Node.js 22.22.0 (mise管理)
- **Package Manager**: pnpm (workspaces)
- **Monorepo**: pnpm workspaces によるモノレポ構成
- **Language**: TypeScript (strict mode)
- **UI Framework**: React 18+
- **Build Tool**: Vite (ライブラリモード for core), Astro (docs)
- **Test Framework**:
  - Unit / Integration: Vitest + React Testing Library (`packages/core/`)
  - E2E: Playwright (`apps/docs/e2e/`) - docs上でブラウザ操作をテスト
- **Styling**: CSS Modules
  - コンポーネント内部はCSS Modulesでスコープ化
  - テーミングはCSS Custom Properties (CSS変数) で提供
  - 利用側のスタイリングライブラリに依存しない

## Core Features

### 列の型システム
- Discriminated Unionによる型安全な列定義
- データ列の型: `text`, `number`, `date`, `time`, `boolean`, `list`
- `type`に応じたプロパティ制約（例: `type: 'number'`のときだけ`min`/`max`が利用可能）
- `key`は`keyof T`に制約（存在しないフィールド名は型エラー）
- 型に応じた入力補助UI（日付ピッカー、数値ステッパー、チェックボックス、ドロップダウン等）
- 型に応じたバリデーション（組み込み + カスタム`validate`関数）

### アクション列
- `type: 'action'`で定義するカスタムレンダリング列
- `render: (row, rowIndex) => React.ReactNode`で自由に描画
- `key`は任意の`string`（`keyof T`の制約なし）
- ソート・フィルタ・コピペ・範囲選択の対象外
- `pin: 'left' | 'right'`で列の固定位置を指定可能
- 用途: 削除ボタン、詳細リンク、行選択チェックボックス等

### 列定義の型構造
```typescript
type ColumnDef<T> = DataColumnDef<T> | ActionColumnDef<T>
```
- `DataColumnDef<T>`: データ列のDiscriminated Union（text/number/date/time/boolean/list）
- `ActionColumnDef<T>`: カスタムレンダリング列
- `isDataColumn()`型ガードで判別可能

### テーブル操作
- セル単位の編集（ダブルクリック / Enter で編集モード）
- ソート（単一列 / 複数列）
- フィルタリング
- 範囲選択（Shift+クリック、ドラッグ）
- 範囲指定でのコピー & ペースト（クリップボード連携）

### パフォーマンス要件
- 仮想スクロール（大量行の効率的レンダリング）
- React.memoによる不要な再レンダリング防止
- イミュータブルなデータ操作

## Public API Design

### 状態管理: 非制御パターン
- `initialData`でデータを渡し、テーブル内部で状態管理する
- セル編集のたびに親コンポーネントが再レンダリングされない
- 保存時に`table.getChangedRows()`で変更行を取得
- `table.resetToInitial()`で初期データに戻す
- `table.markAsSaved()`でダーティ状態をクリア

### カスタムフック
- パブリックAPIは`useSpreadSheetTable`一つで提供
- 内部では`useSyncExternalStore` + Store分離で必要なsliceだけ購読
- Storeは`dataSlice`, `selectionSlice`, `sortSlice`, `filterSlice`に分離

### onChange
- 変更があった行を`ChangeInfo<T>[]`として通知
- 各`ChangeInfo`にはセル単位の変更詳細（key, previousValue, newValue）を含む
- コピペによる一括変更も影響行をまとめて通知

## Project Conventions

### Code Style
- TypeScript strict mode必須
- イミュータブル: オブジェクト・配列の直接変更禁止、常に新しいオブジェクトを生成
- 小さなファイル: 1ファイル200-400行目安、800行上限
- 関数は50行以内
- ネストは4段階まで
- console.log禁止（デバッグ時のみ、コミット前に削除）

### Architecture Patterns
- **モノレポ**: pnpm workspacesでライブラリとdocsを分離
- **ライブラリモード**: Viteのライブラリモードでビルド、ESM + CJS出力
- **Headless Core + Styled Components**: ロジック層とUI層を分離
  - Core: 状態管理・データ操作・選択・ソート・フィルタのロジック（UIに依存しない）
  - Components: Coreを利用するReactコンポーネント群
- **カスタムフック**: テーブル状態管理はカスタムフックで提供
- **CSS Modules + CSS変数**: スタイルのスコープ化とテーミングの両立
- **Feature-based構成**: 機能ごとにディレクトリを分割

```
react-spread-sheet-table/
├── pnpm-workspace.yaml
├── package.json                # ルート: 共通scripts, 共通devDeps
├── packages/
│   └── core/                   # ライブラリ本体 (@heynow-jp/react-spread-sheet-table)
│       ├── package.json
│       ├── vite.config.ts      # ライブラリモード
│       ├── tsconfig.json
│       └── src/
│           ├── core/           # UIに依存しないロジック層
│           │   ├── types/      # 型定義
│           │   ├── selection/  # 範囲選択ロジック
│           │   ├── sort/       # ソートロジック
│           │   ├── filter/     # フィルタロジック
│           │   ├── clipboard/  # コピペロジック
│           │   └── validation/ # バリデーションロジック
│           ├── components/     # Reactコンポーネント
│           │   ├── Table/
│           │   ├── Cell/
│           │   ├── Header/
│           │   └── editors/    # 型別エディタコンポーネント
│           ├── hooks/          # カスタムフック
│           ├── styles/         # CSS Modules + テーマ変数
│           └── index.ts        # パブリックAPI (エクスポート)
├── apps/
│   └── docs/                   # ドキュメント & デモ + E2Eテスト対象
│       ├── package.json
│       ├── astro.config.ts     # Astro設定
│       ├── src/                # ドキュメント・デモページ
│       └── e2e/                # Playwright E2Eテスト
└── openspec/
```

### Docs
- ライブラリのドキュメント・動作確認用のAstro + Starlightアプリ
- `packages/core`をworkspace依存として参照（`"@heynow-jp/react-spread-sheet-table": "workspace:*"`）
- 各機能のデモページを提供（列型、ソート、フィルタ、コピペ、バリデーション等）
- E2EテストはPlaywright CLIでdocs上のブラウザ操作をテスト
- 本番には配布しない（private: true）

### Testing Strategy
- TDD: テストを先に書く
- 最低カバレッジ: 80%
- **Unit** (`packages/core/`): core/のロジック関数、ユーティリティ（Vitest）
- **Integration** (`packages/core/`): カスタムフック、コンポーネント間の連携（Vitest + React Testing Library）
- **E2E** (`apps/docs/e2e/`): Playwright CLIでdocs上のブラウザ操作をテスト
  - キーボードナビゲーション、セル編集、コピペ、範囲選択等の実ブラウザテスト
  - `pnpm --filter docs exec playwright test` で実行

### Git Workflow
- Conventional Commits: `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`, `perf:`
- 小さく焦点を絞ったコミット
- mainブランチへのPRベース開発

## Domain Context

- スプレッドシートのUXパターン（Excel / Google Sheets）を参考にする
- キーボードナビゲーション: 矢印キーでのセル移動、Tab/Shift+Tab、Enter/Escape
- クリップボード: TSV形式でのコピー/ペースト（Excel互換）
- 範囲選択: アクティブセル + 選択範囲の概念（Excelと同様）

## Important Constraints

- 外部UIライブラリに依存しない（React本体のみをpeerDependency）
- 利用側のスタイリングライブラリと競合しないこと
- バンドルサイズを意識する（tree-shakeable）
- React 18以上をサポート
- アクセシビリティ: WAI-ARIA grid パターンに準拠

## External Dependencies

### packages/core
- **peerDependencies**: react, react-dom
- **devDependencies**: vite, vitest, @testing-library/react, typescript

### apps/docs
- **dependencies**: react, react-dom, astro, @astrojs/react, @astrojs/starlight, `@heynow-jp/react-spread-sheet-table` (workspace:*)
- **devDependencies**: @playwright/test, typescript

### ルート
- **devDependencies**: typescript (共通設定)

外部サービスへの依存なし（ピュアなUIコンポーネントライブラリ）
