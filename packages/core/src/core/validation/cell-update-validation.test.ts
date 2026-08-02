import { describe, expect, it, vi } from 'vitest'
import type { ColumnDef } from '../types'
import { validateCellUpdates } from './cell-update-validation'

type TestRow = {
  id: string
  doctorId: string
  assistantId: string
  minutes: number
}

const columns: ReadonlyArray<ColumnDef<TestRow>> = [
  { type: 'list', key: 'doctorId', header: 'Doctor', options: [{ value: '1', label: 'Doctor' }] },
  {
    type: 'list',
    key: 'assistantId',
    header: 'Assistant',
    options: [{ value: '2', label: 'Assistant' }],
  },
  { type: 'number', key: 'minutes', header: 'Minutes', min: 0, max: 999 },
]

const rows: ReadonlyArray<TestRow> = [{ id: 'row-1', doctorId: '', assistantId: '', minutes: 30 }]

describe('validateCellUpdates', () => {
  it('returns built-in validation errors for candidate values', () => {
    const result = validateCellUpdates(rows, columns, [
      { rowIndex: 0, columnKey: 'minutes', value: 1000 },
    ])

    expect(result).toEqual([
      {
        rowIndex: 0,
        columnKey: 'minutes',
        result: { level: 'error', message: '最大値は999です' },
      },
    ])
  })

  it('passes the final multi-cell candidate row to custom validation', () => {
    const validate = vi.fn((value: unknown, row: TestRow, columnKey: keyof TestRow) => {
      if (columnKey === 'assistantId' && value && !row.doctorId) {
        return { level: 'error' as const, message: 'Doctor is required' }
      }
      return null
    })

    const result = validateCellUpdates(
      rows,
      columns,
      [
        { rowIndex: 0, columnKey: 'doctorId', value: '1' },
        { rowIndex: 0, columnKey: 'assistantId', value: '2' },
      ],
      validate,
    )

    expect(result).toEqual([])
    expect(validate).toHaveBeenCalledWith(
      '2',
      { id: 'row-1', doctorId: '1', assistantId: '2', minutes: 30 },
      'assistantId',
    )
  })

  it('preserves warnings so the caller can commit them', () => {
    const result = validateCellUpdates(
      rows,
      columns,
      [{ rowIndex: 0, columnKey: 'minutes', value: 120 }],
      () => ({ level: 'warn', message: 'Please confirm the duration' }),
    )

    expect(result).toEqual([
      {
        rowIndex: 0,
        columnKey: 'minutes',
        result: { level: 'warn', message: 'Please confirm the duration' },
      },
    ])
  })
})
