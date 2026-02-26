# Design: Add undo/redo support

## History Strategy: Operation-based

セルデータのスナップショットではなく、操作（CellChange）をスタックに積む方式を採用する。

### 理由

- メモリ効率: 行全体のスナップショットと比べ、変更セルのみ記録するため軽量
- 既存の `CellChange<T>` 型（`key`, `previousValue`, `newValue`）をそのまま活用できる
- ペースト等の一括操作は複数の `CellChange` を1つの操作単位としてグループ化

### HistorySlice

```typescript
type HistoryEntry<T> = {
  readonly changes: ReadonlyArray<{
    readonly rowIndex: number
    readonly columnKey: keyof T
    readonly previousValue: T[keyof T]
    readonly newValue: T[keyof T]
  }>
}

type HistorySlice<T> = {
  readonly undoStack: ReadonlyArray<HistoryEntry<T>>
  readonly redoStack: ReadonlyArray<HistoryEntry<T>>
}
```

### 操作フロー

```
セル編集確定 / ペースト / カット / Delete
  → HistoryEntry を undoStack に push
  → redoStack をクリア

Undo (Cmd+Z)
  → undoStack から pop
  → 各 change の previousValue をセルに復元
  → 復元した entry を redoStack に push

Redo (Cmd+Y)
  → redoStack から pop
  → 各 change の newValue をセルに再適用
  → 再適用した entry を undoStack に push
```

### スタック上限

メモリ肥大化を防ぐため、undoStack は最大 25 エントリとする。上限を超えた場合は最も古いエントリを破棄する。

### 対象外の操作

以下はundo/redo対象外とする:
- ソート / フィルター状態の変更（表示順序の変更であり、データ変更ではない）
- 選択状態の変更
- `markAsSaved()` / `resetToInitial()`（これらは意図的な操作）

### キーボードショートカット

既存の Ctrl/Cmd キーハンドリング（clipboard操作）と同じブロックに追加する。

```
Cmd/Ctrl + Z        → undo()
Cmd/Ctrl + Y        → redo()
Cmd/Ctrl + Shift + Z → redo()  (macOS 慣習)
```

編集モード中はundo/redoを無効にする（ブラウザのテキスト入力undoに委ねる）。

## Component Hierarchy (変更箇所)

```
SpreadSheetTable.tsx
  └── handleKeyDown  ← Cmd+Z / Cmd+Y ハンドラ追加

create-store.ts
  └── TableStore     ← undo(), redo(), canUndo(), canRedo() メソッド追加
  └── setCellValue() ← 変更時に history に push
  └── pasteCells()   ← 一括変更を1つの HistoryEntry として記録
  └── clearCells()   ← Delete/Backspace の変更を記録

core/store/history-slice.ts  ← 新規: HistorySlice, pushEntry, undo, redo

hooks/use-spread-sheet-table.ts
  └── TableInstance  ← undo, redo, canUndo, canRedo を公開

core/types/table.ts
  └── TableInstance  ← 型定義追加
```
