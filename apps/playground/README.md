# Playground

`@heynow/react-spread-sheet-table` のデモアプリケーション。

[https://hey-now-jp.github.io/react-spread-sheet-table/](https://hey-now-jp.github.io/react-spread-sheet-table/)

## 開発

```bash
# ルートから起動
pnpm dev

# または playground ディレクトリから
pnpm --filter playground dev
```

http://localhost:5173 で開く。

## デモ一覧

### 基本テーブル（BasicDemo）

全 6 種類のカラム型を使った従業員テーブル。ソート・フィルター・セル編集・クリップボード操作・変更追跡をデモ。20 行のサンプルデータ。

### 編集 & バリデーション（EditingDemo）

組み込みバリデーションとカスタムバリデーションのデモ。メールアドレスのパターン検証、スコアの範囲チェック、日付の最小値制限、カスタム警告（高スコア検出）を表示。

### 仮想スクロール（VirtualScrollDemo）

10,000 行のデータで仮想スクロールのパフォーマンスをデモ。表示領域の行のみをレンダリングし、大量データでもスムーズに動作。

## E2E テスト

```bash
# テスト実行
pnpm --filter playground test:e2e

# UI モード
pnpm --filter playground test:e2e:ui
```

## デプロイ

`main` ブランチへの push で GitHub Actions が自動デプロイする。手動実行も可能（workflow_dispatch）。

GitHub リポジトリの Settings > Pages で Source を `GitHub Actions` に設定すること。
