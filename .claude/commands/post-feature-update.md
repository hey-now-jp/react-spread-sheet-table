---
name: Post Feature Update
description: 機能変更後にドキュメントとE2Eテストを更新する
category: Development
tags: [docs, e2e, testing]
---

機能が変更された後、関連するドキュメントとE2Eテストを更新してください。

## 手順

### 1. 変更内容の把握

まず、直近の変更内容を把握してください:

- `packages/core/src/core/types/` の型定義の変更 (新しいオプション、プロパティ、型)
- `packages/core/src/hooks/` のフック実装の変更
- `packages/core/src/components/` のコンポーネント変更
- `packages/core/src/styles/` のスタイル変更

`git diff` や `git log` で最近の変更を確認し、何が追加・変更・削除されたかをリストアップしてください。

### 2. APIドキュメントの更新

対象ファイル: `apps/docs/src/content/docs/api/*.mdx`

- `use-spread-sheet-table.mdx` - Options テーブルと Return テーブルを型定義と一致させる
- `column-def.mdx` - カラム定義の型が変わった場合に更新
- `table-instance.mdx` - TableInstance の新しいメソッド/プロパティを追記

既存のドキュメントスタイル (日本語、テーブル形式、コード例) に従ってください。

### 3. ガイドドキュメントの更新

対象ファイル: `apps/docs/src/content/docs/guides/*.mdx`

- 新機能に関連する既存ガイドがあれば更新
- 新機能が十分に大きい場合は新しいガイドページを作成
- Starlight のサイドバー設定 (`apps/docs/astro.config.mjs`) にページを追加

### 4. Playground デモの更新

対象ファイル: `apps/docs/src/components/*Demo.tsx`

- `BasicDemo.tsx` に新機能のデモが必要か確認
- 必要であれば新しいデモコンポーネントを作成
- playground ページ (`apps/docs/src/content/docs/playground/index.mdx`) から参照

### 5. E2Eテストの更新

対象ディレクトリ: `apps/docs/e2e/`

ヘルパー: `apps/docs/e2e/helpers.ts` にある `getCell`, `getCellEditor`, `getHeaderCell` などのユーティリティを活用してください。

- 既存テストファイルで変更の影響を受けるものを更新
- 新機能には新しいテストファイルを作成 (例: `apps/docs/e2e/frozen-columns.test.ts`)
- テストは `pnpm test:e2e` で実行して確認

E2Eテストのパターン:
```typescript
import { test, expect } from '@playwright/test'
import { getCell, getHeaderCell } from './helpers'

test.describe('機能名', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('[data-testid="spread-sheet-table"]')
  })

  test('テストケース', async ({ page }) => {
    // ...
  })
})
```

### 6. ユニットテストの確認

対象: `packages/core/src/**/*.test.ts`

- 新しいスライスやフックにユニットテストがあるか確認
- 不足があれば追加を提案

### 7. 検証

以下のコマンドで問題がないことを確認:

```bash
pnpm typecheck    # 型エラーがないこと
pnpm test         # ユニットテストが通ること
pnpm test:e2e     # E2Eテストが通ること
pnpm build        # ビルドが成功すること
```

## 注意事項

- ドキュメントは日本語で書く
- コードやドキュメントに絵文字を使わない
- 既存のスタイルとフォーマットに合わせる
- CSS Modules のクラス名やCSS変数が変わった場合はドキュメントにも反映
