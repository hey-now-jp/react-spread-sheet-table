# Design: Implement all 11 capability specs

## Store Architecture

### useSyncExternalStore + Slices

外部ストアパターンを採用し、セル単位の最小限再レンダリングを実現する。

```
TableStore
├── DataSlice       - セルデータ、ダーティ追跡、変更通知
├── SelectionSlice  - アクティブセル、選択範囲
├── SortSlice       - ソート状態
├── FilterSlice     - フィルタ状態
└── EditSlice       - 編集モード状態
```

各SliceはSubscription管理を持ち、`useSyncExternalStore`で購読する。セルコンポーネントは自身のデータのみを購読し、他セルの変更で再レンダリングされない。

### Store API

```typescript
interface TableStore<T> {
  // Data operations
  getRow(rowIndex: number): T
  getCellValue(rowIndex: number, columnKey: keyof T): T[keyof T]
  setCellValue(rowIndex: number, columnKey: keyof T, value: T[keyof T]): void
  getChangedRows(): ChangeInfo<T>[]
  getData(): readonly T[]
  resetToInitial(): void
  markAsSaved(): void

  // Selection
  getSelection(): SelectionState
  setActiveCell(position: CellPosition): void
  setRange(range: SelectionRange | null): void
  clearSelection(): void

  // Sort
  getSortState(): SortState<T>
  setSort(key: keyof T, direction: SortDirection): void
  clearSort(): void

  // Filter
  getFilterState(): FilterState<T>
  setFilter(key: keyof T, condition: FilterCondition): void
  clearFilter(key?: keyof T): void

  // Edit
  getEditingCell(): CellPosition | null
  startEditing(position: CellPosition): void
  stopEditing(commit: boolean): void

  // Subscriptions
  subscribe(listener: () => void): () => void
  subscribeToCell(rowIndex: number, columnKey: keyof T, listener: () => void): () => void
}
```

### Derived State (Memoized)

ソート・フィルタ適用後の行インデックス配列をメモ化する。元データは変更せず、表示順序のみを制御する。

```typescript
// sortedFilteredIndices: number[]
// 元データのインデックスを保持し、表示時にマッピング
```

## Component Hierarchy

```
SpreadSheetTable
├── HeaderRow
│   └── HeaderCell (per column)
│       ├── SortIndicator
│       └── FilterPopover
├── VirtualScrollContainer
│   └── TableBody (virtual rows)
│       └── TableRow (per visible row)
│           └── Cell (per column)
│               ├── DisplayCell (view mode)
│               └── EditCell (edit mode)
│                   ├── TextEditor
│                   ├── NumberEditor
│                   ├── DateEditor
│                   ├── TimeEditor
│                   ├── BooleanEditor
│                   └── ListEditor
└── ActionCell (for action columns)
```

### Component Responsibilities

- **SpreadSheetTable**: Store生成、キーボードイベント管理、クリップボードイベント管理
- **HeaderRow / HeaderCell**: ソートクリック、フィルタUI、列幅
- **VirtualScrollContainer**: 仮想スクロール（表示範囲計算、バッファ管理）
- **TableRow**: 行レベルのレンダリング最適化
- **Cell**: `useSyncExternalStore`でセルデータ購読、表示/編集モード切替
- **Editor系**: 型別の入力UI（TextInput, NumberInput, DatePicker, TimePicker, Checkbox, Select）

## Virtual Scroll Strategy

### Fixed Row Height

行の高さを`--sst-cell-height`で固定し、計算を単純化する。

```
totalHeight = rowCount * rowHeight
visibleStart = Math.floor(scrollTop / rowHeight)
visibleEnd = Math.ceil((scrollTop + containerHeight) / rowHeight)
bufferStart = Math.max(0, visibleStart - BUFFER_SIZE)
bufferEnd = Math.min(rowCount, visibleEnd + BUFFER_SIZE)
```

### DOM Structure

