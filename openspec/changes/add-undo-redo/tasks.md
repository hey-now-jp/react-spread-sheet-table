## 1. History Slice

- [x] 1.1 HistorySlice 型定義 + createHistorySlice (`core/store/history-slice.ts`)
- [x] 1.2 pushEntry: 変更エントリをundoStackに追加、redoStackクリア
- [x] 1.3 undoEntry: undoStackからpop、previousValueを返却、redoStackにpush
- [x] 1.4 redoEntry: redoStackからpop、newValueを返却、undoStackにpush
- [x] 1.5 スタック上限（25エントリ）の強制
- [x] 1.6 History slice unit tests

## 2. Store Integration

- [x] 2.1 createStore に HistorySlice を統合
- [x] 2.2 setCellValue で HistoryEntry を記録（単一セル編集）
- [x] 2.3 pasteCells で複数変更を1つの HistoryEntry として記録
- [x] 2.4 clearCells (Delete/Backspace) で HistoryEntry を記録
- [x] 2.5 undo(): undoEntry から previousValue を適用して行データを復元
- [x] 2.6 redo(): redoEntry から newValue を再適用
- [x] 2.7 canUndo() / canRedo() メソッド追加
- [x] 2.8 Store integration tests（undo/redo のデータ復元検証）

## 3. Public API

- [x] 3.1 TableInstance 型に undo, redo, canUndo, canRedo を追加 (`core/types/table.ts`)
- [x] 3.2 useSpreadSheetTable で store.undo/redo を TableInstance に接続
- [x] 3.3 index.ts のエクスポート確認（型の追加があれば更新）

## 4. Keyboard Shortcuts

- [x] 4.1 SpreadSheetTable.tsx の handleKeyDown に Cmd/Ctrl+Z (undo) を追加
- [x] 4.2 Cmd/Ctrl+Y および Cmd/Ctrl+Shift+Z (redo) を追加
- [x] 4.3 編集モード中は undo/redo をスキップ

## 5. Playground

- [x] 5.1 EditingDemo に undo/redo ボタンを追加（canUndo/canRedo で disabled 制御）

## 6. Tests

- [x] 6.1 History slice unit tests（push, undo, redo, スタック上限）
- [x] 6.2 Store integration tests（setCellValue → undo → redo のデータ検証）
- [x] 6.3 Bulk operation tests（paste → undo で全セル復元）
- [x] 6.4 E2E test: Cmd+Z / Cmd+Y でセル値が復元される
- [x] 6.5 TypeScript typecheck 通過
- [x] 6.6 Biome check 通過
