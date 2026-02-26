import { useCallback, useRef, useSyncExternalStore } from 'react'
import { createStore, type TableStore } from '../core/store/create-store'
import type {
  DataColumnDef,
  FilterCondition,
  SelectionRange,
  SortDirection,
  TableInstance,
  UseSpreadSheetTableOptions,
} from '../core/types'
import { isDataColumn } from '../core/types'
import { runValidation } from '../core/validation/validation-utils'

export function useSpreadSheetTable<T>(options: UseSpreadSheetTableOptions<T>): TableInstance<T> {
  const storeRef = useRef<TableStore<T> | null>(null)

  if (storeRef.current === null) {
    storeRef.current = createStore({
      columns: options.columns,
      initialData: options.initialData,
      rowKey: options.rowKey,
    })
  }

  const store = storeRef.current

  // Subscribe to store changes
  useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot)

  // Run validation on data changes
  const dataColumns = options.columns.filter(isDataColumn) as ReadonlyArray<DataColumnDef<T>>
  const rows = store.getRows()
  const validationErrors = runValidation(rows, dataColumns, options.validate)
  store.setValidationErrors(validationErrors)

  // Notify validation errors
  const prevErrorCountRef = useRef(0)
  const errorOnlyErrors = validationErrors.filter((e) => e.result.level === 'error')
  if (errorOnlyErrors.length !== prevErrorCountRef.current) {
    prevErrorCountRef.current = errorOnlyErrors.length
    options.onValidationError?.(validationErrors)
  }

  const handleCellChange = useCallback(
    (rowIndex: number, columnKey: keyof T, value: T[keyof T]) => {
      store.setCellValue(rowIndex, columnKey, value)
      if (options.onChange) {
        const changedRows = store.getChangedRows()
        options.onChange(changedRows)
      }
    },
    [store, options.onChange],
  )

  const table: TableInstance<T> = {
    // Data
    isDirty: store.isDirty(),
    getChangedRows: store.getChangedRows,
    getData: store.getRows,
    markAsSaved: store.markAsSaved,
    resetToInitial: store.resetToInitial,

    // Selection
    selection: store.getSelection(),
    select: (range: SelectionRange) => store.setRange(range),
    clearSelection: store.clearSelection,

    // Sort
    sortState: store.getSortState(),
    sort: (key: keyof T, direction: SortDirection) => {
      store.setSort(key, direction)
      options.onSort?.(store.getSortState())
    },
    clearSort: () => {
      store.clearSort()
      options.onSort?.(null)
    },

    // Filter
    filterState: store.getFilterState(),
    filter: (key: keyof T, condition: FilterCondition) => {
      store.setFilter(key, condition)
      options.onFilter?.(store.getFilterState())
    },
    clearFilter: (key?: keyof T) => {
      store.clearFilter(key)
      options.onFilter?.(store.getFilterState())
    },

    // Validation
    getValidationErrors: store.getValidationErrors,
    isValid: () => store.getValidationErrors().every((e) => e.result.level !== 'error'),

    // Undo/Redo
    undo: store.undo,
    redo: store.redo,
    canUndo: store.canUndo(),
    canRedo: store.canRedo(),
  }

  // Attach store for internal component access
  ;(
    table as TableInstance<T> & {
      __store: TableStore<T>
      __handleCellChange: typeof handleCellChange
    }
  ).__store = store
  ;(
    table as TableInstance<T> & { __handleCellChange: typeof handleCellChange }
  ).__handleCellChange = handleCellChange

  return table
}
