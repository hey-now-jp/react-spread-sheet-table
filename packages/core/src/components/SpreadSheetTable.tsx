import { memo, useCallback, useMemo, useRef, useSyncExternalStore } from 'react'
import { deserializeTsv, serializeToTsv } from '../core/clipboard/clipboard-utils'
import {
  getNormalizedRange,
  moveActiveCell,
  tabToNextCell,
} from '../core/selection/selection-utils'
import type { TableStore } from '../core/store/create-store'
import type { DataColumnDef } from '../core/types/column'
import { isActionColumn, isDataColumn } from '../core/types/column'
import type { CellPosition } from '../core/types/selection'
import type { TableInstance } from '../core/types/table'
import { useVirtualScroll } from '../hooks/use-virtual-scroll'
import scrollStyles from '../styles/scroll.module.css'
import tableStyles from '../styles/table.module.css'
import { HeaderRow } from './HeaderRow'
import { TableRow } from './TableRow'

type SpreadSheetTableComponentProps<T> = {
  readonly table: TableInstance<T>
  readonly readOnly?: boolean
  readonly height?: number
}

const DEFAULT_HEIGHT = 400
const ROW_HEIGHT = 32

function SpreadSheetTableInner<T>({
  table,
  readOnly = false,
  height = DEFAULT_HEIGHT,
}: SpreadSheetTableComponentProps<T>) {
  const store = (table as TableInstance<T> & { __store: TableStore<T> }).__store
  const handleCellChange = (
    table as TableInstance<T> & {
      __handleCellChange: (rowIndex: number, columnKey: keyof T, value: T[keyof T]) => void
    }
  ).__handleCellChange

  const wrapperRef = useRef<HTMLDivElement>(null)

  // Subscribe to store
  useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot)

  const columns = store.getColumns()
  const sortedFilteredIndices = store.getSortedFilteredIndices()

  const virtualScroll = useVirtualScroll(sortedFilteredIndices.length, ROW_HEIGHT, height)

  const visibleIndices = useMemo(
    () => sortedFilteredIndices.slice(virtualScroll.visibleStart, virtualScroll.visibleEnd),
    [sortedFilteredIndices, virtualScroll.visibleStart, virtualScroll.visibleEnd],
  )

  const sortable = true
  const filterable = true

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const selection = store.getSelection()
      const editingCell = store.getEditingCell()

      // Clipboard shortcuts
      if ((e.ctrlKey || e.metaKey) && !editingCell) {
        if (e.key === 'c' || e.key === 'C') {
          handleCopy(store)
          e.preventDefault()
          return
        }
        if (e.key === 'v' || e.key === 'V') {
          handlePaste(store, columns, readOnly, handleCellChange)
          e.preventDefault()
          return
        }
        if (e.key === 'x' || e.key === 'X') {
          handleCut(store, columns, readOnly, handleCellChange)
          e.preventDefault()
          return
        }
      }

      // If editing, don't handle navigation (editors handle their own keys)
      if (editingCell !== null) return

      if (selection.activeCell === null) return

      const rowCount = sortedFilteredIndices.length

      switch (e.key) {
        case 'ArrowUp':
        case 'ArrowDown':
        case 'ArrowLeft':
        case 'ArrowRight': {
          e.preventDefault()
          const direction = e.key.replace('Arrow', '').toLowerCase() as
            | 'up'
            | 'down'
            | 'left'
            | 'right'
          if (e.shiftKey) {
            const range = selection.range
            const endPos = range ? range.end : selection.activeCell
            const newEnd = moveActiveCell(columns, endPos, direction, rowCount)
            if (newEnd) store.extendSelection(newEnd)
          } else {
            const newPos = moveActiveCell(columns, selection.activeCell, direction, rowCount)
            if (newPos) store.setActiveCell(newPos)
          }
          break
        }
        case 'Tab': {
          e.preventDefault()
          const next = tabToNextCell(columns, selection.activeCell, rowCount, e.shiftKey)
          if (next) store.setActiveCell(next)
          break
        }
        case 'Enter': {
          e.preventDefault()
          const activeCol = columns[selection.activeCell.colIndex]
          if (activeCol && isDataColumn(activeCol) && !readOnly && !activeCol.readOnly) {
            const value = store.getCellValue(
              selection.activeCell.rowIndex,
              (activeCol as DataColumnDef<T>).key as keyof T,
            )
            store.startEditing(selection.activeCell, String(value ?? ''))
          }
          break
        }
        case 'Escape': {
          store.clearSelection()
          break
        }
        case 'Delete':
        case 'Backspace': {
          if (!readOnly) {
            clearSelectedCells(store, columns, handleCellChange)
          }
          e.preventDefault()
          break
        }
        default: {
          // Direct input: start editing with typed character
          if (!readOnly && !e.ctrlKey && !e.metaKey && !e.altKey && e.key.length === 1) {
            const activeCol = columns[selection.activeCell.colIndex]
            if (activeCol && isDataColumn(activeCol) && !activeCol.readOnly) {
              store.startEditing(selection.activeCell, e.key)
            }
          }
          break
        }
      }
    },
    [store, columns, sortedFilteredIndices.length, readOnly, handleCellChange],
  )

  // Mouse drag selection
  const isDragging = useRef(false)

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return
    isDragging.current = true
  }, [])

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging.current) return
      const target = e.target as HTMLElement
      const cell = target.closest('[data-row][data-col]') as HTMLElement | null
      if (!cell) return
      const rowIndex = Number(cell.dataset.row)
      const colIndex = Number(cell.dataset.col)
      if (Number.isNaN(rowIndex) || Number.isNaN(colIndex)) return
      store.extendSelection({ rowIndex, colIndex })
    },
    [store],
  )

  const handleMouseUp = useCallback(() => {
    isDragging.current = false
  }, [])

  return (
    <div
      ref={wrapperRef}
      className={tableStyles.wrapper}
      onKeyDown={handleKeyDown}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      tabIndex={0}
    >
      <HeaderRow columns={columns} store={store} sortable={sortable} filterable={filterable} />
      <div
        ref={virtualScroll.containerRef}
        className={scrollStyles.scrollContainer}
        style={{ height }}
      >
        <div className={scrollStyles.spacer} style={{ height: virtualScroll.totalHeight }}>
          <div
            className={scrollStyles.visibleRows}
            style={{ transform: `translateY(${virtualScroll.offsetTop}px)` }}
          >
            {visibleIndices.map((dataRowIndex, displayOffset) => (
              <TableRow
                key={dataRowIndex}
                columns={columns}
                dataRowIndex={dataRowIndex}
                displayRowIndex={virtualScroll.visibleStart + displayOffset}
                store={store}
                readOnly={readOnly}
                onCellChange={handleCellChange}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function handleCopy<T>(store: TableStore<T>): void {
  const selection = store.getSelection()
  const columns = store.getColumns()

  if (selection.activeCell === null) return

  const rows = store.getRows()
  const data: unknown[][] = []

  if (selection.range) {
    const { minRow, maxRow, minCol, maxCol } = getNormalizedRange(selection.range)
    for (let r = minRow; r <= maxRow; r++) {
      const rowData: unknown[] = []
      for (let c = minCol; c <= maxCol; c++) {
        const col = columns[c]
        if (col && isDataColumn(col)) {
          rowData.push(rows[r][(col as DataColumnDef<T>).key as keyof T])
        }
      }
      data.push(rowData)
    }
  } else {
    const col = columns[selection.activeCell.colIndex]
    if (col && isDataColumn(col)) {
      const value = rows[selection.activeCell.rowIndex][(col as DataColumnDef<T>).key as keyof T]
      data.push([value])
    }
  }

  const tsv = serializeToTsv(data)
  navigator.clipboard.writeText(tsv)
}

function handlePaste<T>(
  store: TableStore<T>,
  columns: ReadonlyArray<import('../core/types/column').ColumnDef<T>>,
  readOnlyTable: boolean,
  onCellChange: (rowIndex: number, columnKey: keyof T, value: T[keyof T]) => void,
): void {
  if (readOnlyTable) return

  const selection = store.getSelection()
  if (selection.activeCell === null) return

  navigator.clipboard.readText().then((text) => {
    const parsed = deserializeTsv(text)
    if (parsed.length === 0) return

    const startRow = selection.activeCell!.rowIndex
    const startCol = selection.activeCell!.colIndex
    const rows = store.getRows()

    for (let r = 0; r < parsed.length; r++) {
      const dataRowIndex = startRow + r
      if (dataRowIndex >= rows.length) break

      let colOffset = 0
      for (let c = 0; c < parsed[r].length; c++) {
        let targetCol = startCol + colOffset
        // Skip action columns
        while (targetCol < columns.length && isActionColumn(columns[targetCol])) {
          colOffset++
          targetCol = startCol + colOffset
        }
        if (targetCol >= columns.length) break

        const col = columns[targetCol]
        if (col && isDataColumn(col) && !col.readOnly) {
          const pastedValue = parsed[r][c]
          const key = (col as DataColumnDef<T>).key as keyof T
          onCellChange(dataRowIndex, key, pastedValue as T[keyof T])
        }
        colOffset++
      }
    }
  })
}

function handleCut<T>(
  store: TableStore<T>,
  columns: ReadonlyArray<import('../core/types/column').ColumnDef<T>>,
  readOnlyTable: boolean,
  onCellChange: (rowIndex: number, columnKey: keyof T, value: T[keyof T]) => void,
): void {
  handleCopy(store)
  if (!readOnlyTable) {
    clearSelectedCells(store, columns, onCellChange)
  }
}

function clearSelectedCells<T>(
  store: TableStore<T>,
  columns: ReadonlyArray<import('../core/types/column').ColumnDef<T>>,
  onCellChange: (rowIndex: number, columnKey: keyof T, value: T[keyof T]) => void,
): void {
  const selection = store.getSelection()
  if (selection.activeCell === null) return

  if (selection.range) {
    const { minRow, maxRow, minCol, maxCol } = getNormalizedRange(selection.range)
    for (let r = minRow; r <= maxRow; r++) {
      for (let c = minCol; c <= maxCol; c++) {
        const col = columns[c]
        if (col && isDataColumn(col) && !col.readOnly) {
          onCellChange(r, (col as DataColumnDef<T>).key as keyof T, '' as T[keyof T])
        }
      }
    }
  } else {
    const col = columns[selection.activeCell.colIndex]
    if (col && isDataColumn(col) && !col.readOnly) {
      onCellChange(
        selection.activeCell.rowIndex,
        (col as DataColumnDef<T>).key as keyof T,
        '' as T[keyof T],
      )
    }
  }
}

export const SpreadSheetTable = memo(SpreadSheetTableInner) as typeof SpreadSheetTableInner
