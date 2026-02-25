import type { ColumnDef } from '../types/column'
import type { FilterCondition, FilterState } from '../types/filter'
import type { CellPosition, SelectionRange, SelectionState } from '../types/selection'
import type { SortDirection, SortState } from '../types/sort'
import type { CellChange, ChangeInfo } from '../types/table'
import type { CellValidationError } from '../types/validation'
import {
  createDataSlice,
  type DataSlice,
  getChangedRows as getChangedRowsFromSlice,
  markAsSaved as markDataAsSaved,
  resetToInitial as resetDataToInitial,
  setCellValue as setDataCellValue,
} from './data-slice'
import {
  createEditSlice,
  type EditSlice,
  startEditing as startEditingSlice,
  stopEditing as stopEditingSlice,
  updateEditingValue as updateEditingValueSlice,
} from './edit-slice'
import {
  clearFilter as clearFilterSlice,
  createFilterSlice,
  type FilterSlice,
  setFilter as setFilterSlice,
} from './filter-slice'
import {
  clearSelection as clearSelectionSlice,
  createSelectionSlice,
  extendSelection as extendSelectionSlice,
  type SelectionSlice,
  setActiveCell as setActiveCellSlice,
  setRange as setRangeSlice,
} from './selection-slice'
import {
  clearSort as clearSortSlice,
  createSortSlice,
  type SortSlice,
  setSort as setSortSlice,
  toggleSort as toggleSortSlice,
} from './sort-slice'

export type TableStore<T> = {
  // Data
  getRows(): ReadonlyArray<T>
  getCellValue(rowIndex: number, columnKey: keyof T): T[keyof T]
  setCellValue(rowIndex: number, columnKey: keyof T, value: T[keyof T]): void
  getChangedRows(): ReadonlyArray<ChangeInfo<T>>
  isDirty(): boolean
  markAsSaved(): void
  resetToInitial(): void

  // Selection
  getSelection(): SelectionState
  setActiveCell(position: CellPosition): void
  setRange(range: SelectionRange | null): void
  extendSelection(endPosition: CellPosition): void
  clearSelection(): void

  // Sort
  getSortState(): SortState<T>
  setSort(key: keyof T, direction: SortDirection): void
  clearSort(): void
  toggleSort(key: keyof T): void

  // Filter
  getFilterState(): FilterState<T>
  setFilter(key: keyof T, condition: FilterCondition): void
  clearFilter(key?: keyof T): void

  // Edit
  getEditingCell(): CellPosition | null
  getEditingValue(): string
  startEditing(position: CellPosition, initialValue: string): void
  updateEditingValue(value: string): void
  stopEditing(): void

  // Derived
  getSortedFilteredIndices(): ReadonlyArray<number>
  getColumns(): ReadonlyArray<ColumnDef<T>>
  getRowKey(): keyof T

  // Validation
  getValidationErrors(): ReadonlyArray<CellValidationError>
  setValidationErrors(errors: ReadonlyArray<CellValidationError>): void

  // Subscriptions
  subscribe(listener: () => void): () => void
  getSnapshot(): number
}

export type CreateStoreOptions<T> = {
  readonly columns: ReadonlyArray<ColumnDef<T>>
  readonly initialData: ReadonlyArray<T>
  readonly rowKey: keyof T
}

