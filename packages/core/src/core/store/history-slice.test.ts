import { describe, expect, it } from 'vitest'
import {
  createHistorySlice,
  type HistoryEntry,
  type HistorySlice,
  pushEntry,
  type RedoResult,
  redoEntry,
  type UndoResult,
  undoEntry,
} from './history-slice'

type TestRow = { id: string; name: string; age: number }

function makeEntry(
  rowIndex: number,
  columnKey: keyof TestRow,
  previousValue: TestRow[keyof TestRow],
  newValue: TestRow[keyof TestRow],
): HistoryEntry<TestRow> {
  return { changes: [{ rowIndex, columnKey, previousValue, newValue }] }
}

function expectUndo(result: UndoResult<TestRow>): {
  slice: HistorySlice<TestRow>
  entry: HistoryEntry<TestRow>
} {
  expect(result).not.toBeNull()
  return result as NonNullable<typeof result>
}

function expectRedo(result: RedoResult<TestRow>): {
  slice: HistorySlice<TestRow>
  entry: HistoryEntry<TestRow>
} {
  expect(result).not.toBeNull()
  return result as NonNullable<typeof result>
}

describe('history-slice', () => {
  describe('createHistorySlice', () => {
    it('creates empty stacks', () => {
      const slice = createHistorySlice<TestRow>()
      expect(slice.undoStack).toEqual([])
      expect(slice.redoStack).toEqual([])
    })
  })

  describe('pushEntry', () => {
    it('adds entry to undo stack and clears redo stack', () => {
      let slice = createHistorySlice<TestRow>()
      const entry = makeEntry(0, 'name', 'Alice', 'Bob')
      slice = pushEntry(slice, entry)

      expect(slice.undoStack).toHaveLength(1)
      expect(slice.undoStack[0]).toBe(entry)
      expect(slice.redoStack).toEqual([])
    })

    it('ignores empty changes', () => {
      const slice = createHistorySlice<TestRow>()
      const result = pushEntry(slice, { changes: [] })
      expect(result.undoStack).toHaveLength(0)
    })

    it('clears redo stack on new push', () => {
      let slice = createHistorySlice<TestRow>()
      slice = pushEntry(slice, makeEntry(0, 'name', 'Alice', 'Bob'))
      const undoResult = expectUndo(undoEntry(slice))
      slice = undoResult.slice
      expect(slice.redoStack).toHaveLength(1)

      slice = pushEntry(slice, makeEntry(0, 'name', 'Alice', 'Charlie'))
      expect(slice.redoStack).toEqual([])
    })

    it('enforces max stack size of 25', () => {
      let slice = createHistorySlice<TestRow>()
      for (let i = 0; i < 30; i++) {
        slice = pushEntry(slice, makeEntry(0, 'age', i, i + 1))
      }
      expect(slice.undoStack).toHaveLength(25)
      const firstEntry = slice.undoStack[0]
      expect(firstEntry.changes[0].previousValue).toBe(5)
    })
  })

  describe('undoEntry', () => {
    it('returns null when undo stack is empty', () => {
      const slice = createHistorySlice<TestRow>()
      expect(undoEntry(slice)).toBeNull()
    })

    it('pops from undo stack and pushes to redo stack', () => {
      let slice = createHistorySlice<TestRow>()
      const entry1 = makeEntry(0, 'name', 'Alice', 'Bob')
      const entry2 = makeEntry(0, 'name', 'Bob', 'Charlie')
      slice = pushEntry(slice, entry1)
      slice = pushEntry(slice, entry2)

      const result = expectUndo(undoEntry(slice))
      expect(result.entry).toBe(entry2)
      expect(result.slice.undoStack).toHaveLength(1)
      expect(result.slice.redoStack).toHaveLength(1)
      expect(result.slice.redoStack[0]).toBe(entry2)
    })
  })

  describe('redoEntry', () => {
    it('returns null when redo stack is empty', () => {
      const slice = createHistorySlice<TestRow>()
      expect(redoEntry(slice)).toBeNull()
    })

    it('pops from redo stack and pushes to undo stack', () => {
      let slice = createHistorySlice<TestRow>()
      const entry = makeEntry(0, 'name', 'Alice', 'Bob')
      slice = pushEntry(slice, entry)
      const undoResult = expectUndo(undoEntry(slice))
      slice = undoResult.slice

      const result = expectRedo(redoEntry(slice))
      expect(result.entry).toBe(entry)
      expect(result.slice.undoStack).toHaveLength(1)
      expect(result.slice.redoStack).toEqual([])
    })
  })

  describe('undo/redo cycle', () => {
    it('supports multiple undo then redo', () => {
      let slice = createHistorySlice<TestRow>()
      const e1 = makeEntry(0, 'name', 'A', 'B')
      const e2 = makeEntry(0, 'name', 'B', 'C')
      const e3 = makeEntry(0, 'name', 'C', 'D')
      slice = pushEntry(slice, e1)
      slice = pushEntry(slice, e2)
      slice = pushEntry(slice, e3)

      // Undo 3 times
      let result = expectUndo(undoEntry(slice))
      expect(result.entry).toBe(e3)
      slice = result.slice

      result = expectUndo(undoEntry(slice))
      expect(result.entry).toBe(e2)
      slice = result.slice

      result = expectUndo(undoEntry(slice))
      expect(result.entry).toBe(e1)
      slice = result.slice

      expect(undoEntry(slice)).toBeNull()

      // Redo 3 times
      let redoResult = expectRedo(redoEntry(slice))
      expect(redoResult.entry).toBe(e1)
      slice = redoResult.slice

      redoResult = expectRedo(redoEntry(slice))
      expect(redoResult.entry).toBe(e2)
      slice = redoResult.slice

      redoResult = expectRedo(redoEntry(slice))
      expect(redoResult.entry).toBe(e3)
      slice = redoResult.slice

      expect(redoEntry(slice)).toBeNull()
    })

    it('handles bulk entry (multi-cell paste)', () => {
      let slice = createHistorySlice<TestRow>()
      const bulkEntry: HistoryEntry<TestRow> = {
        changes: [
          { rowIndex: 0, columnKey: 'name', previousValue: 'A', newValue: 'X' },
          { rowIndex: 1, columnKey: 'name', previousValue: 'B', newValue: 'Y' },
          { rowIndex: 2, columnKey: 'name', previousValue: 'C', newValue: 'Z' },
        ],
      }
      slice = pushEntry(slice, bulkEntry)

      const result = expectUndo(undoEntry(slice))
      expect(result.entry.changes).toHaveLength(3)
      expect(result.entry.changes[0].previousValue).toBe('A')
      expect(result.entry.changes[1].previousValue).toBe('B')
      expect(result.entry.changes[2].previousValue).toBe('C')
    })
  })
})
