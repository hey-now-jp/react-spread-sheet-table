import { describe, expect, it } from 'vitest'
import type { SelectionState } from './selection'
import { getRangeEdges, getSelectionEdges, isActiveCell, isInSelection } from './selection'

describe('isInSelection', () => {
  it('returns false when no selection', () => {
    const selection: SelectionState = { activeCell: null, range: null }
    expect(isInSelection(selection, 0, 0)).toBe(false)
  })

  it('returns true for active cell position when no range', () => {
    const selection: SelectionState = {
      activeCell: { rowIndex: 1, colIndex: 2 },
      range: null,
    }
    expect(isInSelection(selection, 1, 2)).toBe(true)
  })

  it('returns false for non-active cell position when no range', () => {
    const selection: SelectionState = {
      activeCell: { rowIndex: 1, colIndex: 2 },
      range: null,
    }
    expect(isInSelection(selection, 0, 0)).toBe(false)
  })

  it('returns true for cells within range', () => {
    const selection: SelectionState = {
      activeCell: { rowIndex: 1, colIndex: 1 },
      range: {
        start: { rowIndex: 1, colIndex: 1 },
        end: { rowIndex: 3, colIndex: 3 },
      },
    }
    expect(isInSelection(selection, 1, 1)).toBe(true)
    expect(isInSelection(selection, 2, 2)).toBe(true)
    expect(isInSelection(selection, 3, 3)).toBe(true)
  })

  it('returns false for cells outside range', () => {
    const selection: SelectionState = {
      activeCell: { rowIndex: 1, colIndex: 1 },
      range: {
        start: { rowIndex: 1, colIndex: 1 },
        end: { rowIndex: 3, colIndex: 3 },
      },
    }
    expect(isInSelection(selection, 0, 0)).toBe(false)
    expect(isInSelection(selection, 4, 4)).toBe(false)
  })

  it('handles reversed range (end before start)', () => {
    const selection: SelectionState = {
      activeCell: { rowIndex: 3, colIndex: 3 },
      range: {
        start: { rowIndex: 3, colIndex: 3 },
        end: { rowIndex: 1, colIndex: 1 },
      },
    }
    expect(isInSelection(selection, 2, 2)).toBe(true)
    expect(isInSelection(selection, 1, 1)).toBe(true)
    expect(isInSelection(selection, 3, 3)).toBe(true)
  })
})

describe('isActiveCell', () => {
  it('returns false when no active cell', () => {
    const selection: SelectionState = { activeCell: null, range: null }
    expect(isActiveCell(selection, 0, 0)).toBe(false)
  })

  it('returns true for matching position', () => {
    const selection: SelectionState = {
      activeCell: { rowIndex: 2, colIndex: 3 },
      range: null,
    }
    expect(isActiveCell(selection, 2, 3)).toBe(true)
  })

  it('returns false for non-matching position', () => {
    const selection: SelectionState = {
      activeCell: { rowIndex: 2, colIndex: 3 },
      range: null,
    }
    expect(isActiveCell(selection, 2, 4)).toBe(false)
    expect(isActiveCell(selection, 3, 3)).toBe(false)
  })
})

describe('getRangeEdges', () => {
  it('returns no edges for null range', () => {
    expect(getRangeEdges(null, 0, 0)).toEqual({
      top: false,
      bottom: false,
      left: false,
      right: false,
    })
  })

  it('returns edges for range boundary cells', () => {
    const range = {
      start: { rowIndex: 1, colIndex: 1 },
      end: { rowIndex: 3, colIndex: 3 },
    }
    expect(getRangeEdges(range, 1, 1)).toEqual({
      top: true,
      bottom: false,
      left: true,
      right: false,
    })
    expect(getRangeEdges(range, 3, 3)).toEqual({
      top: false,
      bottom: true,
      left: false,
      right: true,
    })
    expect(getRangeEdges(range, 2, 2)).toEqual({
      top: false,
      bottom: false,
      left: false,
      right: false,
    })
  })
})

describe('getSelectionEdges', () => {
  const rangeSelection: SelectionState = {
    activeCell: { rowIndex: 1, colIndex: 1 },
    range: {
      start: { rowIndex: 1, colIndex: 1 },
      end: { rowIndex: 3, colIndex: 3 },
    },
  }

  it('returns no edges when no range', () => {
    const selection: SelectionState = { activeCell: { rowIndex: 0, colIndex: 0 }, range: null }
    const edges = getSelectionEdges(selection, 0, 0)
    expect(edges).toEqual({ top: false, bottom: false, left: false, right: false })
  })

  it('returns no edges for cell outside range', () => {
    const edges = getSelectionEdges(rangeSelection, 0, 0)
    expect(edges).toEqual({ top: false, bottom: false, left: false, right: false })
  })

  it('returns all edges for top-left corner', () => {
    const edges = getSelectionEdges(rangeSelection, 1, 1)
    expect(edges).toEqual({ top: true, bottom: false, left: true, right: false })
  })

  it('returns all edges for bottom-right corner', () => {
    const edges = getSelectionEdges(rangeSelection, 3, 3)
    expect(edges).toEqual({ top: false, bottom: true, left: false, right: true })
  })

  it('returns top and right edges for top-right corner', () => {
    const edges = getSelectionEdges(rangeSelection, 1, 3)
    expect(edges).toEqual({ top: true, bottom: false, left: false, right: true })
  })

  it('returns only top edge for top-center cell', () => {
    const edges = getSelectionEdges(rangeSelection, 1, 2)
    expect(edges).toEqual({ top: true, bottom: false, left: false, right: false })
  })

  it('returns no boundary edges for interior cell', () => {
    const edges = getSelectionEdges(rangeSelection, 2, 2)
    expect(edges).toEqual({ top: false, bottom: false, left: false, right: false })
  })

  it('handles reversed range (end before start)', () => {
    const reversed: SelectionState = {
      activeCell: { rowIndex: 3, colIndex: 3 },
      range: {
        start: { rowIndex: 3, colIndex: 3 },
        end: { rowIndex: 1, colIndex: 1 },
      },
    }
    const edges = getSelectionEdges(reversed, 1, 1)
    expect(edges).toEqual({ top: true, bottom: false, left: true, right: false })
  })

  it('handles single-cell range', () => {
    const single: SelectionState = {
      activeCell: { rowIndex: 2, colIndex: 2 },
      range: {
        start: { rowIndex: 2, colIndex: 2 },
        end: { rowIndex: 2, colIndex: 2 },
      },
    }
    const edges = getSelectionEdges(single, 2, 2)
    expect(edges).toEqual({ top: true, bottom: true, left: true, right: true })
  })
})