export function createStore<T>(options: CreateStoreOptions<T>): TableStore<T> {
  let dataSlice: DataSlice<T> = createDataSlice(options.initialData)
  let selectionSlice: SelectionSlice = createSelectionSlice()
  let sortSlice: SortSlice<T> = createSortSlice<T>()
  let filterSlice: FilterSlice<T> = createFilterSlice<T>()
  let editSlice: EditSlice = createEditSlice()
  let validationErrors: ReadonlyArray<CellValidationError> = []

  let version = 0
  const listeners = new Set<() => void>()

  let cachedSortedFilteredIndices: ReadonlyArray<number> | null = null
  let cachedDataVersion = -1
  let cachedSortVersion = -1
  let cachedFilterVersion = -1
  let dataVersion = 0
  let sortVersion = 0
  let filterVersion = 0

  function notify(): void {
    version += 1
    for (const listener of listeners) {
      listener()
    }
  }

  function invalidateDerivedCache(): void {
    cachedSortedFilteredIndices = null
  }

  function computeSortedFilteredIndices(): ReadonlyArray<number> {
    const rows = dataSlice.rows
    let indices = Array.from({ length: rows.length }, (_, i) => i)

    // Apply filters
    const filters = filterSlice.filterState
    if (filters.size > 0) {
      indices = indices.filter((rowIndex) => {
        const row = rows[rowIndex]
        for (const [key, condition] of filters) {
          const value = row[key]
          if (!matchesFilter(value, condition)) return false
        }
        return true
      })
    }

    // Apply sort
    const sort = sortSlice.sortState
    if (sort !== null) {
      const { key, direction } = sort
      const multiplier = direction === 'asc' ? 1 : -1
      indices.sort((a, b) => {
        const aVal = rows[a][key]
        const bVal = rows[b][key]
        return multiplier * compareValues(aVal, bVal)
      })
    }

    return indices
  }

  const store: TableStore<T> = {
    // Data
    getRows: () => dataSlice.rows,
    getCellValue: (rowIndex, columnKey) => {
      const row = dataSlice.rows[rowIndex]
      return row[columnKey]
    },
    setCellValue: (rowIndex, columnKey, value) => {
      dataSlice = setDataCellValue(dataSlice, rowIndex, columnKey, value)
      dataVersion += 1
      invalidateDerivedCache()
      notify()
    },
    getChangedRows: () => getChangedRowsFromSlice(dataSlice),
    isDirty: () => dataSlice.dirtyRowIndices.size > 0,
    markAsSaved: () => {
      dataSlice = markDataAsSaved(dataSlice)
      notify()
    },
    resetToInitial: () => {
      dataSlice = resetDataToInitial(dataSlice)
      dataVersion += 1
      invalidateDerivedCache()
      notify()
    },

    // Selection
    getSelection: () => selectionSlice,
    setActiveCell: (position) => {
      selectionSlice = setActiveCellSlice(selectionSlice, position)
      notify()
    },
    setRange: (range) => {
      selectionSlice = setRangeSlice(selectionSlice, range)
      notify()
    },
    extendSelection: (endPosition) => {
      selectionSlice = extendSelectionSlice(selectionSlice, endPosition)
      notify()
    },
    clearSelection: () => {
      selectionSlice = clearSelectionSlice()
      notify()
    },

    // Sort
    getSortState: () => sortSlice.sortState,
    setSort: (key, direction) => {
      sortSlice = setSortSlice(key, direction)
      sortVersion += 1
      invalidateDerivedCache()
      notify()
    },
    clearSort: () => {
      sortSlice = clearSortSlice()
      sortVersion += 1
      invalidateDerivedCache()
      notify()
    },
    toggleSort: (key) => {
      sortSlice = toggleSortSlice(sortSlice, key)
      sortVersion += 1
      invalidateDerivedCache()
      notify()
    },

    // Filter
    getFilterState: () => filterSlice.filterState,
    setFilter: (key, condition) => {
      filterSlice = setFilterSlice(filterSlice, key, condition)
      filterVersion += 1
      invalidateDerivedCache()
      notify()
    },
    clearFilter: (key?) => {
      filterSlice = clearFilterSlice(filterSlice, key)
      filterVersion += 1
      invalidateDerivedCache()
      notify()
    },

    // Edit
    getEditingCell: () => editSlice.editingCell,
    getEditingValue: () => editSlice.editingValue,
    startEditing: (position, initialValue) => {
      editSlice = startEditingSlice(position, initialValue)
      notify()
    },
    updateEditingValue: (value) => {
      editSlice = updateEditingValueSlice(editSlice, value)
      notify()
    },
    stopEditing: () => {
      editSlice = stopEditingSlice()
      notify()
    },

    // Derived
    getSortedFilteredIndices: () => {
      if (
        cachedSortedFilteredIndices !== null &&
        cachedDataVersion === dataVersion &&
        cachedSortVersion === sortVersion &&
        cachedFilterVersion === filterVersion
      ) {
        return cachedSortedFilteredIndices
      }
      cachedSortedFilteredIndices = computeSortedFilteredIndices()
      cachedDataVersion = dataVersion
      cachedSortVersion = sortVersion
      cachedFilterVersion = filterVersion
      return cachedSortedFilteredIndices
    },
    getColumns: () => options.columns,
    getRowKey: () => options.rowKey,

    // Validation
    getValidationErrors: () => validationErrors,
    setValidationErrors: (errors) => {
      validationErrors = errors
      notify()
    },

    // Subscriptions
    subscribe: (listener) => {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    getSnapshot: () => version,
  }

  return store
}

function compareValues(a: unknown, b: unknown): number {
  if (a === b) return 0
  if (a == null) return -1
  if (b == null) return 1

  if (typeof a === 'string' && typeof b === 'string') {
    return a.localeCompare(b)
  }
  if (typeof a === 'number' && typeof b === 'number') {
    return a - b
  }
  if (typeof a === 'boolean' && typeof b === 'boolean') {
    return a === b ? 0 : a ? 1 : -1
  }

  return String(a).localeCompare(String(b))
}

function matchesFilter(
  value: unknown,
  condition: import('../types/filter').FilterCondition,
): boolean {
  switch (condition.type) {
    case 'eq':
      return value === condition.value
    case 'contains':
      return String(value ?? '')
        .toLowerCase()
        .includes(condition.value.toLowerCase())
    case 'range': {
      const num = typeof value === 'number' ? value : Number(value)
      if (Number.isNaN(num)) return false
      if (condition.min !== undefined && num < condition.min) return false
      if (condition.max !== undefined && num > condition.max) return false
      return true
    }
    case 'in':
      return condition.values.includes(value)
  }
}
