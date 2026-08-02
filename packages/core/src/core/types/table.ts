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

export type RowChangeSource = 'edit' | 'paste'

export type RowChangeContext<T> = {
  readonly rowIndex: number
  readonly source: RowChangeSource
  readonly changes: ReadonlyArray<CellChange<T>>
}

export type RowChangeIssue<T> = {
  readonly columnKey: keyof T
  readonly result: ValidationResult
}

export type CommittedRowChange<T> = {
  readonly rowIndex: number
  readonly previousRow: T
  readonly row: T
  readonly changes: ReadonlyArray<CellChange<T>>
}

export type RowChangeCommit<T> = {
  readonly source: RowChangeSource
  readonly rows: ReadonlyArray<CommittedRowChange<T>>
}

export type RejectedRowChange<T> = {
  readonly rowIndex: number
  readonly previousRow: T
  readonly candidateRow: T
  readonly issues: ReadonlyArray<RowChangeIssue<T>>
}

export type RowChangeRejection<T> = {
  readonly source: RowChangeSource
  readonly errors: ReadonlyArray<CellValidationError>
  readonly rows: ReadonlyArray<RejectedRowChange<T>>
}

export type ProcessRowChangeResult<T> =
  | { readonly status: 'accepted'; readonly row: T }
  | { readonly status: 'rejected'; readonly issues: ReadonlyArray<RowChangeIssue<T>> }

export type ProcessRowChange<T> = (
  candidateRow: T,
  previousRow: T,
  context: RowChangeContext<T>,
) => ProcessRowChangeResult<T>

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
  readonly onRowChangeCommitted?: (commit: RowChangeCommit<T>) => void
  readonly onSort?: (sortState: SortState<T>) => void
  readonly onFilter?: (filterState: FilterState<T>) => void
  readonly onValidationError?: (errors: ReadonlyArray<CellValidationError>) => void
  readonly validate?: (value: unknown, row: T, columnKey: keyof T) => ValidationResult | null
  readonly processRowChange?: ProcessRowChange<T>
  readonly onRowChangeRejected?: (rejection: RowChangeRejection<T>) => void
  readonly reorderable?: boolean
  readonly onReorder?: (newData: ReadonlyArray<T>) => void
  readonly resizable?: boolean
  readonly onColumnResize?: (columnKey: string, width: number) => void
  readonly frozenColumns?: number
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
  readonly replaceData: (rows: ReadonlyArray<T>) => void

  // Selection
  readonly selection: SelectionState
  readonly select: (range: SelectionRange) => void
  readonly clearSelection: () => void

  // Sort
  readonly sortable: boolean
  readonly sortState: SortState<T>
  readonly sort: (key: keyof T, direction: SortDirection) => void
  readonly clearSort: () => void

  // Filter
  readonly filterable: boolean
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

  // Resize
  readonly resizable: boolean

  // Frozen columns
  readonly frozenColumns: number
}

// ---------------------------------------------------------------------------
// Cell meta (external per-cell styling & tooltip)
// ---------------------------------------------------------------------------

export type CellMeta = {
  readonly className?: string
  readonly tooltip?: string
}

// ---------------------------------------------------------------------------
// SpreadSheetTable component props
// ---------------------------------------------------------------------------

export type SpreadSheetTableProps<T> = {
  readonly table: TableInstance<T>
  readonly readOnly?: boolean
  readonly cellMeta?: (row: T, columnKey: keyof T, rowIndex: number) => CellMeta | undefined
  readonly autoWidth?: boolean
}
