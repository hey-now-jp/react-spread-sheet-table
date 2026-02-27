import type { ColumnDef } from './column'
import type { FilterCondition, FilterState } from './filter'
import type { SelectionRange, SelectionState } from './selection'
import type { SortDirection, SortState } from './sort'
import type { CellValidationError, ValidationResult } from './validation'

// ---------------------------------------------------------------------------
// Change tracking
// ---------------------------------------------------------------------------

export type CellChange<T> = {
  readonly key: keyof T
  readonly previousValue: T[keyof T]
  readonly newValue: T[keyof T]
}

export type ChangeInfo<T> = {
  readonly row: T
  readonly rowIndex: number
  readonly changes: ReadonlyArray<CellChange<T>>
}

// ---------------------------------------------------------------------------
// Hook options
// ---------------------------------------------------------------------------

export type UseSpreadSheetTableOptions<T> = {
  readonly columns: ReadonlyArray<ColumnDef<T>>
  readonly initialData: ReadonlyArray<T>
  readonly rowKey: keyof T
  readonly sortable?: boolean
  readonly filterable?: boolean
  readonly onChange?: (changedRows: ReadonlyArray<ChangeInfo<T>>) => void
  readonly onSort?: (sortState: SortState<T>) => void
  readonly onFilter?: (filterState: FilterState<T>) => void
  readonly onValidationError?: (errors: ReadonlyArray<CellValidationError>) => void
  readonly validate?: (value: unknown, row: T, columnKey: keyof T) => ValidationResult | null
  readonly reorderable?: boolean
  readonly onReorder?: (newData: ReadonlyArray<T>) => void
}

// ---------------------------------------------------------------------------
// Table instance (public API)
// ---------------------------------------------------------------------------

export type TableInstance<T> = {
  // Data
  readonly isDirty: boolean
  readonly getChangedRows: () => ReadonlyArray<ChangeInfo<T>>
  readonly getData: () => ReadonlyArray<T>
  readonly markAsSaved: () => void
  readonly resetToInitial: () => void

  // Selection
  readonly selection: SelectionState
  readonly select: (range: SelectionRange) => void
  readonly clearSelection: () => void

  // Sort
  readonly sortState: SortState<T>
  readonly sort: (key: keyof T, direction: SortDirection) => void
  readonly clearSort: () => void

  // Filter
  readonly filterState: FilterState<T>
  readonly filter: (key: keyof T, condition: FilterCondition) => void
  readonly clearFilter: (key?: keyof T) => void

  // Validation
  readonly getValidationErrors: () => ReadonlyArray<CellValidationError>
  readonly isValid: () => boolean

  // Undo/Redo
  readonly undo: () => void
  readonly redo: () => void
  readonly canUndo: boolean
  readonly canRedo: boolean

  // Reorder
  readonly reorderable: boolean
}

// ---------------------------------------------------------------------------
// SpreadSheetTable component props
// ---------------------------------------------------------------------------

export type SpreadSheetTableProps<T> = {
  readonly table: TableInstance<T>
  readonly readOnly?: boolean
}
