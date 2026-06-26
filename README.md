# @heynow-jp/react-spread-sheet-table

A spreadsheet-style table component for React with inline editing, sorting, filtering, and more.

[Live Demo](https://hey-now-jp.github.io/react-spread-sheet-table/)

> **Note:** This library was originally built for internal use at [Hey Now Inc.](https://hey-now.jp/) and may reflect opinionated design choices. We've open-sourced it in case others find it useful, but feature requests outside our use cases may not be prioritized. Contributions and forks are welcome.

> The demo site and built-in UI labels (column menus, tooltips, etc.) are currently in **Japanese only**. Internationalization support is planned for a future release.

## Install

```bash
npm install @heynow-jp/react-spread-sheet-table
# or
pnpm add @heynow-jp/react-spread-sheet-table
```

Import the stylesheet in your app entry point:

```ts
import '@heynow-jp/react-spread-sheet-table/styles.css'
```

| Framework | Where to import |
|-----------|----------------|
| Next.js (App Router) | `src/app/layout.tsx` |
| Next.js (Pages Router) | `src/pages/_app.tsx` |
| Vite | `src/main.tsx` |

## Quick Start

```tsx
import {
  SpreadSheetTable,
  useSpreadSheetTable,
  type ColumnDef,
} from '@heynow-jp/react-spread-sheet-table'

type Row = { id: string; name: string; age: number }

const columns: ColumnDef<Row>[] = [
  { type: 'text', key: 'name', header: 'Name', width: 200 },
  { type: 'number', key: 'age', header: 'Age', width: 100, min: 0, max: 150 },
]

function App() {
  const table = useSpreadSheetTable({
    columns,
    initialData: [{ id: '1', name: 'Alice', age: 30 }],
    rowKey: 'id',
  })

  return <SpreadSheetTable table={table} height={400} />
}
```

## Features

- **Column types** - text, number, date, time, boolean, list, multiList, and custom action columns
- **Inline editing** - double-click or type to edit; Enter to confirm, Escape to cancel
- **Keyboard navigation** - arrow keys, Tab, Shift+Tab, Cmd/Ctrl+Arrow for jump
- **Selection** - click, Shift+click, drag, and Shift+Arrow for range selection
- **Clipboard** - Ctrl+C / Ctrl+V with multi-cell support
- **Sorting & filtering** - column menu with ascending/descending sort and multiple filter operators (eq, contains, range, in)
- **Validation** - built-in constraints (min/max, pattern, required) and custom validation functions
- **Virtual scroll** - handles 10,000+ rows
- **Undo / Redo** - Ctrl+Z / Ctrl+Y with operation-based history (up to 25 entries)
- **Row reordering** - drag-and-drop via row handles
- **Frozen columns** - pin columns to the left
- **Theming** - CSS custom properties for full visual customization
- **React 18 & 19** compatible

## Column Types

| Type | Value | Editor |
|------|-------|--------|
| `text` | `string` | `<input type="text">` |
| `number` | `number` | `<input type="number">` |
| `date` | `string` (YYYY-MM-DD) | `<input type="date">` |
| `time` | `string` (HH:MM) | `<input type="time">` |
| `boolean` | `boolean` | `<input type="checkbox">` |
| `list` | `string` | `<select>` |
| `multiList` | `string[]` | checkbox group |
| `action` | - | custom render function |

## API

### `useSpreadSheetTable(options)`

Returns a `TableInstance<T>` to pass to `<SpreadSheetTable>`.

```ts
const table = useSpreadSheetTable<Row>({
  columns,           // ColumnDef<Row>[] - column definitions
  initialData,       // Row[] - initial row data
  rowKey,            // keyof Row - unique identifier field
  onChange,          // (changes: ChangeInfo<Row>[]) => void
  onReorder,         // (newData: Row[]) => void
  validate,          // (row: Row, key: string, value: unknown) => ValidationResult | undefined
  frozenColumns,     // number - columns to freeze from the left
  reorderable,       // boolean - enable row drag-and-drop
})
```

### `<SpreadSheetTable>`

```tsx
<SpreadSheetTable
  table={table}       // TableInstance from useSpreadSheetTable
  height={500}        // number - container height in px (omit for auto height)
  autoWidth={false}    // boolean - shrink table width to fit columns
  cellMeta={cellMeta}  // Record<string, Record<string, CellMeta>> - per-cell metadata
/>
```

## Requirements

- React >= 18.0.0
- React DOM >= 18.0.0

## Contributing

```bash
git clone https://github.com/hey-now-jp/react-spread-sheet-table.git
cd react-spread-sheet-table
pnpm install
pnpm dev          # start docs dev server
```

### Project Structure

```
packages/core/    main library
apps/docs/        documentation & demo (Astro + Starlight)
```

### Scripts

```bash
pnpm dev          # docs dev server
pnpm build        # build library
pnpm test         # unit tests (Vitest)
pnpm test:e2e     # E2E tests (Playwright)
pnpm typecheck    # TypeScript check
pnpm lint         # lint (Biome)
pnpm lint:fix     # lint with auto-fix
```

## License

[MIT](./LICENSE)
