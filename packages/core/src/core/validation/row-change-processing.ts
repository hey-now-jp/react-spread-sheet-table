import type {
  CellChange,
  CellValidationError,
  ProcessRowChange,
  RejectedRowChange,
  RowChangeCommit,
  RowChangeSource,
} from '../types'
import { applyCellUpdates, type CellUpdate } from './cell-update-validation'

export type PreparedCellUpdates<T> =
  | { readonly accepted: true; readonly updates: ReadonlyArray<CellUpdate<T>> }
  | {
      readonly accepted: false
      readonly errors: ReadonlyArray<CellValidationError>
      readonly rejectedRows: ReadonlyArray<RejectedRowChange<T>>
    }

function getChangedKeys<T>(
  previousRow: T,
  candidateRow: T,
  updates: ReadonlyArray<CellUpdate<T>>,
  rowIndex: number,
): ReadonlyArray<keyof T> {
  const keys = new Set<keyof T>()
  for (const update of updates) {
    if (
      update.rowIndex === rowIndex &&
      !Object.is(previousRow[update.columnKey], candidateRow[update.columnKey])
    ) {
      keys.add(update.columnKey)
    }
  }
  return [...keys]
}

function getRowKeys<T>(
  previousRow: T,
  processedRow: T,
  changedKeys: ReadonlyArray<keyof T>,
): ReadonlyArray<keyof T> {
  const keys = new Set<keyof T>(changedKeys)
  for (const key of Reflect.ownKeys(Object(previousRow))) keys.add(key as keyof T)
  for (const key of Reflect.ownKeys(Object(processedRow))) keys.add(key as keyof T)
  return [...keys]
}

export function prepareCellUpdates<T>(
  rows: ReadonlyArray<T>,
  updates: ReadonlyArray<CellUpdate<T>>,
  source: RowChangeSource,
  processRowChange?: ProcessRowChange<T>,
): PreparedCellUpdates<T> {
  if (processRowChange === undefined) return { accepted: true, updates }

  const candidateRows = applyCellUpdates(rows, updates)
  const affectedRowIndices = new Set(updates.map((update) => update.rowIndex))
  const processedRows = new Map<number, { row: T; changedKeys: ReadonlyArray<keyof T> }>()
  const errors: CellValidationError[] = []
  const rejectedRows: RejectedRowChange<T>[] = []

  for (const rowIndex of affectedRowIndices) {
    const previousRow = rows[rowIndex]
    const candidateRow = candidateRows[rowIndex]
    if (previousRow == null || candidateRow == null) continue

    const changedKeys = getChangedKeys(previousRow, candidateRow, updates, rowIndex)
    if (changedKeys.length === 0) continue

    const changes: ReadonlyArray<CellChange<T>> = changedKeys.map((key) => ({
      key,
      previousValue: previousRow[key],
      newValue: candidateRow[key],
    }))
    const result = processRowChange(candidateRow, previousRow, { rowIndex, source, changes })

    if (result.status === 'rejected') {
      rejectedRows.push({ rowIndex, previousRow, candidateRow, issues: result.issues })
      for (const issue of result.issues) {
        errors.push({
          rowIndex,
          columnKey: String(issue.columnKey),
          result: issue.result,
        })
      }
      continue
    }

    processedRows.set(rowIndex, { row: result.row, changedKeys })
  }

  if (rejectedRows.length > 0) return { accepted: false, errors, rejectedRows }

  const preparedUpdates: CellUpdate<T>[] = []
  for (const [rowIndex, processed] of processedRows) {
    const previousRow = rows[rowIndex]
    if (previousRow == null) continue

    for (const columnKey of getRowKeys(previousRow, processed.row, processed.changedKeys)) {
      const value = processed.row[columnKey]
      if (!Object.is(previousRow[columnKey], value)) {
        preparedUpdates.push({ rowIndex, columnKey, value })
      }
    }
  }

  return { accepted: true, updates: preparedUpdates }
}

export function createRowChangeCommit<T>(
  rows: ReadonlyArray<T>,
  updates: ReadonlyArray<CellUpdate<T>>,
  source: RowChangeSource,
): RowChangeCommit<T> {
  const committedRows = applyCellUpdates(rows, updates)
  const affectedRowIndices = new Set(updates.map((update) => update.rowIndex))

  return {
    source,
    rows: [...affectedRowIndices].flatMap((rowIndex) => {
      const previousRow = rows[rowIndex]
      const row = committedRows[rowIndex]
      if (previousRow == null || row == null) return []

      const changedKeys = getChangedKeys(previousRow, row, updates, rowIndex)
      if (changedKeys.length === 0) return []

      const changes: ReadonlyArray<CellChange<T>> = changedKeys.map((key) => ({
        key,
        previousValue: previousRow[key],
        newValue: row[key],
      }))
      return [{ rowIndex, previousRow, row, changes }]
    }),
  }
}
