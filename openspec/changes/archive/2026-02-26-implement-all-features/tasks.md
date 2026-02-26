## 1. Store Foundation

- [x] 1.1 DataSlice: セルデータ管理、ダーティ追跡、変更通知 (`core/store/data-slice.ts`)
- [x] 1.2 SelectionSlice: アクティブセル、選択範囲管理 (`core/store/selection-slice.ts`)
- [x] 1.3 SortSlice: ソート状態管理 (`core/store/sort-slice.ts`)
- [x] 1.4 FilterSlice: フィルタ状態管理 (`core/store/filter-slice.ts`)
- [x] 1.5 EditSlice: 編集モード状態管理 (`core/store/edit-slice.ts`)
- [x] 1.6 createStore: スライス統合、subscribe/getSnapshot API (`core/store/create-store.ts`)
- [x] 1.7 Store unit tests: 全スライスの動作検証

## 2. Sort / Filter Logic

- [x] 2.1 sort-utils: ソートロジック（型別比較、null handling） (`core/sort/sort-utils.ts`)
- [x] 2.2 filter-utils: フィルタロジック（eq, contains, range, in） (`core/filter/filter-utils.ts`)
- [x] 2.3 derived-rows: ソート・フィルタ適用後の行インデックス算出とメモ化
- [x] 2.4 Sort / Filter unit tests

## 3. Validation Engine

- [x] 3.1 validation-utils: 組み込みバリデーション（required, min/max, maxLength, pattern, date/time range） (`core/validation/validation-utils.ts`)
- [x] 3.2 Custom validate統合: 列定義のvalidate関数呼び出し
- [x] 3.3 Validation API: getValidationErrors(), isValid(), onValidationError
- [x] 3.4 Validation unit tests

## 4. useSpreadSheetTable Hook

- [x] 4.1 useSpreadSheetTable: Store生成、TableInstance返却 (`hooks/use-spread-sheet-table.ts`)
- [x] 4.2 useCellValue: セル単位購読フック（Store経由で直接購読）
- [x] 4.3 useSelection: 選択状態購読フック（Store経由で直接購読）
- [x] 4.4 Hook unit tests (React Testing Library)

## 5. Basic Table Rendering

- [x] 5.1 SpreadSheetTable component: テーブル外枠、Store Provider (`components/SpreadSheetTable.tsx`)
- [x] 5.2 HeaderRow / HeaderCell: 列ヘッダー表示 (`components/HeaderRow.tsx`, `components/HeaderCell.tsx`)
- [x] 5.3 TableBody / TableRow / Cell: 行・セル表示（表示モード） (`components/TableRow.tsx`, `components/Cell.tsx`)
- [x] 5.4 ActionCell: アクション列レンダリング (`components/ActionCell.tsx`)
- [x] 5.5 CSS Modules: table, header, cell のスタイル定義
- [x] 5.6 Basic rendering tests

## 6. Selection

- [x] 6.1 selection-utils: 選択範囲計算、action列スキップ (`core/selection/selection-utils.ts`)
- [x] 6.2 Click / Shift+Click / Drag による選択操作
- [x] 6.3 Selection visual feedback: CSS Modules (`styles/cell.module.css`)
- [x] 6.4 Selection tests

## 7. Cell Editing

- [x] 7.1 Type-specific editors: TextEditor, NumberEditor, DateEditor, TimeEditor, BooleanEditor, ListEditor (`components/editors/`)
- [x] 7.2 EditCell: 編集モード切替、エディタ表示
- [x] 7.3 Edit mode activation: ダブルクリック / Enter / Direct input
- [x] 7.4 Edit mode deactivation: Escape (cancel), Enter/Tab (confirm)
- [x] 7.5 Editor CSS Modules (`styles/editor.module.css`)
- [x] 7.6 Cell editing tests

## 8. Keyboard Navigation

