import { describe, expect, it, vi } from 'vitest'
import type { ColumnDef } from '../types'
import { createStore } from './create-store'

type TestRow = {
  id: string
  name: string
  age: number
  active: boolean
}

const testColumns: ReadonlyArray<ColumnDef<TestRow>> = [
  { type: 'text', key: 'name', header: 'Name' },
  { type: 'number', key: 'age', header: 'Age' },
  { type: 'boolean', key: 'active', header: 'Active' },
]

const testData: ReadonlyArray<TestRow> = [
  { id: '1', name: 'Alice', age: 30, active: true },
  { id: '2', name: 'Bob', age: 25, active: false },
  { id: '3', name: 'Charlie', age: 35, active: true },
]

function createTestStore() {
  return createStore({ columns: testColumns, initialData: testData, rowKey: 'id' })
}

describe('createStore', () => {
  describe('data operations', () => {
    it('initializes with provided data', () => {
      const store = createTestStore()
      expect(store.getRows()).toEqual(testData)
    })

    it('gets cell value', () => {
      const store = createTestStore()
      expect(store.getCellValue(0, 'name')).toBe('Alice')
      expect(store.getCellValue(1, 'age')).toBe(25)
    })

    it('sets cell value immutably', () => {
      const store = createTestStore()
      const originalRows = store.getRows()

      store.setCellValue(0, 'name', 'Alice Updated')

      expect(store.getCellValue(0, 'name')).toBe('Alice Updated')
      expect(store.getRows()).not.toBe(originalRows)
      expect(testData[0].name).toBe('Alice')
    })

    it('tracks dirty state', () => {
      const store = createTestStore()
      expect(store.isDirty()).toBe(false)

      store.setCellValue(0, 'name', 'Alice Updated')
      expect(store.isDirty()).toBe(true)
    })

    it('gets changed rows', () => {
      const store = createTestStore()
      store.setCellValue(0, 'name', 'Alice Updated')

      const changed = store.getChangedRows()
      expect(changed).toHaveLength(1)
      expect(changed[0].rowIndex).toBe(0)
      expect(changed[0].changes).toHaveLength(1)
      expect(changed[0].changes[0].key).toBe('name')
      expect(changed[0].changes[0].previousValue).toBe('Alice')
      expect(changed[0].changes[0].newValue).toBe('Alice Updated')
    })

    it('marks as saved', () => {
      const store = createTestStore()
      store.setCellValue(0, 'name', 'Alice Updated')
      expect(store.isDirty()).toBe(true)

      store.markAsSaved()
      expect(store.isDirty()).toBe(false)
      expect(store.getChangedRows()).toHaveLength(0)
    })

    it('resets to initial data', () => {
      const store = createTestStore()
      store.setCellValue(0, 'name', 'Alice Updated')

      store.resetToInitial()
      expect(store.getCellValue(0, 'name')).toBe('Alice')
      expect(store.isDirty()).toBe(false)
    })
  })

  describe('selection', () => {
    it('sets active cell', () => {
      const store = createTestStore()
      store.setActiveCell({ rowIndex: 1, colIndex: 2 })

      const selection = store.getSelection()
      expect(selection.activeCell).toEqual({ rowIndex: 1, colIndex: 2 })
      expect(selection.range).toBeNull()
    })

    it('extends selection', () => {
      const store = createTestStore()
      store.setActiveCell({ rowIndex: 0, colIndex: 0 })
      store.extendSelection({ rowIndex: 2, colIndex: 1 })

      const selection = store.getSelection()
      expect(selection.range).toEqual({
        start: { rowIndex: 0, colIndex: 0 },
        end: { rowIndex: 2, colIndex: 1 },
      })
    })

    it('clears selection', () => {
      const store = createTestStore()
      store.setActiveCell({ rowIndex: 0, colIndex: 0 })
      store.clearSelection()

      expect(store.getSelection().activeCell).toBeNull()
    })
  })

  describe('sort', () => {
    it('sets sort state', () => {
      const store = createTestStore()
      store.setSort('age', 'asc')

      expect(store.getSortState()).toEqual({ key: 'age', direction: 'asc' })
    })

    it('toggles sort cycle: null -> asc -> desc -> null', () => {
      const store = createTestStore()

      store.toggleSort('name')
      expect(store.getSortState()).toEqual({ key: 'name', direction: 'asc' })

      store.toggleSort('name')
      expect(store.getSortState()).toEqual({ key: 'name', direction: 'desc' })

      store.toggleSort('name')
      expect(store.getSortState()).toBeNull()
    })

    it('clears sort', () => {
      const store = createTestStore()
      store.setSort('age', 'asc')
      store.clearSort()

      expect(store.getSortState()).toBeNull()
    })

    it('sorts indices by ascending', () => {
      const store = createTestStore()
      store.setSort('age', 'asc')

      const indices = store.getSortedFilteredIndices()
      expect(indices).toEqual([1, 0, 2]) // Bob(25), Alice(30), Charlie(35)
    })

    it('sorts indices by descending', () => {
      const store = createTestStore()
      store.setSort('age', 'desc')

      const indices = store.getSortedFilteredIndices()
      expect(indices).toEqual([2, 0, 1]) // Charlie(35), Alice(30), Bob(25)
    })
  })

  describe('filter', () => {
    it('filters by contains', () => {
      const store = createTestStore()
      store.setFilter('name', { type: 'contains', value: 'li' })

      const indices = store.getSortedFilteredIndices()
      expect(indices).toEqual([0, 2]) // Alice, Charlie
    })

    it('filters by range', () => {
      const store = createTestStore()
      store.setFilter('age', { type: 'range', min: 26, max: 34 })

      const indices = store.getSortedFilteredIndices()
      expect(indices).toEqual([0]) // Alice(30)
    })

    it('filters by eq', () => {
      const store = createTestStore()
      store.setFilter('active', { type: 'eq', value: false })

      const indices = store.getSortedFilteredIndices()
      expect(indices).toEqual([1]) // Bob
    })

    it('filters by in', () => {
      const store = createTestStore()
      store.setFilter('name', { type: 'in', values: ['Alice', 'Charlie'] })

      const indices = store.getSortedFilteredIndices()
      expect(indices).toEqual([0, 2])
    })

    it('clears specific filter', () => {
      const store = createTestStore()
      store.setFilter('name', { type: 'contains', value: 'li' })
      store.clearFilter('name')

      expect(store.getFilterState().size).toBe(0)
      expect(store.getSortedFilteredIndices()).toEqual([0, 1, 2])
    })

    it('clears all filters', () => {
      const store = createTestStore()
      store.setFilter('name', { type: 'contains', value: 'a' })
      store.setFilter('age', { type: 'range', min: 0 })
      store.clearFilter()

      expect(store.getFilterState().size).toBe(0)
    })
  })

  describe('edit', () => {
    it('starts and stops editing', () => {
      const store = createTestStore()
      expect(store.getEditingCell()).toBeNull()

      store.startEditing({ rowIndex: 0, colIndex: 0 }, 'Alice')
      expect(store.getEditingCell()).toEqual({ rowIndex: 0, colIndex: 0 })
      expect(store.getEditingValue()).toBe('Alice')

      store.stopEditing()
      expect(store.getEditingCell()).toBeNull()
    })

    it('updates editing value', () => {
      const store = createTestStore()
      store.startEditing({ rowIndex: 0, colIndex: 0 }, 'A')
      store.updateEditingValue('Al')

      expect(store.getEditingValue()).toBe('Al')
    })
  })

  describe('subscriptions', () => {
    it('notifies listeners on state change', () => {
      const store = createTestStore()
      const listener = vi.fn()

      store.subscribe(listener)
      store.setCellValue(0, 'name', 'Test')

      expect(listener).toHaveBeenCalled()
    })

    it('unsubscribes correctly', () => {
      const store = createTestStore()
      const listener = vi.fn()

      const unsub = store.subscribe(listener)
      unsub()
      store.setCellValue(0, 'name', 'Test')

      expect(listener).not.toHaveBeenCalled()
    })

    it('increments snapshot version on changes', () => {
      const store = createTestStore()
      const v1 = store.getSnapshot()

      store.setCellValue(0, 'name', 'Test')
      const v2 = store.getSnapshot()

      expect(v2).toBeGreaterThan(v1)
    })
  })

  describe('sort + filter combined', () => {
    it('applies filter then sort', () => {
      const store = createTestStore()
      store.setFilter('active', { type: 'eq', value: true })
      store.setSort('age', 'desc')

      const indices = store.getSortedFilteredIndices()
      // Active: Alice(30), Charlie(35) -> desc by age: Charlie(35), Alice(30)
      expect(indices).toEqual([2, 0])
    })
  })

  describe('clipboard range', () => {
    it('initializes with null clipboard range', () => {
      const store = createTestStore()
      expect(store.getClipboardRange()).toBeNull()
    })

    it('sets clipboard range', () => {
      const store = createTestStore()
      const range = { start: { rowIndex: 0, colIndex: 0 }, end: { rowIndex: 1, colIndex: 1 } }
      store.setClipboardRange(range)
      expect(store.getClipboardRange()).toEqual(range)
    })

    it('clears clipboard range', () => {
      const store = createTestStore()
      store.setClipboardRange({
        start: { rowIndex: 0, colIndex: 0 },
        end: { rowIndex: 1, colIndex: 1 },
      })
      store.clearClipboardRange()
      expect(store.getClipboardRange()).toBeNull()
    })

    it('notifies on clipboard range change', () => {
      const store = createTestStore()
      const listener = vi.fn()
      store.subscribe(listener)

      store.setClipboardRange({
        start: { rowIndex: 0, colIndex: 0 },
        end: { rowIndex: 0, colIndex: 0 },
      })
      expect(listener).toHaveBeenCalledTimes(1)

      store.clearClipboardRange()
      expect(listener).toHaveBeenCalledTimes(2)
    })
  })

  describe('toast state', () => {
    it('starts with empty messages', () => {
      const store = createTestStore()
      expect(store.getToastMessages()).toEqual([])
    })

    it('showToast sets messages and notifies', () => {
      const store = createTestStore()
      const listener = vi.fn()
      store.subscribe(listener)
      store.showToast(['error one', 'error two'])
      expect(store.getToastMessages()).toEqual(['error one', 'error two'])
      expect(listener).toHaveBeenCalledOnce()
    })

    it('clearToast empties messages and notifies', () => {
      const store = createTestStore()
      store.showToast(['error'])
      const listener = vi.fn()
      store.subscribe(listener)
      store.clearToast()
      expect(store.getToastMessages()).toEqual([])
      expect(listener).toHaveBeenCalledOnce()
    })

    it('increments toast version on showToast', () => {
      const store = createTestStore()
      const v1 = store.getToastVersion()
      store.showToast(['error'])
      const v2 = store.getToastVersion()
      expect(v2).toBeGreaterThan(v1)
    })
  })

  describe('undo/redo', () => {
    it('undo restores previous cell value', () => {
      const store = createTestStore()
      store.setCellValue(0, 'name', 'Alice Updated')
      expect(store.getCellValue(0, 'name')).toBe('Alice Updated')

      store.undo()
      expect(store.getCellValue(0, 'name')).toBe('Alice')
    })

    it('redo re-applies undone change', () => {
      const store = createTestStore()
      store.setCellValue(0, 'name', 'Alice Updated')
      store.undo()
      expect(store.getCellValue(0, 'name')).toBe('Alice')

      store.redo()
      expect(store.getCellValue(0, 'name')).toBe('Alice Updated')
    })

    it('canUndo and canRedo reflect stack state', () => {
      const store = createTestStore()
      expect(store.canUndo()).toBe(false)
      expect(store.canRedo()).toBe(false)

      store.setCellValue(0, 'name', 'X')
      expect(store.canUndo()).toBe(true)
      expect(store.canRedo()).toBe(false)

      store.undo()
      expect(store.canUndo()).toBe(false)
      expect(store.canRedo()).toBe(true)

      store.redo()
      expect(store.canUndo()).toBe(true)
      expect(store.canRedo()).toBe(false)
    })

    it('new edit clears redo stack', () => {
      const store = createTestStore()
      store.setCellValue(0, 'name', 'X')
      store.undo()
      expect(store.canRedo()).toBe(true)

      store.setCellValue(0, 'name', 'Y')
      expect(store.canRedo()).toBe(false)
    })

    it('undo is no-op when stack is empty', () => {
      const store = createTestStore()
      store.undo()
      expect(store.getCellValue(0, 'name')).toBe('Alice')
    })

    it('redo is no-op when stack is empty', () => {
      const store = createTestStore()
      store.redo()
      expect(store.getCellValue(0, 'name')).toBe('Alice')
    })

    it('supports multiple sequential undos', () => {
      const store = createTestStore()
      store.setCellValue(0, 'name', 'X')
      store.setCellValue(0, 'name', 'Y')
      store.setCellValue(0, 'name', 'Z')

      store.undo()
      expect(store.getCellValue(0, 'name')).toBe('Y')

      store.undo()
      expect(store.getCellValue(0, 'name')).toBe('X')

      store.undo()
      expect(store.getCellValue(0, 'name')).toBe('Alice')
    })

    it('undo notifies subscribers', () => {
      const store = createTestStore()
      store.setCellValue(0, 'name', 'X')

      const listener = vi.fn()
      store.subscribe(listener)
      store.undo()
      expect(listener).toHaveBeenCalledOnce()
    })

    it('redo notifies subscribers', () => {
      const store = createTestStore()
      store.setCellValue(0, 'name', 'X')
      store.undo()

      const listener = vi.fn()
      store.subscribe(listener)
      store.redo()
      expect(listener).toHaveBeenCalledOnce()
    })

    it('undo updates sorted/filtered indices', () => {
      const store = createTestStore()
      store.setSort('age', 'asc')

      // Original: Bob(25), Alice(30), Charlie(35)
      expect(store.getSortedFilteredIndices()).toEqual([1, 0, 2])

      store.setCellValue(0, 'age', 10) // Alice -> 10
      // Now: Alice(10), Bob(25), Charlie(35)
      expect(store.getSortedFilteredIndices()).toEqual([0, 1, 2])

      store.undo()
      // Back to: Bob(25), Alice(30), Charlie(35)
      expect(store.getSortedFilteredIndices()).toEqual([1, 0, 2])
    })

    it('batch groups multiple changes into single undo entry', () => {
      const store = createTestStore()
      store.beginBatch()
      store.setCellValue(0, 'name', 'X')
      store.setCellValue(1, 'name', 'Y')
      store.setCellValue(2, 'name', 'Z')
      store.endBatch()

      // All three changes should undo as one
      store.undo()
      expect(store.getCellValue(0, 'name')).toBe('Alice')
      expect(store.getCellValue(1, 'name')).toBe('Bob')
      expect(store.getCellValue(2, 'name')).toBe('Charlie')
    })

    it('endBatch with no changes does not push entry', () => {
      const store = createTestStore()
      store.beginBatch()
      store.endBatch()
      expect(store.canUndo()).toBe(false)
    })

    it('skips no-op setCellValue (same value)', () => {
      const store = createTestStore()
      store.setCellValue(0, 'name', 'Alice') // same as initial
      expect(store.canUndo()).toBe(false)
    })
  })

  describe('reorderRows', () => {
    it('reorders rows correctly', () => {
      const store = createTestStore()
      // Alice(0), Bob(1), Charlie(2) -> Bob(0), Charlie(1), Alice(2)
      store.reorderRows(0, 2)
      const rows = store.getRows()
      expect(rows[0].name).toBe('Bob')
      expect(rows[1].name).toBe('Charlie')
      expect(rows[2].name).toBe('Alice')
    })

    it('clears selection on reorder', () => {
      const store = createTestStore()
      store.setActiveCell({ rowIndex: 0, colIndex: 0 })
      store.reorderRows(0, 2)
      expect(store.getSelection().activeCell).toBeNull()
    })

    it('no-op when fromIndex === toIndex', () => {
      const store = createTestStore()
      const listener = vi.fn()
      store.subscribe(listener)
      store.reorderRows(1, 1)
      expect(listener).not.toHaveBeenCalled()
    })

    it('preserves dirty tracking after reorder', () => {
      const store = createTestStore()
      store.setCellValue(0, 'name', 'Modified')
      expect(store.isDirty()).toBe(true)
      store.reorderRows(0, 2)
      expect(store.isDirty()).toBe(true)
      const changed = store.getChangedRows()
      expect(changed.length).toBe(1)
      // Row was at index 0, now at index 2
      expect(changed[0].rowIndex).toBe(2)
    })

    it('undo reverts reorder', () => {
      const store = createTestStore()
      store.reorderRows(0, 2)
      expect(store.getRows()[0].name).toBe('Bob')
      store.undo()
      expect(store.getRows()[0].name).toBe('Alice')
      expect(store.getRows()[1].name).toBe('Bob')
      expect(store.getRows()[2].name).toBe('Charlie')
    })

    it('redo re-applies reorder', () => {
      const store = createTestStore()
      store.reorderRows(0, 2)
      store.undo()
      store.redo()
      expect(store.getRows()[0].name).toBe('Bob')
      expect(store.getRows()[1].name).toBe('Charlie')
      expect(store.getRows()[2].name).toBe('Alice')
    })

    it('undo reorder then undo cell change', () => {
      const store = createTestStore()
      store.setCellValue(0, 'name', 'Modified')
      store.reorderRows(0, 2)
      // Undo reorder
      store.undo()
      expect(store.getRows()[0].name).toBe('Modified')
      // Undo cell change
      store.undo()
      expect(store.getRows()[0].name).toBe('Alice')
    })
  })
})
