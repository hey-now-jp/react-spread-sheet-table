import type { CellChange, ChangeInfo } from '../types/table'

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
