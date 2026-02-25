// ---------------------------------------------------------------------------
// Cell position
// ---------------------------------------------------------------------------

export type CellPosition = {
  readonly rowIndex: number
  readonly colIndex: number
}

// ---------------------------------------------------------------------------
// Selection range (rectangular)
// ---------------------------------------------------------------------------

export type SelectionRange = {
  readonly start: CellPosition
  readonly end: CellPosition
}

// ---------------------------------------------------------------------------
// Selection state
// ---------------------------------------------------------------------------

export type SelectionState = {
  readonly activeCell: CellPosition | null
  readonly range: SelectionRange | null
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

export function isInSelection(
  selection: SelectionState,
  rowIndex: number,
  colIndex: number,
): boolean {
  if (selection.range === null) {
    if (selection.activeCell === null) return false
    return (
      selection.activeCell.rowIndex === rowIndex &&
      selection.activeCell.colIndex === colIndex
    )
  }

  const minRow = Math.min(selection.range.start.rowIndex, selection.range.end.rowIndex)
  const maxRow = Math.max(selection.range.start.rowIndex, selection.range.end.rowIndex)
  const minCol = Math.min(selection.range.start.colIndex, selection.range.end.colIndex)
  const maxCol = Math.max(selection.range.start.colIndex, selection.range.end.colIndex)

  return (
    rowIndex >= minRow &&
    rowIndex <= maxRow &&
    colIndex >= minCol &&
    colIndex <= maxCol
  )
}

export function isActiveCell(
  selection: SelectionState,
  rowIndex: number,
  colIndex: number,
): boolean {
  if (selection.activeCell === null) return false
  return (
    selection.activeCell.rowIndex === rowIndex &&
    selection.activeCell.colIndex === colIndex
  )
}
