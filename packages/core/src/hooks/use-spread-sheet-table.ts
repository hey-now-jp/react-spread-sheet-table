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
import { type CellUpdate, validateCellUpdates } from '../core/validation/cell-update-validation'
import { prepareCellUpdates } from '../core/validation/row-change-processing'
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

  const commitCellUpdates = useCallback(
    (
      updates: ReadonlyArray<CellUpdate<T>>,
      source: 'edit' | 'paste',
      validateBeforeCommit: boolean,
    ) => {
      const prepared = prepareCellUpdates(
        store.getRows(),
        updates,
        source,
        options.processRowChange,
      )
      if (!prepared.accepted) {
        options.onRowChangeRejected?.(prepared.errors)
        return { committed: false as const, errors: prepared.errors }
      }

      const errors = validateBeforeCommit
        ? validateCellUpdates(store.getRows(), options.columns, prepared.updates, options.validate)
        : []
      if (errors.some((error) => error.result.level === 'error')) {
        return { committed: false as const, errors }
      }

      store.beginBatch()
      for (const update of prepared.updates) {
        store.setCellValue(update.rowIndex, update.columnKey, update.value)
      }
      store.endBatch()
      if (prepared.updates.length > 0) options.onChange?.(store.getChangedRows())

      return { committed: true as const, errors }
    },
    [
      store,
      options.columns,
      options.onChange,
      options.onRowChangeRejected,
      options.processRowChange,
      options.validate,
    ],
  )

  const handleCellChange = useCallback(
    (rowIndex: number, columnKey: keyof T, value: T[keyof T]) => {
      const result = commitCellUpdates([{ rowIndex, columnKey, value }], 'edit', false)
      if (!result.committed) {
        store.showToast(result.errors.map((error) => error.result.message))
      }
    },
    [commitCellUpdates, store],
  )

  const handleBatchCellChanges = useCallback(
    (updates: ReadonlyArray<CellUpdate<T>>) => commitCellUpdates(updates, 'paste', true),
    [commitCellUpdates],
  )

  // Delete / Cut clears a whole selection at once. Committing it as one transaction keeps
  // processRowChange rejections from leaving part of the selection cleared.
  const handleClearCells = useCallback(
    (updates: ReadonlyArray<CellUpdate<T>>) => {
      const result = commitCellUpdates(updates, 'edit', false)
      if (!result.committed) {
        store.showToast(result.errors.map((error) => error.result.message))
      }
      return result
    },
    [commitCellUpdates, store],
  )

  const table: TableInstance<T> = {
    // Data
    isDirty: store.isDirty(),
    getChangedRows: store.getChangedRows,
    getData: store.getRows,
    markAsSaved: store.markAsSaved,
    resetToInitial: store.resetToInitial,
    replaceData: store.replaceData,

    // Selection
    selection: store.getSelection(),
    select: (range: SelectionRange) => store.setRange(range),
    clearSelection: store.clearSelection,

    // Sort
    sortable: options.sortable ?? true,
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
    filterable: options.filterable ?? true,
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

    // Reorder
    reorderable: options.reorderable ?? false,

    // Resize
    resizable: options.resizable ?? true,

    // Frozen columns
    frozenColumns: options.frozenColumns ?? 0,
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
  ;(
    table as TableInstance<T> & {
      __handleBatchCellChanges: typeof handleBatchCellChanges
    }
  ).__handleBatchCellChanges = handleBatchCellChanges
  ;(
    table as TableInstance<T> & {
      __handleClearCells: typeof handleClearCells
    }
  ).__handleClearCells = handleClearCells
  ;(
    table as TableInstance<T> & {
      __onReorder: UseSpreadSheetTableOptions<T>['onReorder']
    }
  ).__onReorder = options.onReorder

  return table
}
