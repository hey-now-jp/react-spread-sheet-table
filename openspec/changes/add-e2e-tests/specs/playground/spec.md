## MODIFIED Requirements

### Requirement: E2E Test Environment

playground 上で Playwright を使った機能別 E2E テストを提供しなければならない (MUST)。
既存のスモークテストに加え、各機能ごとに分離されたテストファイルでスペックのシナリオをブラウザ操作で検証する。

#### Scenario: 機能別 E2E テスト実行
- **WHEN** `pnpm test:e2e` を実行する
- **THEN** 全機能別テストファイルが実行され、結果が報告される

#### Scenario: テストファイルの機能別分離
- **GIVEN** `apps/playground/e2e/` ディレクトリ
- **WHEN** テストファイル一覧を確認する
- **THEN** smoke.test.ts に加え、cell-editing / selection / keyboard-nav / clipboard / sort / filter / validation / undo-redo / virtual-scroll / column-types の各テストファイルが存在する
