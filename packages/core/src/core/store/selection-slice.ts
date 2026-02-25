import type { CellPosition, SelectionRange, SelectionState } from '../types/selection'

export type SelectionSlice = SelectionState

export function createSelectionSlice(): SelectionSlice {
  return {
    activeCell: null,
    range: null,
  }
}

export function setActiveCell(slice: SelectionSlice, position: CellPosition): SelectionSlice {
  return {
    activeCell: position,
    range: null,
  }
}

export function setRange(slice: SelectionSlice, range: SelectionRange | null): SelectionSlice {
  return {
    ...slice,
    range,
  }
}

export function clearSelection(): SelectionSlice {
  return {
    activeCell: null,
    range: null,
  }
}

export function extendSelection(slice: SelectionSlice, endPosition: CellPosition): SelectionSlice {
  if (slice.activeCell === null) return slice

  return {
    ...slice,
    range: {
      start: slice.activeCell,
      end: endPosition,
    },
  }
}
