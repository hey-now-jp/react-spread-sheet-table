# Change: Add undo/redo support

## Why

スプレッドシートの基本操作として、誤編集の取り消し（Cmd+Z / Ctrl+Z）とやり直し（Cmd+Y / Ctrl+Y / Cmd+Shift+Z）は不可欠。現状はセル編集の取り消し手段が `resetToInitial()` による全リセットしかなく、個別操作の巻き戻しができない。

## What Changes

- **HistorySlice**: セルデータの変更履歴を管理する新スライス（undo/redo スタック）
- **Store拡張**: `undo()`, `redo()`, `canUndo()`, `canRedo()` メソッドの追加
- **TableInstance拡張**: パブリックAPIに `undo`, `redo`, `canUndo`, `canRedo` を追加
- **キーボードショートカット**: Cmd/Ctrl+Z（undo）、Cmd/Ctrl+Y / Cmd/Ctrl+Shift+Z（redo）
- **Playground**: EditingDemo にundo/redoボタンを追加

## Impact

- Affected specs: table-api（TableInstance拡張）、cell-editing（キーボードショートカット追加）
- Affected code: `core/store/` (history-slice新規、create-store拡張)、`core/types/table.ts`、`components/SpreadSheetTable.tsx`、`hooks/use-spread-sheet-table.ts`、`apps/playground/`
