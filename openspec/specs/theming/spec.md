## Purpose

CSS Custom Properties（CSS変数）によるテーミングとCSS Modulesによるスタイルスコープ化を提供する。利用側のスタイリングライブラリと干渉しない。
CSS ModulesとCSS Custom Propertiesによるテーミング

## Requirements

### Requirement: CSS Custom Properties Theming

テーミングはCSS Custom Properties（CSS変数）で提供しなければならない（MUST）。
利用側がCSS変数を上書きするだけでテーマをカスタマイズできる。

全変数には `--sst-` プレフィックスを付ける。

#### Scenario: Override theme with CSS class
- **WHEN** 親要素にCSS変数を定義したクラスを適用する
- **THEN** テーブルのスタイルが上書きされる

#### Scenario: Default theme without customization
- **WHEN** CSS変数を上書きしない
- **THEN** デフォルトテーマで表示される

### Requirement: Theme Variables

以下のカテゴリのCSS変数を提供しなければならない（MUST）。

- フォント: `--sst-font-family`, `--sst-font-size`
- セル: `--sst-cell-height`, `--sst-cell-padding`
- 色: `--sst-border-color`, `--sst-header-bg`, `--sst-row-bg`, `--sst-row-alt-bg`
- 選択: `--sst-selected-bg`, `--sst-selected-border`
- バリデーション: `--sst-error-bg`, `--sst-error-border`, `--sst-warn-bg`, `--sst-warn-border`

#### Scenario: Customize font
- **WHEN** `--sst-font-family: 'Noto Sans JP'` を設定する
- **THEN** テーブル全体のフォントが変更される

#### Scenario: Customize selection color
- **WHEN** `--sst-selected-bg` と `--sst-selected-border` を設定する
- **THEN** 選択範囲の表示色が変更される

### Requirement: CSS Modules Scoping

コンポーネントのスタイルはCSS Modulesでスコープ化されなければならない（MUST）。
利用側のグローバルCSSやスタイリングライブラリと干渉しない。

#### Scenario: No style leakage
- **WHEN** テーブルコンポーネントをレンダリングする
- **THEN** テーブルのスタイルがページ内の他の要素に影響しない

#### Scenario: No external style interference
- **WHEN** 利用側がグローバルなtableスタイルを定義している
- **THEN** テーブルコンポーネントのスタイルが影響を受けない

### Requirement: Styling Independence

利用側のスタイリングライブラリ（Tailwind, styled-components, Emotion等）と共存できなければならない（MUST）。
ライブラリ側はCSS Modulesのみを使用し、外部のCSS-in-JSランタイムに依存しない。

#### Scenario: Works with Tailwind project
- **WHEN** Tailwind CSSを使用しているプロジェクトに導入する
- **THEN** スタイルの競合なく動作する

#### Scenario: Works with styled-components project
- **WHEN** styled-componentsを使用しているプロジェクトに導入する
- **THEN** スタイルの競合なく動作する
