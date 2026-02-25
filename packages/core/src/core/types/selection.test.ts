import { describe, expect, it } from 'vitest'
import type { SelectionState } from './selection'
import { isActiveCell, isInSelection } from './selection'

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
