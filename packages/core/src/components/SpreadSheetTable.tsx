import { RestrictToVerticalAxis } from '@dnd-kit/abstract/modifiers'
import { PointerActivationConstraints } from '@dnd-kit/dom'
import type { DragEndEvent } from '@dnd-kit/react'
import { DragDropProvider, PointerSensor } from '@dnd-kit/react'
import { isSortable } from '@dnd-kit/react/sortable'
import {
  memo,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useSyncExternalStore,
} from 'react'
import type { SpreadSheetTableContextValue } from '../context/SpreadSheetTableContext'
import { SpreadSheetTableContext } from '../context/SpreadSheetTableContext'
import {
  deserializeTsv,
  expandClipboardData,
  serializeToTsv,
} from '../core/clipboard/clipboard-utils'
import { parseAndValidateValue } from '../core/format/format-utils'
import {
  getNormalizedRange,
  moveActiveCell,
  tabToNextCell,
} from '../core/selection/selection-utils'
import type { TableStore } from '../core/store/create-store'
import type {
  CellPosition,
  DataColumnDef,
  SelectionRange,
  TableInstance,
  UseSpreadSheetTableOptions,
} from '../core/types'
import { isActionColumn, isDataColumn } from '../core/types'
import { useVirtualScroll } from '../hooks/use-virtual-scroll'
import dragStyles from '../styles/drag.module.css'
import scrollStyles from '../styles/scroll.module.css'
import tableStyles from '../styles/table.module.css'
import { HeaderRow } from './HeaderRow'
import { RowHeader } from './RowHeader'
import { SortableRow } from './SortableRow'
import { TableRow } from './TableRow'
import { Toast } from './Toast'

type CellMetaFn<T> = (
  row: T,
  columnKey: keyof T,
  rowIndex: number,
) => import('../core/types').CellMeta | undefined

type SpreadSheetTableComponentProps<T> = {
  readonly table: TableInstance<T>
  readonly readOnly?: boolean
  readonly height?: number
  readonly cellMeta?: CellMetaFn<T>
  readonly autoWidth?: boolean
}
const ROW_HEIGHT = 32
const ROW_HEADER_WIDTH = 40

/**
 * Excel-style Cmd+Arrow jump: find the boundary where cell value
 * transitions between empty and non-empty.
 *
 * Rules:
 * 1. Current cell is empty -> jump to the next non-empty cell (or edge)
 * 2. Current cell is non-empty, next cell is non-empty -> jump to last consecutive non-empty cell
 * 3. Current cell is non-empty, next cell is empty -> jump to next non-empty cell (or edge)
 */
function findJumpTarget<T>(
  store: TableStore<T>,
  indices: ReadonlyArray<number>,
  columns: ReadonlyArray<import('../core/types/column').ColumnDef<T>>,
  currentVisualIndex: number,
  colIndex: number,
  direction: 'up' | 'down' | 'left' | 'right',
): { visualIndex: number; colIndex: number } {
  const isVertical = direction === 'up' || direction === 'down'
  const step = direction === 'up' || direction === 'left' ? -1 : 1

  const getCellEmpty = (vIdx: number, cIdx: number): boolean => {
    const col = columns[cIdx]
    if (!col || isActionColumn(col)) return true
    if (!isDataColumn(col)) return true
    const dataCol = col as DataColumnDef<T>
    const rowIndex = isVertical ? indices[vIdx] : indices[currentVisualIndex]
    const val = store.getCellValue(rowIndex, dataCol.key as keyof T)
    if (val === null || val === undefined) return true
    if (typeof val === 'string' && val === '') return true
    if (Array.isArray(val) && val.length === 0) return true
    return false
  }

  if (isVertical) {
    const maxIdx = indices.length - 1
    const currentEmpty = getCellEmpty(currentVisualIndex, colIndex)
    let pos = currentVisualIndex + step

    if (currentEmpty) {
      // Rule 1: skip empty cells, find first non-empty
      while (pos >= 0 && pos <= maxIdx && getCellEmpty(pos, colIndex)) {
        pos += step
      }
      if (pos < 0) pos = 0
      if (pos > maxIdx) pos = maxIdx
    } else {
      // Check next cell
      if (pos < 0 || pos > maxIdx) {
        return { visualIndex: currentVisualIndex, colIndex }
      }
      if (!getCellEmpty(pos, colIndex)) {
        // Rule 2: next is non-empty, find last consecutive non-empty
        while (pos + step >= 0 && pos + step <= maxIdx && !getCellEmpty(pos + step, colIndex)) {
          pos += step
        }
      } else {
        // Rule 3: next is empty, skip to next non-empty
        while (pos >= 0 && pos <= maxIdx && getCellEmpty(pos, colIndex)) {
          pos += step
        }
        if (pos < 0) pos = 0
        if (pos > maxIdx) pos = maxIdx
      }
    }

    return { visualIndex: pos, colIndex }
  }

  // Horizontal
  const maxCol = columns.length - 1
  const currentEmpty = getCellEmpty(currentVisualIndex, colIndex)
  let pos = colIndex + step

  if (pos < 0 || pos > maxCol) {
    return { visualIndex: currentVisualIndex, colIndex }
  }

  if (currentEmpty) {
    // Rule 1: find first non-empty
    while (pos >= 0 && pos <= maxCol && getCellEmpty(currentVisualIndex, pos)) {
      pos += step
    }
    if (pos < 0) pos = 0
    if (pos > maxCol) pos = maxCol
  } else {
    if (!getCellEmpty(currentVisualIndex, pos)) {
      // Rule 2: find last consecutive non-empty
      while (
        pos + step >= 0 &&
        pos + step <= maxCol &&
        !getCellEmpty(currentVisualIndex, pos + step)
      ) {
        pos += step
      }
    } else {
      // Rule 3: skip empty, find next non-empty
      while (pos >= 0 && pos <= maxCol && getCellEmpty(currentVisualIndex, pos)) {
        pos += step
      }
      if (pos < 0) pos = 0
      if (pos > maxCol) pos = maxCol
    }
  }

  return { visualIndex: currentVisualIndex, colIndex: pos }
}

