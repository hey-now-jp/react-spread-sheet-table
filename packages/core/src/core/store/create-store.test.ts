import { describe, expect, it, vi } from 'vitest'
import type { ColumnDef } from '../types/column'
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
})
