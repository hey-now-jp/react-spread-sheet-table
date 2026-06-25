## Purpose

ライブラリのドキュメント・動作確認用Astroアプリを提供する。デモページとPlaywright CLIによるE2Eテスト環境をpnpm workspacesモノレポで構成する。
ドキュメント & デモアプリとPlaywright E2Eテスト環境
## Requirements
### Requirement: Docs Application

ライブラリのドキュメント・動作確認用のAstro + Starlightアプリを `apps/docs/` に提供しなければならない（MUST）。

- `packages/core` を workspace 依存として参照する
- `private: true` として本番配布しない
- `pnpm --filter docs dev` でローカル開発サーバーを起動できる

#### Scenario: Start docs dev server
- **WHEN** `pnpm --filter docs dev` を実行する
- **THEN** ローカル開発サーバーが起動する
- **AND** ライブラリの最新コードがホットリロードで反映される

#### Scenario: Library changes reflected immediately
- **WHEN** `packages/core/src/` のコードを変更する
- **THEN** docs のブラウザに変更が即座に反映される

### Requirement: Feature Demo Pages

各機能のデモページを提供しなければならない（MUST）。
実装された機能ごとにデモページを追加し、動作を確認・テストできるようにする。

#### Scenario: Basic table demo
- **WHEN** docs のルートページにアクセスする
- **THEN** 基本的なテーブルが表示される
- **AND** 各列型（text, number, date, time, boolean, list）のデモが確認できる

#### Scenario: Feature-specific demo pages
- **WHEN** 各機能（ソート、フィルタ、コピペ、バリデーション等）が実装される
- **THEN** 対応するデモページが追加される

### Requirement: E2E Test Environment

docs 上で Playwright を使った機能別 E2E テストを提供しなければならない (MUST)。
既存のスモークテストに加え、各機能ごとに分離されたテストファイルでスペックのシナリオをブラウザ操作で検証する。

#### Scenario: 機能別 E2E テスト実行
- **WHEN** `pnpm test:e2e` を実行する
- **THEN** 全機能別テストファイルが実行され、結果が報告される

#### Scenario: テストファイルの機能別分離
- **GIVEN** `apps/docs/e2e/` ディレクトリ
- **WHEN** テストファイル一覧を確認する
- **THEN** smoke.test.ts に加え、cell-editing / selection / keyboard-nav / clipboard / sort / filter / validation / undo-redo / virtual-scroll / column-types の各テストファイルが存在する

### Requirement: Monorepo Workspace Configuration

pnpm workspaces によるモノレポ構成を提供しなければならない（MUST）。

- `pnpm-workspace.yaml` で `packages/*` と `apps/*` を定義
- ルート `package.json` に共通スクリプトを定義
- docs は `@heynow-jp/react-spread-sheet-table: "workspace:*"` で core を参照

#### Scenario: Install all dependencies
- **WHEN** ルートで `pnpm install` を実行する
- **THEN** 全パッケージの依存が解決される
- **AND** docs から core への symlink が作成される

#### Scenario: Run all tests from root
- **WHEN** ルートで `pnpm test` を実行する
- **THEN** core のユニットテストと docs の E2E テストが実行される

