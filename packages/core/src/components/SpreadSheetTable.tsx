import { memo, useCallback, useEffect, useMemo, useRef, useSyncExternalStore } from 'react'
import { deserializeTsv, serializeToTsv } from '../core/clipboard/clipboard-utils'
import { parseAndValidateValue } from '../core/format/format-utils'
import {
  getNormalizedRange,
  moveActiveCell,
  tabToNextCell,
} from '../core/selection/selection-utils'
import type { TableStore } from '../core/store/create-store'
import type { CellPosition, DataColumnDef, SelectionRange, TableInstance } from '../core/types'
import { isActionColumn, isDataColumn } from '../core/types'
import { useVirtualScroll } from '../hooks/use-virtual-scroll'
import scrollStyles from '../styles/scroll.module.css'
import tableStyles from '../styles/table.module.css'
import { HeaderRow } from './HeaderRow'
import { TableRow } from './TableRow'
import { Toast } from './Toast'

type SpreadSheetTableComponentProps<T> = {
  readonly table: TableInstance<T>
  readonly readOnly?: boolean
  readonly height?: number
}

const DEFAULT_HEIGHT = 400
const ROW_HEIGHT = 32

function scrollRowIntoView(
  containerRef: React.RefObject<HTMLDivElement | null>,
  visualIndex: number,
  rowHeight: number,
  containerHeight: number,
): void {
  const container = containerRef.current
  if (!container) return
  const rowTop = visualIndex * rowHeight
  const rowBottom = rowTop + rowHeight
  if (rowTop < container.scrollTop) {
    container.scrollTop = rowTop
  } else if (rowBottom > container.scrollTop + containerHeight) {
    container.scrollTop = rowBottom - containerHeight
  }
}

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

  // Refocus wrapper when editing ends so keyboard navigation keeps working
  const editingCell = store.getEditingCell()
  const wasEditing = useRef(false)
  useEffect(() => {
    if (wasEditing.current && editingCell === null) {
      const active = document.activeElement
      if (active === document.body || wrapperRef.current?.contains(active)) {
        wrapperRef.current?.focus()
      }
    }
    wasEditing.current = editingCell !== null
  }, [editingCell])

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
          if (direction === 'up' || direction === 'down') {
            const currentPos = e.shiftKey
              ? selection.range
                ? selection.range.end
                : selection.activeCell
              : selection.activeCell
            const visualIndex = sortedFilteredIndices.indexOf(currentPos.rowIndex)
            if (visualIndex === -1) break
            const newVisualIndex = direction === 'up' ? visualIndex - 1 : visualIndex + 1
            if (newVisualIndex < 0 || newVisualIndex >= sortedFilteredIndices.length) break
            const newPos = {
              rowIndex: sortedFilteredIndices[newVisualIndex],
              colIndex: currentPos.colIndex,
            }
            if (e.shiftKey) {
              store.extendSelection(newPos)
            } else {
              store.setActiveCell(newPos)
            }
            scrollRowIntoView(virtualScroll.containerRef, newVisualIndex, ROW_HEIGHT, height)
          } else {
            const rowCount = sortedFilteredIndices.length
            if (e.shiftKey) {
              const range = selection.range
              const endPos = range ? range.end : selection.activeCell
              const newEnd = moveActiveCell(columns, endPos, direction, rowCount)
              if (newEnd) store.extendSelection(newEnd)
            } else {
              const newPos = moveActiveCell(columns, selection.activeCell, direction, rowCount)
              if (newPos) store.setActiveCell(newPos)
            }
          }
          break
        }
        case 'Tab': {
          e.preventDefault()
          const currentVisual = sortedFilteredIndices.indexOf(selection.activeCell.rowIndex)
          if (currentVisual === -1) break
          const next = tabToNextCell(
            columns,
            { rowIndex: currentVisual, colIndex: selection.activeCell.colIndex },
            sortedFilteredIndices.length,
            e.shiftKey,
          )
          if (next) {
            store.setActiveCell({
              rowIndex: sortedFilteredIndices[next.rowIndex],
              colIndex: next.colIndex,
            })
            scrollRowIntoView(virtualScroll.containerRef, next.rowIndex, ROW_HEIGHT, height)
          }
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
          if (store.getClipboardRange()) {
            store.clearClipboardRange()
          } else {
            store.clearSelection()
          }
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
          // Prevent space from scrolling the page
          if (e.key === ' ') {
            e.preventDefault()
          }
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
    [
      store,
      columns,
      sortedFilteredIndices,
      readOnly,
      handleCellChange,
      height,
      virtualScroll.containerRef,
    ],
  )

  // Mouse drag selection
  const isDragging = useRef(false)
  const didDrag = useRef(false)
  const dragOrigin = useRef<CellPosition | null>(null)

  const findCellPosition = useCallback((e: React.MouseEvent): CellPosition | null => {
    const target = e.target as HTMLElement
    const cell = target.closest('[data-row][data-col]') as HTMLElement | null
    if (!cell) return null
    const rowIndex = Number(cell.dataset.row)
    const colIndex = Number(cell.dataset.col)
    if (Number.isNaN(rowIndex) || Number.isNaN(colIndex)) return null
    return { rowIndex, colIndex }
  }, [])

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return
      const pos = findCellPosition(e)
      if (!pos) return
      isDragging.current = true
      didDrag.current = false
      dragOrigin.current = pos
      if (!e.shiftKey) {
        store.setActiveCell(pos)
      } else {
        store.extendSelection(pos)
      }
      // Keep focus on wrapper so keyboard navigation works,
      // but not when clicking interactive elements (checkbox, button, etc.)
      const target = e.target as HTMLElement
      if (!target.closest('input, button, select, textarea, a')) {
        wrapperRef.current?.focus()
      }
    },
    [store, findCellPosition],
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging.current) return
      const pos = findCellPosition(e)
      if (!pos) return
      if (
        dragOrigin.current &&
        (pos.rowIndex !== dragOrigin.current.rowIndex ||
          pos.colIndex !== dragOrigin.current.colIndex)
      ) {
        didDrag.current = true
      }
      if (didDrag.current) {
        store.extendSelection(pos)
      }
    },
    [store, findCellPosition],
  )

  const handleMouseUp = useCallback(() => {
    isDragging.current = false
    dragOrigin.current = null
  }, [])

  const handleBlur = useCallback(
    (e: React.FocusEvent) => {
      if (wrapperRef.current?.contains(e.relatedTarget as Node)) return
      store.clearSelection()
    },
    [store],
  )

  return (
    <div
      ref={wrapperRef}
      className={tableStyles.wrapper}
      onKeyDown={handleKeyDown}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onBlur={handleBlur}
      tabIndex={0}
    >
      <Toast store={store} />
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

  const clipRange: SelectionRange = selection.range ?? {
    start: selection.activeCell,
    end: selection.activeCell,
  }

  const { minRow, maxRow, minCol, maxCol } = getNormalizedRange(clipRange)
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

  const tsv = serializeToTsv(data)
  navigator.clipboard.writeText(tsv)

  store.setClipboardRange(clipRange)
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

  const activeCell = selection.activeCell

  navigator.clipboard
    .readText()
    .then((text) => {
      const parsed = deserializeTsv(text)
      if (parsed.length === 0) return

      const startRow = activeCell.rowIndex
      const startCol = activeCell.colIndex
      const rows = store.getRows()

      let maxPastedRow = startRow
      let maxPastedCol = startCol
      const formatErrors: string[] = []

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
            const dataCol = col as DataColumnDef<T>
            const pastedValue = parsed[r][c]
            const result = parseAndValidateValue(pastedValue, dataCol)
            if (result.ok) {
              onCellChange(dataRowIndex, dataCol.key as keyof T, result.value as T[keyof T])
            } else {
              formatErrors.push(`Row ${dataRowIndex + 1} "${dataCol.header}": ${result.message}`)
            }
          }

          maxPastedRow = Math.max(maxPastedRow, dataRowIndex)
          maxPastedCol = Math.max(maxPastedCol, targetCol)
          colOffset++
        }
      }

      // Select the pasted range for visual feedback
      store.setActiveCell({ rowIndex: startRow, colIndex: startCol })
      if (maxPastedRow !== startRow || maxPastedCol !== startCol) {
        store.extendSelection({ rowIndex: maxPastedRow, colIndex: maxPastedCol })
      }

      // Clear clipboard marching ants
      store.clearClipboardRange()

      // Show format errors as toast
      if (formatErrors.length > 0) {
        store.showToast(formatErrors)
      }
    })
    .catch(() => {
      // Clipboard read can fail (permission denied, non-HTTPS, etc.)
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
