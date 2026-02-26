import { describe, expect, it } from 'vitest'
import type { DataColumnDef } from '../types'
import { runValidation, validateCellValue } from './validation-utils'

type TestRow = { id: string; name: string; age: number; date: string; time: string }

describe('validateCellValue', () => {
  it('validates required field - empty string', () => {
    const column: DataColumnDef<TestRow> = {
      type: 'text',
      key: 'name',
      header: 'Name',
      required: true,
    }
    const result = validateCellValue('', column, { id: '1', name: '', age: 0, date: '', time: '' })
    expect(result).toEqual({ level: 'error', message: 'この項目は必須です' })
  })

  it('validates required field - null', () => {
    const column: DataColumnDef<TestRow> = {
      type: 'text',
      key: 'name',
      header: 'Name',
      required: true,
    }
    const result = validateCellValue(null, column, {
      id: '1',
      name: '',
      age: 0,
      date: '',
      time: '',
    })
    expect(result).toEqual({ level: 'error', message: 'この項目は必須です' })
  })

  it('passes when required field has value', () => {
    const column: DataColumnDef<TestRow> = {
      type: 'text',
      key: 'name',
      header: 'Name',
      required: true,
    }
    const result = validateCellValue('Alice', column, {
      id: '1',
      name: 'Alice',
      age: 0,
      date: '',
      time: '',
    })
    expect(result).toBeNull()
  })

  it('validates text maxLength', () => {
    const column: DataColumnDef<TestRow> = {
      type: 'text',
      key: 'name',
      header: 'Name',
      maxLength: 3,
    }
    const result = validateCellValue('Alice', column, {
      id: '1',
      name: 'Alice',
      age: 0,
      date: '',
      time: '',
    })
    expect(result?.level).toBe('error')
  })

  it('passes text within maxLength', () => {
    const column: DataColumnDef<TestRow> = {
      type: 'text',
      key: 'name',
      header: 'Name',
      maxLength: 10,
    }
    const result = validateCellValue('Alice', column, {
      id: '1',
      name: 'Alice',
      age: 0,
      date: '',
      time: '',
    })
    expect(result).toBeNull()
  })

  it('validates text pattern', () => {
    const column: DataColumnDef<TestRow> = {
      type: 'text',
      key: 'name',
      header: 'Name',
      pattern: /^[A-Z]/,
    }
    const result = validateCellValue('alice', column, {
      id: '1',
      name: 'alice',
      age: 0,
      date: '',
      time: '',
    })
    expect(result?.level).toBe('error')
  })

  it('validates number min', () => {
    const column: DataColumnDef<TestRow> = { type: 'number', key: 'age', header: 'Age', min: 0 }
    const result = validateCellValue(-1, column, { id: '1', name: '', age: -1, date: '', time: '' })
    expect(result).toEqual({ level: 'error', message: '最小値は0です' })
  })

  it('validates number max', () => {
    const column: DataColumnDef<TestRow> = { type: 'number', key: 'age', header: 'Age', max: 150 }
    const result = validateCellValue(200, column, {
      id: '1',
      name: '',
      age: 200,
      date: '',
      time: '',
    })
    expect(result).toEqual({ level: 'error', message: '最大値は150です' })
  })

  it('passes number within range', () => {
    const column: DataColumnDef<TestRow> = {
      type: 'number',
      key: 'age',
      header: 'Age',
      min: 0,
      max: 150,
    }
    const result = validateCellValue(30, column, { id: '1', name: '', age: 30, date: '', time: '' })
    expect(result).toBeNull()
  })

  it('validates date minDate', () => {
    const column: DataColumnDef<TestRow> = {
      type: 'date',
      key: 'date',
      header: 'Date',
      minDate: '2024-01-01',
    }
    const result = validateCellValue('2023-12-31', column, {
      id: '1',
      name: '',
      age: 0,
      date: '2023-12-31',
      time: '',
    })
    expect(result?.level).toBe('error')
  })

  it('validates time format', () => {
    const column: DataColumnDef<TestRow> = { type: 'time', key: 'time', header: 'Time' }
    const result = validateCellValue('invalid', column, {
      id: '1',
      name: '',
      age: 0,
      date: '',
      time: 'invalid',
    })
    expect(result?.level).toBe('error')
  })

  it('passes valid time', () => {
    const column: DataColumnDef<TestRow> = { type: 'time', key: 'time', header: 'Time' }
    const result = validateCellValue('09:30', column, {
      id: '1',
      name: '',
      age: 0,
      date: '',
      time: '09:30',
    })
    expect(result).toBeNull()
  })

  it('returns null for empty non-required field', () => {
    const column: DataColumnDef<TestRow> = { type: 'text', key: 'name', header: 'Name' }
    const result = validateCellValue('', column, { id: '1', name: '', age: 0, date: '', time: '' })
    expect(result).toBeNull()
  })
})

describe('runValidation', () => {
  it('collects errors from all rows and columns', () => {
    const columns: ReadonlyArray<DataColumnDef<TestRow>> = [
      { type: 'text', key: 'name', header: 'Name', required: true },
      { type: 'number', key: 'age', header: 'Age', min: 0 },
    ]
    const rows: ReadonlyArray<TestRow> = [
      { id: '1', name: '', age: -1, date: '', time: '' },
      { id: '2', name: 'Bob', age: 25, date: '', time: '' },
    ]

    const errors = runValidation(rows, columns)
    expect(errors).toHaveLength(2) // name required, age min
    expect(errors[0].columnKey).toBe('name')
    expect(errors[1].columnKey).toBe('age')
  })

  it('runs custom validation', () => {
    const columns: ReadonlyArray<DataColumnDef<TestRow>> = [
      { type: 'text', key: 'name', header: 'Name' },
    ]
    const rows: ReadonlyArray<TestRow> = [{ id: '1', name: 'Test', age: 0, date: '', time: '' }]
    const customValidate = (_value: unknown, _row: TestRow, _key: keyof TestRow) => {
      return { level: 'warn' as const, message: 'Custom warning' }
    }

    const errors = runValidation(rows, columns, customValidate)
    expect(errors).toHaveLength(1)
    expect(errors[0].result.level).toBe('warn')
  })
})
