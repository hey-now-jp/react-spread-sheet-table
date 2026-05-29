import { describe, expect, it } from 'vitest'
import type { ActionColumnDef, ColumnDef, DataColumnDef, ListOptionItem } from './column'
import { findOptionLabel, isActionColumn, isDataColumn } from './column'

type Employee = {
  id: string
  name: string
  age: number
  joinDate: string
  active: boolean
  department: string
}

describe('isDataColumn', () => {
  it('returns true for text column', () => {
    const col: ColumnDef<Employee> = {
      key: 'name',
      header: 'Name',
      type: 'text',
    }
    expect(isDataColumn(col)).toBe(true)
  })

  it('returns true for number column', () => {
    const col: ColumnDef<Employee> = {
      key: 'age',
      header: 'Age',
      type: 'number',
      min: 0,
      max: 150,
    }
    expect(isDataColumn(col)).toBe(true)
  })

  it('returns true for date column', () => {
    const col: ColumnDef<Employee> = {
      key: 'joinDate',
      header: 'Join Date',
      type: 'date',
    }
    expect(isDataColumn(col)).toBe(true)
  })

  it('returns true for boolean column', () => {
    const col: ColumnDef<Employee> = {
      key: 'active',
      header: 'Active',
      type: 'boolean',
    }
    expect(isDataColumn(col)).toBe(true)
  })

  it('returns true for list column', () => {
    const col: ColumnDef<Employee> = {
      key: 'department',
      header: 'Department',
      type: 'list',
      options: [
        { value: 'eng', label: 'Engineering' },
        { value: 'sales', label: 'Sales' },
      ],
    }
    expect(isDataColumn(col)).toBe(true)
  })

  it('returns false for action column', () => {
    const col: ColumnDef<Employee> = {
      key: 'actions',
      type: 'action',
      render: () => null,
    }
    expect(isDataColumn(col)).toBe(false)
  })
})

describe('isActionColumn', () => {
  it('returns true for action column', () => {
    const col: ColumnDef<Employee> = {
      key: 'actions',
      type: 'action',
      render: () => null,
    }
    expect(isActionColumn(col)).toBe(true)
  })

  it('returns false for data column', () => {
    const col: ColumnDef<Employee> = {
      key: 'name',
      header: 'Name',
      type: 'text',
    }
    expect(isActionColumn(col)).toBe(false)
  })
})

describe('type safety', () => {
  it('narrows to DataColumnDef after type guard', () => {
    const col: ColumnDef<Employee> = {
      key: 'age',
      header: 'Age',
      type: 'number',
      min: 0,
    }

    if (isDataColumn(col)) {
      // TypeScript should narrow this to DataColumnDef<Employee>
      const dataCol: DataColumnDef<Employee> = col
      expect(dataCol.key).toBe('age')
    }
  })

  it('narrows to ActionColumnDef after type guard', () => {
    const col: ColumnDef<Employee> = {
      key: 'actions',
      type: 'action',
      render: () => null,
      pin: 'right',
    }

    if (isActionColumn(col)) {
      const actionCol: ActionColumnDef<Employee> = col
      expect(actionCol.pin).toBe('right')
    }
  })

  it('filters columns by type', () => {
    const columns: ReadonlyArray<ColumnDef<Employee>> = [
      { key: 'name', header: 'Name', type: 'text' },
      { key: 'age', header: 'Age', type: 'number' },
      { key: 'actions', type: 'action', render: () => null },
    ]

    const dataColumns = columns.filter(isDataColumn)
    const actionColumns = columns.filter(isActionColumn)

    expect(dataColumns).toHaveLength(2)
    expect(actionColumns).toHaveLength(1)
  })
})

describe('findOptionLabel', () => {
  it('finds label from object options', () => {
    const options: readonly ListOptionItem[] = [
      { value: 'eng', label: 'Engineering' },
      { value: 'sales', label: 'Sales' },
    ]
    expect(findOptionLabel(options, 'eng')).toBe('Engineering')
    expect(findOptionLabel(options, 'sales')).toBe('Sales')
  })

  it('falls back to the value itself when not found', () => {
    const options: readonly ListOptionItem[] = [{ value: 'eng', label: 'Engineering' }]
    expect(findOptionLabel(options, 'unknown')).toBe('unknown')
  })

  it('returns the value when options is empty', () => {
    expect(findOptionLabel([], 'anything')).toBe('anything')
  })

  it('matches object option by value, not by label', () => {
    const options: readonly ListOptionItem[] = [{ value: 'eng', label: '技術部' }]
    expect(findOptionLabel(options, 'eng')).toBe('技術部')
    expect(findOptionLabel(options, '技術部')).toBe('技術部')
  })
})
