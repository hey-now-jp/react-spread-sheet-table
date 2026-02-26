import { describe, expect, it } from 'vitest'
import type { ColumnDef } from '../types'
import {
  getNextDataCellIndex,
  getNormalizedRange,
  moveActiveCell,
  tabToNextCell,
} from './selection-utils'

type TestRow = { name: string; age: number; actions: string }

const columns: ReadonlyArray<ColumnDef<TestRow>> = [
  { type: 'text', key: 'name', header: 'Name' },
  { type: 'number', key: 'age', header: 'Age' },
  {
    type: 'action',
    key: 'actions',
    render: () => null,
  },
]

describe('getNextDataCellIndex', () => {
  it('finds next data cell going right', () => {
    expect(getNextDataCellIndex(columns, 0, 1)).toBe(1)
  })

  it('skips action columns going right', () => {
    expect(getNextDataCellIndex(columns, 1, 1)).toBeNull()
  })

  it('finds previous data cell going left', () => {
    expect(getNextDataCellIndex(columns, 1, -1)).toBe(0)
  })

  it('returns null when no data cell found', () => {
    expect(getNextDataCellIndex(columns, 0, -1)).toBeNull()
  })
})

describe('moveActiveCell', () => {
  it('moves up', () => {
    const result = moveActiveCell(columns, { rowIndex: 1, colIndex: 0 }, 'up', 3)
    expect(result).toEqual({ rowIndex: 0, colIndex: 0 })
  })

  it('moves down', () => {
    const result = moveActiveCell(columns, { rowIndex: 0, colIndex: 0 }, 'down', 3)
    expect(result).toEqual({ rowIndex: 1, colIndex: 0 })
  })

  it('returns null at top boundary', () => {
    const result = moveActiveCell(columns, { rowIndex: 0, colIndex: 0 }, 'up', 3)
    expect(result).toBeNull()
  })

  it('returns null at bottom boundary', () => {
    const result = moveActiveCell(columns, { rowIndex: 2, colIndex: 0 }, 'down', 3)
    expect(result).toBeNull()
  })

  it('moves right to next data cell', () => {
    const result = moveActiveCell(columns, { rowIndex: 0, colIndex: 0 }, 'right', 3)
    expect(result).toEqual({ rowIndex: 0, colIndex: 1 })
  })

  it('skips action column when moving right', () => {
    const result = moveActiveCell(columns, { rowIndex: 0, colIndex: 1 }, 'right', 3)
    expect(result).toBeNull()
  })
})

describe('tabToNextCell', () => {
  it('tabs to next data cell in same row', () => {
    const result = tabToNextCell(columns, { rowIndex: 0, colIndex: 0 }, 3, false)
    expect(result).toEqual({ rowIndex: 0, colIndex: 1 })
  })

  it('wraps to next row at end of row', () => {
    const result = tabToNextCell(columns, { rowIndex: 0, colIndex: 1 }, 3, false)
    expect(result).toEqual({ rowIndex: 1, colIndex: 0 })
  })

  it('shift+tabs to previous data cell', () => {
    const result = tabToNextCell(columns, { rowIndex: 0, colIndex: 1 }, 3, true)
    expect(result).toEqual({ rowIndex: 0, colIndex: 0 })
  })

  it('wraps to previous row at start of row', () => {
    const result = tabToNextCell(columns, { rowIndex: 1, colIndex: 0 }, 3, true)
    expect(result).toEqual({ rowIndex: 0, colIndex: 1 })
  })

  it('returns null at last cell of last row', () => {
    const result = tabToNextCell(columns, { rowIndex: 2, colIndex: 1 }, 3, false)
    expect(result).toBeNull()
  })
})

describe('getNormalizedRange', () => {
  it('normalizes range with reversed start/end', () => {
    const result = getNormalizedRange({
      start: { rowIndex: 3, colIndex: 2 },
      end: { rowIndex: 1, colIndex: 0 },
    })
    expect(result).toEqual({ minRow: 1, maxRow: 3, minCol: 0, maxCol: 2 })
  })

  it('normalizes range with same start/end', () => {
    const result = getNormalizedRange({
      start: { rowIndex: 1, colIndex: 1 },
      end: { rowIndex: 1, colIndex: 1 },
    })
    expect(result).toEqual({ minRow: 1, maxRow: 1, minCol: 1, maxCol: 1 })
  })
})
