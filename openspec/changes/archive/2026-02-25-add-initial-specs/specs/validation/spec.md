## ADDED Requirements

### Requirement: Built-in Type Validation

各データ型の列定義プロパティに基づく組み込みバリデーションを提供しなければならない（MUST）。

- `required`: 空値を許可しない
- `number`: `min`, `max` の範囲チェック
- `text`: `maxLength`, `pattern` のチェック
- `date`: `minDate`, `maxDate` の範囲チェック
- `time`: `minTime`, `maxTime` の範囲チェック

#### Scenario: Required field validation
- **WHEN** `required: true` のセルが空にされる
- **THEN** バリデーションエラーが発生する

#### Scenario: Number range validation
- **WHEN** `min: 0, max: 150` のセルに `-1` が入力される
- **THEN** バリデーションエラーが発生する

### Requirement: Custom Validation

列定義に `validate` 関数を指定してカスタムバリデーションを追加できなければならない（MUST）。

```typescript
validate?: (value: T[K], row: T) => ValidationResult | null
type ValidationResult = { level: 'error' | 'warn'; message: string }
```

#### Scenario: Custom validation error
- **WHEN** `validate` が `{ level: 'error', message: '...' }` を返す
- **THEN** セルがエラー状態で表示される

#### Scenario: Custom validation warning
- **WHEN** `validate` が `{ level: 'warn', message: '...' }` を返す
- **THEN** セルが警告状態で表示される（保存はブロックしない）

#### Scenario: Custom validation passes
- **WHEN** `validate` が `null` を返す
- **THEN** セルは正常状態で表示される

### Requirement: Validation Visual Feedback

バリデーション結果はセルの視覚的な状態として表示しなければならない（MUST）。

#### Scenario: Error cell display
- **WHEN** セルにバリデーションエラーがある
- **THEN** セルの背景色が `--sst-error-bg` で表示される
- **AND** セルの枠線が `--sst-error-border` で表示される
- **AND** ホバーまたはフォーカスでエラーメッセージがツールチップ表示される

#### Scenario: Warning cell display
- **WHEN** セルにバリデーション警告がある
- **THEN** セルの背景色が `--sst-warn-bg` で表示される

### Requirement: Validation API

プログラムからバリデーション状態を取得できるAPIを提供しなければならない（MUST）。

- `table.getValidationErrors()`: 全エラーの一覧
- `table.isValid()`: テーブル全体の有効性（errorレベルのみ。warnは無視）

#### Scenario: Get all validation errors
- **WHEN** `table.getValidationErrors()` を呼び出す
- **THEN** セル位置とエラー内容の一覧が返される

#### Scenario: Check table validity
- **WHEN** エラーレベルのバリデーション違反が1件以上ある
- **THEN** `table.isValid()` が `false` を返す

### Requirement: onValidationError Callback

バリデーションエラーの変化を通知する `onValidationError` コールバックを提供しなければならない（MUST）。

#### Scenario: Validation error notification
- **WHEN** セルの編集によりバリデーションエラーが発生する
- **THEN** `onValidationError` に現在の全エラー一覧が渡される