```html
<div class="scrollContainer" style="height: containerHeight; overflow-y: auto">
  <div class="spacer" style="height: totalHeight">
    <div class="visibleRows" style="transform: translateY(offsetTop)">
      <!-- only visible + buffer rows -->
    </div>
  </div>
</div>
```

## CSS Modules Structure

```
src/styles/
├── theme.css           # CSS Custom Properties defaults (existing)
├── table.module.css    # SpreadSheetTable
├── header.module.css   # HeaderRow, HeaderCell
├── cell.module.css     # Cell, DisplayCell, EditCell
├── editor.module.css   # Editor components
├── selection.module.css # Selection overlay
├── filter.module.css   # Filter popover
└── scroll.module.css   # Virtual scroll container
```

各CSS Moduleファイルでは `var(--sst-*)` を参照し、テーマ変数をカスタマイズ可能にする。

## Keyboard Navigation Map

| Key | Context | Action |
|-----|---------|--------|
| Arrow Keys | View mode | Move active cell |
| Arrow Keys | Edit mode | Cursor within editor |
| Tab | View/Edit | Confirm & move right (skip action cols) |
| Shift+Tab | View/Edit | Confirm & move left (skip action cols) |
| Enter | View mode | Start editing |
| Enter | Edit mode | Confirm & move down |
| Escape | Edit mode | Cancel editing |
| Double-click | View mode | Start editing |
| Shift+Arrow | View mode | Extend selection range |
| Shift+Click | View mode | Set selection range end |
| Ctrl/Cmd+C | View mode | Copy selection |
| Ctrl/Cmd+V | View mode | Paste from clipboard |
| Ctrl/Cmd+X | View mode | Cut selection |
| Direct typing | View mode | Start editing with typed character |

## Validation Pipeline

```
Cell Value Change
  → Built-in validation (required, min/max, pattern, etc.)
  → Custom validate function
  → ValidationResult | null
  → Update cell visual state
  → Notify onValidationError callback
```

バリデーションは同期的に実行し、結果をストアに保持する。`getValidationErrors()` と `isValid()` はストアから直接取得する。

## File Organization (Target)

```
packages/core/src/
├── core/
│   ├── types/          # (existing) 型定義
│   ├── store/
│   │   ├── create-store.ts
│   │   ├── data-slice.ts
│   │   ├── selection-slice.ts
│   │   ├── sort-slice.ts
│   │   ├── filter-slice.ts
│   │   └── edit-slice.ts
│   ├── selection/
│   │   └── selection-utils.ts
│   ├── sort/
│   │   └── sort-utils.ts
│   ├── filter/
│   │   └── filter-utils.ts
│   ├── clipboard/
│   │   └── clipboard-utils.ts
│   └── validation/
│       └── validation-utils.ts
├── components/
│   ├── SpreadSheetTable.tsx
│   ├── HeaderRow.tsx
│   ├── HeaderCell.tsx
│   ├── TableBody.tsx
│   ├── TableRow.tsx
│   ├── Cell.tsx
│   ├── ActionCell.tsx
│   ├── SortIndicator.tsx
│   ├── FilterPopover.tsx
│   └── editors/
│       ├── TextEditor.tsx
│       ├── NumberEditor.tsx
│       ├── DateEditor.tsx
│       ├── TimeEditor.tsx
│       ├── BooleanEditor.tsx
│       └── ListEditor.tsx
├── hooks/
│   ├── use-spread-sheet-table.ts
│   ├── use-cell-value.ts
│   ├── use-selection.ts
│   ├── use-virtual-scroll.ts
│   └── use-keyboard-navigation.ts
├── styles/
│   ├── theme.css           # (existing) CSS変数デフォルト
│   ├── table.module.css
│   ├── header.module.css
│   ├── cell.module.css
│   ├── editor.module.css
│   ├── selection.module.css
│   ├── filter.module.css
│   └── scroll.module.css
└── index.ts               # (existing) パブリックAPI
```
