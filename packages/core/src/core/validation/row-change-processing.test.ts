import { describe, expect, it, vi } from 'vitest'
import type { ProcessRowChange } from '../types'
import type { CellUpdate } from './cell-update-validation'
import { prepareCellUpdates } from './row-change-processing'

type ShiftRow = {
  id: string
  startTime: string
  endTime: string
  note: string
}

const rows: ReadonlyArray<ShiftRow> = [
  { id: 'shift-1', startTime: '09:00', endTime: '09:30', note: '' },
  { id: 'shift-2', startTime: '10:00', endTime: '10:30', note: '' },
]

describe('prepareCellUpdates', () => {
  it('returns updates for values normalized by the row processor', () => {
    const processRowChange = vi.fn<ProcessRowChange<ShiftRow>>(
      (candidate, _previous, _context) => ({
        status: 'accepted',
        row: { ...candidate, endTime: '10:00' },
      }),
    )
    const updates: ReadonlyArray<CellUpdate<ShiftRow>> = [
      { rowIndex: 0, columnKey: 'startTime', value: '09:30' },
    ]

    const result = prepareCellUpdates(rows, updates, 'edit', processRowChange)

    expect(result).toEqual({
      accepted: true,
      updates: [
        { rowIndex: 0, columnKey: 'startTime', value: '09:30' },
        { rowIndex: 0, columnKey: 'endTime', value: '10:00' },
      ],
    })
    expect(processRowChange).toHaveBeenCalledWith(
      { id: 'shift-1', startTime: '09:30', endTime: '09:30', note: '' },
      rows[0],
      {
        rowIndex: 0,
        source: 'edit',
        changes: [{ key: 'startTime', previousValue: '09:00', newValue: '09:30' }],
      },
    )
  })

  it('rejects the complete transaction with row-indexed errors', () => {
    const processRowChange: ProcessRowChange<ShiftRow> = (candidate, _previous, context) => {
      if (context.rowIndex === 1) {
        return {
          status: 'rejected',
          issues: [
            {
              columnKey: 'startTime',
              result: { level: 'error', message: 'This shift overlaps another shift' },
            },
          ],
        }
      }
      return { status: 'accepted', row: candidate }
    }
    const updates: ReadonlyArray<CellUpdate<ShiftRow>> = [
      { rowIndex: 0, columnKey: 'note', value: 'first' },
      { rowIndex: 1, columnKey: 'startTime', value: '09:15' },
    ]

    const result = prepareCellUpdates(rows, updates, 'paste', processRowChange)

    expect(result).toEqual({
      accepted: false,
      errors: [
        {
          rowIndex: 1,
          columnKey: 'startTime',
          result: { level: 'error', message: 'This shift overlaps another shift' },
        },
      ],
    })
  })

  it('passes the complete multi-cell row candidate to the processor once', () => {
    const processRowChange = vi.fn<ProcessRowChange<ShiftRow>>((candidate) => ({
      status: 'accepted',
      row: candidate,
    }))
    const updates: ReadonlyArray<CellUpdate<ShiftRow>> = [
      { rowIndex: 0, columnKey: 'startTime', value: '13:00' },
      { rowIndex: 0, columnKey: 'endTime', value: '14:00' },
    ]

    prepareCellUpdates(rows, updates, 'paste', processRowChange)

    expect(processRowChange).toHaveBeenCalledOnce()
    expect(processRowChange.mock.calls[0]?.[0]).toEqual({
      id: 'shift-1',
      startTime: '13:00',
      endTime: '14:00',
      note: '',
    })
  })
})
