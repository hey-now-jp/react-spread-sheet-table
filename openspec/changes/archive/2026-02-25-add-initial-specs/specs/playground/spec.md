## ADDED Requirements

### Requirement: Playground Application

ライブラリの動作確認・開発用のVite Reactアプリを `apps/playground/` に提供しなければならない（MUST）。

- `packages/core` を workspace 依存として参照する
- `private: true` として本番配布しない
- `pnpm --filter playground dev` でローカル開発サーバーを起動できる

#### Scenario: Start playground dev server
- **WHEN** `pnpm --filter playground dev` を実行する
- **THEN** ローカル開発サーバーが起動する
- **AND** ライブラリの最新コードがホットリロードで反映される

#### Scenario: Library changes reflected immediately
- **WHEN** `packages/core/src/` のコードを変更する
- **THEN** playground のブラウザに変更が即座に反映される

### Requirement: Feature Demo Pages

各機能のデモページを提供しなければならない（MUST）。
実装された機能ごとにデモページを追加し、動作を確認・テストできるようにする。

#### Scenario: Basic table demo
- **WHEN** playground のルートページにアクセスする
- **THEN** 基本的なテーブルが表示される
- **AND** 各列型（text, number, date, time, boolean, list）のデモが確認できる

#### Scenario: Feature-specific demo pages
- **WHEN** 各機能（ソート、フィルタ、コピペ、バリデーション等）が実装される
- **THEN** 対応するデモページが追加される

### Requirement: E2E Test Environment

Playwright CLIによるE2Eテスト環境を `apps/playground/e2e/` に提供しなければならない（MUST）。

- playground の開発サーバーをテスト対象とする
- `pnpm --filter playground exec playwright test` でテスト実行
- テスト結果のスクリーンショット・トレースを保存できる

#### Scenario: Run E2E tests
- **WHEN** `pnpm --filter playground exec playwright test` を実行する
- **THEN** playground の開発サーバーが自動起動する
- **AND** Playwright テストが実行される

#### Scenario: Playwright CLI interactive mode
- **WHEN** Playwright CLI のインタラクティブモードを使用する
- **THEN** playground上でブラウザ操作を記録・再生できる

### Requirement: Monorepo Workspace Configuration

pnpm workspaces によるモノレポ構成を提供しなければならない（MUST）。

- `pnpm-workspace.yaml` で `packages/*` と `apps/*` を定義
- ルート `package.json` に共通スクリプトを定義
- playground は `@hey-now-jp/react-spread-sheet-table: "workspace:*"` で core を参照

#### Scenario: Install all dependencies
- **WHEN** ルートで `pnpm install` を実行する
- **THEN** 全パッケージの依存が解決される
- **AND** playground から core への symlink が作成される

#### Scenario: Run all tests from root
- **WHEN** ルートで `pnpm test` を実行する
- **THEN** core のユニットテストと playground の E2E テストが実行される