- [x] 8.1 useKeyboardNavigation: Arrow keys, Tab/Shift+Tab, Enter/Escape (`SpreadSheetTable.tsx` handleKeyDown)
- [x] 8.2 Action列スキップ、行端ラップ
- [x] 8.3 Shift+Arrow で選択範囲拡張
- [x] 8.4 Keyboard navigation tests

## 9. Sort UI

- [x] 9.1 SortIndicator component (`components/SortIndicator.tsx`)
- [x] 9.2 HeaderCell: ソートクリックハンドラ（asc → desc → clear サイクル）
- [x] 9.3 sortable option: グローバル / per-column 切替
- [x] 9.4 onSort callback: サーバーサイドソート対応
- [x] 9.5 Sort integration tests

## 10. Filter UI

- [x] 10.1 FilterPopover component: 型別フィルタUI (`components/FilterPopover.tsx`)
- [x] 10.2 HeaderCell: フィルタアイコン / ポップオーバー表示
- [x] 10.3 filterable option: グローバル / per-column 切替
- [x] 10.4 onFilter callback: サーバーサイドフィルタ対応
- [x] 10.5 Filter CSS Modules (`styles/filter.module.css`)
- [x] 10.6 Filter integration tests

## 11. Clipboard

- [x] 11.1 clipboard-utils: TSV serialize / deserialize (`core/clipboard/clipboard-utils.ts`)
- [x] 11.2 Copy: Ctrl/Cmd+C、選択範囲をTSVでクリップボードへ
- [x] 11.3 Paste: Ctrl/Cmd+V、TSVからセル値へ（型変換、readOnly/action列スキップ）
- [x] 11.4 Cut: Ctrl/Cmd+X、コピー後にセル値クリア
- [x] 11.5 onChange notification: ペースト/カット時の一括変更通知
- [x] 11.6 Clipboard unit tests

## 12. Validation Visual Feedback

- [x] 12.1 Cell component: バリデーション状態に応じたCSS class適用
- [x] 12.2 Validation tooltip: ホバー/フォーカスでエラーメッセージ表示
- [x] 12.3 Validation visual tests

## 13. Virtual Scroll

- [x] 13.1 useVirtualScroll hook: 表示範囲計算、バッファ管理 (`hooks/use-virtual-scroll.ts`)
- [x] 13.2 VirtualScrollContainer: spacer + visible rows transform
- [x] 13.3 Scroll CSS Modules (`styles/scroll.module.css`)
- [x] 13.4 React.memo最適化: Cell, TableRow のメモ化
- [x] 13.5 Virtual scroll tests（10,000行でのDOM数検証）

## 14. Public API Export

- [x] 14.1 index.ts更新: コンポーネント、フック、ユーティリティのエクスポート
- [x] 14.2 型のre-export整理

## 15. Playground Demo

- [x] 15.1 BasicDemo: 基本テーブル（全列型 + アクション列）
- [x] 15.2 EditingDemo: セル編集・バリデーションのデモ
- [x] 15.3 VirtualScrollDemo: 10,000行仮想スクロールのデモ
- [x] 15.4 ページルーティング / ナビゲーション

## 16. E2E Tests

- [x] 16.1 Basic rendering: テーブル表示、全列型確認
- [x] 16.2 Cell editing: ダブルクリック編集、Enter
- [x] 16.3 Keyboard navigation: Arrow keys
- [x] 16.4 Sort: ヘッダークリックでのソート
- [x] 16.5 Boolean toggle: チェックボックス切替
- [x] 16.6 Validation: エラー表示
- [x] 16.7 Navigation: デモページ切替

## 17. Validation

- [x] 17.1 openspec validate --strict --no-interactive
- [x] 17.2 pnpm test（全ユニットテスト通過: 90 tests）
- [x] 17.3 TypeScript typecheck（core + playground通過）
- [x] 17.4 biome check（lint/format通過、エラーゼロ）
- [x] 17.5 Vite build（playground production build通過）