function scrollRowIntoView(
  containerRef: React.RefObject<HTMLDivElement | null>,
  visualIndex: number,
  rowHeight: number,
  containerHeight: number | undefined,
): void {
  if (containerHeight === undefined) return
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
  height,
  cellMeta,
  autoWidth = false,
}: SpreadSheetTableComponentProps<T>) {
  const store = (table as TableInstance<T> & { __store: TableStore<T> }).__store
  const handleCellChange = (
    table as TableInstance<T> & {
      __handleCellChange: (rowIndex: number, columnKey: keyof T, value: T[keyof T]) => void
    }
  ).__handleCellChange
  const onReorder = (
    table as TableInstance<T> & {
      __onReorder: UseSpreadSheetTableOptions<T>['onReorder']
    }
  ).__onReorder

  const clipboardCtx = useContext(SpreadSheetTableContext)

  const wrapperRef = useRef<HTMLDivElement>(null)

  // Subscribe to store
  useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot)

  // Refocus wrapper when editing ends so keyboard navigation keeps working.
  // Portal-based editors (MultiListEditor) leave focus outside the wrapper DOM,
  // so we always refocus unless an unrelated interactive element has focus.
  const editingCell = store.getEditingCell()
  const wasEditing = useRef(false)
  useEffect(() => {
    if (wasEditing.current && editingCell === null) {
      wrapperRef.current?.focus()
    }
    wasEditing.current = editingCell !== null
  }, [editingCell])

  // Clear marching ants when clipboard is overwritten outside the table
  const clipboardRange = store.getClipboardRange()
  useEffect(() => {
    if (clipboardRange === null) return
    const handleDocumentCopy = () => {
      store.clearClipboardRange()
      clipboardCtx?.notifyClipboardClear(store)
    }
    document.addEventListener('copy', handleDocumentCopy)
    document.addEventListener('cut', handleDocumentCopy)
    return () => {
      document.removeEventListener('copy', handleDocumentCopy)
      document.removeEventListener('cut', handleDocumentCopy)
    }
  }, [clipboardRange, store, clipboardCtx])

  const columns = store.getColumns()
  const sortedFilteredIndices = store.getSortedFilteredIndices()

  const virtualScroll = useVirtualScroll(sortedFilteredIndices.length, ROW_HEIGHT, height)

  const visibleIndices = useMemo(
    () => sortedFilteredIndices.slice(virtualScroll.visibleStart, virtualScroll.visibleEnd),
    [sortedFilteredIndices, virtualScroll.visibleStart, virtualScroll.visibleEnd],
  )

  const { sortable, filterable, frozenColumns } = table

  const frozenCount = Math.max(0, Math.min(frozenColumns ?? 0, columns.length))

  // biome-ignore lint/correctness/useExhaustiveDependencies: store.getSnapshot() triggers recalc on column resize
  const frozenLeftOffsets: ReadonlyArray<number> = useMemo(() => {
    if (frozenCount === 0) return []
    const offsets: number[] = []
    let acc = ROW_HEADER_WIDTH
    for (let i = 0; i < frozenCount; i++) {
      offsets.push(acc)
      const col = columns[i]
      acc += store.getColumnWidth(String(col.key)) ?? col.width ?? 150
    }
    return offsets
  }, [frozenCount, columns, store.getColumnWidth, store.getSnapshot()])

  // DnD reorder
  const canReorder =
    table.reorderable && store.getSortState() === null && store.getFilterState().size === 0

  const sensors = useMemo(
    () => [
      PointerSensor.configure({
        activationConstraints: [new PointerActivationConstraints.Distance({ value: 5 })],
      }),
    ],
    [],
  )

  const rowKey = store.getRowKey()
  const rows = store.getRows()

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      if (event.canceled) return
      const { source } = event.operation
      if (!source || !isSortable(source)) return
      const fromVisual = source.initialIndex
      const toVisual = source.index
      if (fromVisual === toVisual) return
      if (
        fromVisual < 0 ||
        toVisual < 0 ||
        fromVisual >= sortedFilteredIndices.length ||
        toVisual >= sortedFilteredIndices.length
      )
        return
      store.reorderRows(sortedFilteredIndices[fromVisual], sortedFilteredIndices[toVisual])
      onReorder?.(store.getRows())
    },
    [store, sortedFilteredIndices, onReorder],
  )

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const selection = store.getSelection()
      const editingCell = store.getEditingCell()

      // Clipboard & undo/redo shortcuts
      if ((e.ctrlKey || e.metaKey) && !editingCell) {
        if (e.key === 'z' || e.key === 'Z') {
          if (e.shiftKey) {
            store.redo()
          } else {
            store.undo()
          }
          e.preventDefault()
          return
        }
        if (e.key === 'y' || e.key === 'Y') {
          store.redo()
          e.preventDefault()
          return
        }
        if (e.key === 'c' || e.key === 'C') {
          handleCopy(store, clipboardCtx)
          e.preventDefault()
          return
        }
        if (e.key === 'v' || e.key === 'V') {
          handlePaste(store, columns, readOnly, handleCellChange)
          e.preventDefault()
          return
        }
        if (e.key === 'x' || e.key === 'X') {
          handleCut(store, columns, readOnly, handleCellChange, clipboardCtx)
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
          const isMeta = e.ctrlKey || e.metaKey

          {
            const currentPos = e.shiftKey
              ? selection.range
                ? selection.range.end
                : selection.activeCell
              : selection.activeCell

            if (isMeta) {
              const visualIndex = sortedFilteredIndices.indexOf(currentPos.rowIndex)
              if (visualIndex === -1) break

              const jump = findJumpTarget(
                store,
                sortedFilteredIndices,
                columns,
                visualIndex,
                currentPos.colIndex,
                direction,
              )
              const newPos = {
                rowIndex: sortedFilteredIndices[jump.visualIndex],
                colIndex: jump.colIndex,
              }
              if (e.shiftKey) {
                store.extendSelection(newPos)
              } else {
                store.setActiveCell(newPos)
              }
              scrollRowIntoView(virtualScroll.containerRef, jump.visualIndex, ROW_HEIGHT, height)
            } else if (direction === 'up' || direction === 'down') {
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
                const newEnd = moveActiveCell(columns, currentPos, direction, rowCount)
                if (newEnd) store.extendSelection(newEnd)
              } else {
                const newPos = moveActiveCell(columns, selection.activeCell, direction, rowCount)
                if (newPos) store.setActiveCell(newPos)
              }
            }
          }
          break
        }
        case 'PageUp':
        case 'PageDown': {
          e.preventDefault()
          const currentPos = e.shiftKey
            ? selection.range
              ? selection.range.end
              : selection.activeCell
            : selection.activeCell
          const visualIndex = sortedFilteredIndices.indexOf(currentPos.rowIndex)
          if (visualIndex === -1) break

          const pageSize = Math.max(
            1,
            Math.floor((height ?? sortedFilteredIndices.length * ROW_HEIGHT) / ROW_HEIGHT) - 1,
          )
          const newVisualIndex =
            e.key === 'PageUp'
              ? Math.max(0, visualIndex - pageSize)
              : Math.min(sortedFilteredIndices.length - 1, visualIndex + pageSize)
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
            const colKey = (activeCol as DataColumnDef<T>).key as keyof T
            if (activeCol.type === 'boolean') {
              const current = store.getCellValue(selection.activeCell.rowIndex, colKey)
              handleCellChange(selection.activeCell.rowIndex, colKey, !current as T[keyof T])
              break
            }
            if (activeCol.type === 'multiList') {
              const current = store.getCellValue(selection.activeCell.rowIndex, colKey)
              const arr = Array.isArray(current) ? current : []
              store.startEditing(selection.activeCell, JSON.stringify(arr))
              break
            }
            const value = store.getCellValue(selection.activeCell.rowIndex, colKey)
            store.startEditing(selection.activeCell, String(value ?? ''))
          }
          break
        }
        case 'Escape': {
          if (store.getClipboardRange()) {
            store.clearClipboardRange()
            clipboardCtx?.notifyClipboardClear(store)
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
          if (e.key === ' ') {
            e.preventDefault()
            if (!readOnly) {
              const activeCol = columns[selection.activeCell.colIndex]
              if (activeCol && isDataColumn(activeCol) && !activeCol.readOnly) {
                const colKey = (activeCol as DataColumnDef<T>).key as keyof T
                if (activeCol.type === 'boolean') {
                  const current = store.getCellValue(selection.activeCell.rowIndex, colKey)
                  handleCellChange(selection.activeCell.rowIndex, colKey, !current as T[keyof T])
                } else if (activeCol.type === 'list') {
                  const value = store.getCellValue(selection.activeCell.rowIndex, colKey)
                  store.startEditing(selection.activeCell, String(value ?? ''))
                } else if (activeCol.type === 'multiList') {
                  const current = store.getCellValue(selection.activeCell.rowIndex, colKey)
                  const arr = Array.isArray(current) ? current : []
                  store.startEditing(selection.activeCell, JSON.stringify(arr))
                }
              }
            }
            break
          }
          // Direct input: start editing with typed character
          if (!readOnly && !e.ctrlKey && !e.metaKey && !e.altKey && e.key.length === 1) {
            const activeCol = columns[selection.activeCell.colIndex]
            if (activeCol && isDataColumn(activeCol) && !activeCol.readOnly) {
              if (
                activeCol.type === 'boolean' ||
                activeCol.type === 'list' ||
                activeCol.type === 'multiList'
              )
                break
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
      clipboardCtx,
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
      // Don't clear selection when focus moves to a portal-based editor
      if (store.getEditingCell() !== null) return
      store.clearSelection()
    },
    [store],
  )

  return (
    <div
      ref={wrapperRef}
      className={`${tableStyles.wrapper}${autoWidth ? ` ${tableStyles.autoWidth}` : ''}`}
      onKeyDown={handleKeyDown}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onBlur={handleBlur}
      tabIndex={0}
    >
      <Toast store={store} />
      <div
        ref={virtualScroll.containerRef}
        className={scrollStyles.scrollContainer}
        style={height !== undefined ? { height } : undefined}
      >
        <HeaderRow
          columns={columns}
          store={store}
          sortable={sortable}
          filterable={filterable}
          reorderable={canReorder}
          resizable={table.resizable}
          frozenLeftOffsets={frozenLeftOffsets}
        />
        <div
          className={height !== undefined ? scrollStyles.spacer : undefined}
          style={height !== undefined ? { height: virtualScroll.totalHeight } : undefined}
        >
          <div
            className={height !== undefined ? scrollStyles.visibleRows : undefined}
            style={
              height !== undefined
                ? { transform: `translateY(${virtualScroll.offsetTop}px)` }
                : undefined
            }
          >
            {canReorder ? (
              <DragDropProvider
                sensors={sensors}
                modifiers={[RestrictToVerticalAxis]}
                onDragEnd={handleDragEnd}
              >
                {visibleIndices.map((dataRowIndex, displayOffset) => (
                  <SortableRow
                    key={String(rows[dataRowIndex][rowKey])}
                    id={String(rows[dataRowIndex][rowKey])}
                    index={virtualScroll.visibleStart + displayOffset}
                    columns={columns}
                    dataRowIndex={dataRowIndex}
                    displayRowIndex={virtualScroll.visibleStart + displayOffset}
                    store={store}
                    readOnly={readOnly}
                    onCellChange={handleCellChange}
                    frozenLeftOffsets={frozenLeftOffsets}
                    cellMeta={cellMeta}
                  />
                ))}
              </DragDropProvider>
            ) : (
              visibleIndices.map((dataRowIndex, displayOffset) => {
                const dispIdx = virtualScroll.visibleStart + displayOffset
                return (
                  <div key={dataRowIndex} className={dragStyles.sortableRow}>
                    <RowHeader
                      displayRowIndex={dispIdx}
                      dataRowIndex={dataRowIndex}
                      colCount={columns.length}
                      store={store}
                      frozen
                    />
                    <TableRow
                      columns={columns}
                      dataRowIndex={dataRowIndex}
                      displayRowIndex={dispIdx}
                      store={store}
                      readOnly={readOnly}
                      onCellChange={handleCellChange}
                      frozenLeftOffsets={frozenLeftOffsets}
                      cellMeta={cellMeta}
                    />
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function handleCopy<T>(store: TableStore<T>, ctx: SpreadSheetTableContextValue | null): void {
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
  ctx?.notifyClipboardCopy(store)
}

function countDataColsInRange<T>(
  columns: ReadonlyArray<import('../core/types/column').ColumnDef<T>>,
  minCol: number,
  maxCol: number,
): number {
  let count = 0
  for (let c = minCol; c <= maxCol; c++) {
    if (!isActionColumn(columns[c])) count++
  }
  return count
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
  const range = selection.range

  navigator.clipboard
    .readText()
    .then((text) => {
      const parsed = deserializeTsv(text)
      if (parsed.length === 0) return

      const rows = store.getRows()

      let startRow: number
      let startCol: number
      let pasteData: string[][]

      if (range) {
        const { minRow, maxRow, minCol, maxCol } = getNormalizedRange(range)
        startRow = minRow
        startCol = minCol
        const targetRows = maxRow - minRow + 1
        const targetDataCols = countDataColsInRange(columns, minCol, maxCol)
        pasteData = expandClipboardData(parsed, targetRows, targetDataCols)
      } else {
        startRow = activeCell.rowIndex
        startCol = activeCell.colIndex
        pasteData = parsed.map((row) => [...row])
      }

      let maxPastedRow = startRow
      let maxPastedCol = startCol
      const formatErrors: string[] = []

      store.beginBatch()
      for (let r = 0; r < pasteData.length; r++) {
        const dataRowIndex = startRow + r
        if (dataRowIndex >= rows.length) break

        let colOffset = 0
        for (let c = 0; c < pasteData[r].length; c++) {
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
            const pastedValue = pasteData[r][c]
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

      store.endBatch()

      // Select the pasted range for visual feedback
      store.setActiveCell({ rowIndex: startRow, colIndex: startCol })
      if (maxPastedRow !== startRow || maxPastedCol !== startCol) {
        store.extendSelection({ rowIndex: maxPastedRow, colIndex: maxPastedCol })
      }

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
  ctx: SpreadSheetTableContextValue | null,
): void {
  handleCopy(store, ctx)
  if (!readOnlyTable) {
    clearSelectedCells(store, columns, onCellChange)
  }
}

function getClearValue<T>(col: DataColumnDef<T>): T[keyof T] {
  if (col.type === 'multiList') return [] as T[keyof T]
  return '' as T[keyof T]
}

function clearSelectedCells<T>(
  store: TableStore<T>,
  columns: ReadonlyArray<import('../core/types/column').ColumnDef<T>>,
  onCellChange: (rowIndex: number, columnKey: keyof T, value: T[keyof T]) => void,
): void {
  const selection = store.getSelection()
  if (selection.activeCell === null) return

  store.beginBatch()
  if (selection.range) {
    const { minRow, maxRow, minCol, maxCol } = getNormalizedRange(selection.range)
    for (let r = minRow; r <= maxRow; r++) {
      for (let c = minCol; c <= maxCol; c++) {
        const col = columns[c]
        if (col && isDataColumn(col) && !col.readOnly) {
          const dataCol = col as DataColumnDef<T>
          onCellChange(r, dataCol.key as keyof T, getClearValue(dataCol))
        }
      }
    }
  } else {
    const col = columns[selection.activeCell.colIndex]
    if (col && isDataColumn(col) && !col.readOnly) {
      const dataCol = col as DataColumnDef<T>
      onCellChange(selection.activeCell.rowIndex, dataCol.key as keyof T, getClearValue(dataCol))
    }
  }
  store.endBatch()
}

export const SpreadSheetTable = memo(SpreadSheetTableInner) as typeof SpreadSheetTableInner
