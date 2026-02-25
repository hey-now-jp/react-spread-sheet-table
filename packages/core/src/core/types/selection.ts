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
    return selection.activeCell.rowIndex === rowIndex && selection.activeCell.colIndex === colIndex
  }

  const minRow = Math.min(selection.range.start.rowIndex, selection.range.end.rowIndex)
  const maxRow = Math.max(selection.range.start.rowIndex, selection.range.end.rowIndex)
  const minCol = Math.min(selection.range.start.colIndex, selection.range.end.colIndex)
  const maxCol = Math.max(selection.range.start.colIndex, selection.range.end.colIndex)

  return rowIndex >= minRow && rowIndex <= maxRow && colIndex >= minCol && colIndex <= maxCol
}

export function isActiveCell(
  selection: SelectionState,
  rowIndex: number,
  colIndex: number,
): boolean {
  if (selection.activeCell === null) return false
  return selection.activeCell.rowIndex === rowIndex && selection.activeCell.colIndex === colIndex
}

// ---------------------------------------------------------------------------
// Selection edge detection (for border rendering)
// ---------------------------------------------------------------------------

export type SelectionEdges = {
  readonly top: boolean
  readonly bottom: boolean
  readonly left: boolean
  readonly right: boolean
}

const NO_EDGES: SelectionEdges = { top: false, bottom: false, left: false, right: false }

export function getRangeEdges(
  range: SelectionRange | null,
  rowIndex: number,
  colIndex: number,
): SelectionEdges {
  if (range === null) return NO_EDGES

  const minRow = Math.min(range.start.rowIndex, range.end.rowIndex)
  const maxRow = Math.max(range.start.rowIndex, range.end.rowIndex)
  const minCol = Math.min(range.start.colIndex, range.end.colIndex)
  const maxCol = Math.max(range.start.colIndex, range.end.colIndex)

  const inRange =
    rowIndex >= minRow && rowIndex <= maxRow && colIndex >= minCol && colIndex <= maxCol

  if (!inRange) return NO_EDGES

  return {
    top: rowIndex === minRow,
    bottom: rowIndex === maxRow,
    left: colIndex === minCol,
    right: colIndex === maxCol,
  }
}

export function getSelectionEdges(
  selection: SelectionState,
  rowIndex: number,
  colIndex: number,
): SelectionEdges {
  return getRangeEdges(selection.range, rowIndex, colIndex)
}
