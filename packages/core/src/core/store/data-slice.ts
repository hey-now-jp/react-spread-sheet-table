import type { CellChange, ChangeInfo } from '../types'
import { remapIndex, reorderArray } from './reorder-utils'

export type DataSlice<T> = {
  readonly rows: ReadonlyArray<T>
  readonly initialRows: ReadonlyArray<T>
  readonly dirtyRowIndices: ReadonlySet<number>
  readonly rowChanges: ReadonlyMap<number, ReadonlyArray<CellChange<T>>>
}

export function createDataSlice<T>(initialData: ReadonlyArray<T>): DataSlice<T> {
  return {
    rows: [...initialData],
    initialRows: initialData,
    dirtyRowIndices: new Set(),
    rowChanges: new Map(),
  }
}

export function setCellValue<T>(
  slice: DataSlice<T>,
  rowIndex: number,
  columnKey: keyof T,
  value: T[keyof T],
): DataSlice<T> {
  const row = slice.rows[rowIndex] as T | undefined
  if (row == null) return slice

  const previousValue = row[columnKey]
  if (previousValue === value) return slice

  const newRow = { ...row, [columnKey]: value }
  const newRows = slice.rows.map((r, i) => (i === rowIndex ? newRow : r))

  const existingChanges = slice.rowChanges.get(rowIndex) ?? []
  const filteredChanges = existingChanges.filter((c) => c.key !== columnKey)
  const newChange: CellChange<T> = { key: columnKey, previousValue, newValue: value }
  const updatedChanges = [...filteredChanges, newChange]

  const newRowChanges = new Map(slice.rowChanges)
  newRowChanges.set(rowIndex, updatedChanges)

  const newDirtyIndices = new Set(slice.dirtyRowIndices)
  newDirtyIndices.add(rowIndex)

  return {
    ...slice,
    rows: newRows,
    dirtyRowIndices: newDirtyIndices,
    rowChanges: newRowChanges,
  }
}

export function getChangedRows<T>(slice: DataSlice<T>): ReadonlyArray<ChangeInfo<T>> {
  const result: ChangeInfo<T>[] = []
  for (const rowIndex of slice.dirtyRowIndices) {
    const row = slice.rows[rowIndex]
    const changes = slice.rowChanges.get(rowIndex) ?? []
    if (row !== undefined && changes.length > 0) {
      result.push({ row, rowIndex, changes })
    }
  }
  return result
}

export function markAsSaved<T>(slice: DataSlice<T>): DataSlice<T> {
  return {
    ...slice,
    initialRows: slice.rows,
    dirtyRowIndices: new Set(),
    rowChanges: new Map(),
  }
}

export function resetToInitial<T>(slice: DataSlice<T>): DataSlice<T> {
  return {
    ...slice,
    rows: [...slice.initialRows],
    dirtyRowIndices: new Set(),
    rowChanges: new Map(),
  }
}

export function reorderRows<T>(
  slice: DataSlice<T>,
  fromIndex: number,
  toIndex: number,
): DataSlice<T> {
  if (fromIndex === toIndex) return slice
  if (fromIndex < 0 || fromIndex >= slice.rows.length) return slice
  if (toIndex < 0 || toIndex >= slice.rows.length) return slice

  const newRows = reorderArray(slice.rows, fromIndex, toIndex)

  const newDirtyIndices = new Set<number>()
  for (const idx of slice.dirtyRowIndices) {
    newDirtyIndices.add(remapIndex(idx, fromIndex, toIndex))
  }

  const newRowChanges = new Map<number, ReadonlyArray<CellChange<T>>>()
  for (const [idx, changes] of slice.rowChanges) {
    newRowChanges.set(remapIndex(idx, fromIndex, toIndex), changes)
  }

  return {
    ...slice,
    rows: newRows,
    dirtyRowIndices: newDirtyIndices,
    rowChanges: newRowChanges,
  }
}
