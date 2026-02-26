import type { CellPosition, ColumnDef, SelectionRange } from '../types'
import { isActionColumn } from '../types'

export function getNextDataCellIndex<T>(
  columns: ReadonlyArray<ColumnDef<T>>,
  currentColIndex: number,
  direction: 1 | -1,
): number | null {
  let next = currentColIndex + direction
  while (next >= 0 && next < columns.length) {
    if (!isActionColumn(columns[next])) {
      return next
    }
    next += direction
  }
  return null
}

export function moveActiveCell<T>(
  columns: ReadonlyArray<ColumnDef<T>>,
  current: CellPosition,
  direction: 'up' | 'down' | 'left' | 'right',
  rowCount: number,
): CellPosition | null {
  switch (direction) {
    case 'up':
      return current.rowIndex > 0
        ? { rowIndex: current.rowIndex - 1, colIndex: current.colIndex }
        : null
    case 'down':
      return current.rowIndex < rowCount - 1
        ? { rowIndex: current.rowIndex + 1, colIndex: current.colIndex }
        : null
    case 'left': {
      const nextCol = getNextDataCellIndex(columns, current.colIndex, -1)
      return nextCol !== null ? { rowIndex: current.rowIndex, colIndex: nextCol } : null
    }
    case 'right': {
      const nextCol = getNextDataCellIndex(columns, current.colIndex, 1)
      return nextCol !== null ? { rowIndex: current.rowIndex, colIndex: nextCol } : null
    }
  }
}

export function tabToNextCell<T>(
  columns: ReadonlyArray<ColumnDef<T>>,
  current: CellPosition,
  rowCount: number,
  reverse: boolean,
): CellPosition | null {
  const direction = reverse ? -1 : 1
  const nextCol = getNextDataCellIndex(columns, current.colIndex, direction)

  if (nextCol !== null) {
    return { rowIndex: current.rowIndex, colIndex: nextCol }
  }

  // Wrap to next/previous row
  const nextRow = current.rowIndex + direction
  if (nextRow < 0 || nextRow >= rowCount) return null

  if (reverse) {
    // Find last data column
    for (let i = columns.length - 1; i >= 0; i--) {
      if (!isActionColumn(columns[i])) {
        return { rowIndex: nextRow, colIndex: i }
      }
    }
  } else {
    // Find first data column
    for (let i = 0; i < columns.length; i++) {
      if (!isActionColumn(columns[i])) {
        return { rowIndex: nextRow, colIndex: i }
      }
    }
  }

  return null
}

export function getNormalizedRange(range: SelectionRange): {
  minRow: number
  maxRow: number
  minCol: number
  maxCol: number
} {
  return {
    minRow: Math.min(range.start.rowIndex, range.end.rowIndex),
    maxRow: Math.max(range.start.rowIndex, range.end.rowIndex),
    minCol: Math.min(range.start.colIndex, range.end.colIndex),
    maxCol: Math.max(range.start.colIndex, range.end.colIndex),
  }
}
