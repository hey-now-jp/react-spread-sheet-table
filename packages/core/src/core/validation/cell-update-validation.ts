import type { CellValidationError, ColumnDef, DataColumnDef, ValidationResult } from '../types'
import { isDataColumn } from '../types'
import { validateCellValue } from './validation-utils'

export type CellUpdate<T> = {
  readonly rowIndex: number
  readonly columnKey: keyof T
  readonly value: T[keyof T]
}

export type CustomValidate<T> = (
  value: unknown,
  row: T,
  columnKey: keyof T,
) => ValidationResult | null

export function applyCellUpdates<T>(
  rows: ReadonlyArray<T>,
  updates: ReadonlyArray<CellUpdate<T>>,
): ReadonlyArray<T> {
  const candidateRows = [...rows]

  for (const update of updates) {
    const row = candidateRows[update.rowIndex]
    if (row === undefined) continue
    candidateRows[update.rowIndex] = { ...row, [update.columnKey]: update.value }
  }

  return candidateRows
}

export function validateCellUpdates<T>(
  rows: ReadonlyArray<T>,
  columns: ReadonlyArray<ColumnDef<T>>,
  updates: ReadonlyArray<CellUpdate<T>>,
  customValidate?: CustomValidate<T>,
): ReadonlyArray<CellValidationError> {
  const candidateRows = applyCellUpdates(rows, updates)
  const dataColumns = new Map<keyof T, DataColumnDef<T>>()

  for (const column of columns) {
    if (isDataColumn(column)) dataColumns.set(column.key as keyof T, column)
  }

  const errors: CellValidationError[] = []
  for (const update of updates) {
    const row = candidateRows[update.rowIndex]
    const column = dataColumns.get(update.columnKey)
    if (row === undefined || column === undefined) continue

    const builtInResult = validateCellValue(update.value, column, row)
    const result = builtInResult ?? customValidate?.(update.value, row, update.columnKey) ?? null
    if (result !== null) {
      errors.push({
        rowIndex: update.rowIndex,
        columnKey: String(update.columnKey),
        result,
      })
    }
  }

  return errors
}
