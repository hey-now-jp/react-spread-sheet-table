import { act, createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { describe, expect, it, vi } from 'vitest'
import type {
  CellValidationError,
  ColumnDef,
  ProcessRowChange,
  TableInstance,
  UseSpreadSheetTableOptions,
} from '../core/types'
import type { CellUpdate } from '../core/validation/cell-update-validation'
import { useSpreadSheetTable } from './use-spread-sheet-table'

type ShiftRow = {
  id: string
  startTime: string
  endTime: string
}

type InternalTableInstance<T> = TableInstance<T> & {
  __handleCellChange: (rowIndex: number, columnKey: keyof T, value: T[keyof T]) => void
  __handleBatchCellChanges: (updates: ReadonlyArray<CellUpdate<T>>) => {
    readonly committed: boolean
    readonly errors: ReadonlyArray<CellValidationError>
  }
  __handleClearCells: (updates: ReadonlyArray<CellUpdate<T>>) => {
    readonly committed: boolean
    readonly errors: ReadonlyArray<CellValidationError>
  }
}

const columns: ReadonlyArray<ColumnDef<ShiftRow>> = [
  { type: 'time', key: 'startTime', header: 'Start' },
  { type: 'time', key: 'endTime', header: 'End' },
]

const initialData: ReadonlyArray<ShiftRow> = [
  { id: 'shift-1', startTime: '09:00', endTime: '09:30' },
  { id: 'shift-2', startTime: '10:00', endTime: '10:30' },
]

function renderTableHook(options: UseSpreadSheetTableOptions<ShiftRow>): {
  readonly getTable: () => InternalTableInstance<ShiftRow>
  readonly root: Root
} {
  const container = document.createElement('div')
  const root = createRoot(container)
  let currentTable: InternalTableInstance<ShiftRow> | undefined

  function Harness() {
    currentTable = useSpreadSheetTable(options) as InternalTableInstance<ShiftRow>
    return null
  }

  act(() => root.render(createElement(Harness)))

  return {
    getTable: () => {
      if (currentTable === undefined) throw new Error('Table hook did not render')
      return currentTable
    },
    root,
  }
}

describe('useSpreadSheetTable row processing', () => {
  it('commits a normalized row as one undoable change', () => {
    const onChange = vi.fn()
    const onRowChangeCommitted = vi.fn()
    const { getTable, root } = renderTableHook({
      columns,
      initialData,
      rowKey: 'id',
      onChange,
      onRowChangeCommitted,
      processRowChange: (candidate) => ({
        status: 'accepted',
        row: { ...candidate, endTime: '10:00' },
      }),
    })

    act(() => getTable().__handleCellChange(0, 'startTime', '09:30'))

    expect(getTable().getData()[0]).toEqual({
      id: 'shift-1',
      startTime: '09:30',
      endTime: '10:00',
    })
    expect(onChange).toHaveBeenCalledOnce()
    expect(onChange.mock.calls[0]).toHaveLength(1)
    expect(onRowChangeCommitted).toHaveBeenCalledWith({
      source: 'edit',
      rows: [
        {
          rowIndex: 0,
          previousRow: initialData[0],
          row: {
            id: 'shift-1',
            startTime: '09:30',
            endTime: '10:00',
          },
          changes: [
            { key: 'startTime', previousValue: '09:00', newValue: '09:30' },
            { key: 'endTime', previousValue: '09:30', newValue: '10:00' },
          ],
        },
      ],
    })

    act(() => getTable().undo())
    expect(getTable().getData()[0]).toEqual(initialData[0])

    act(() => root.unmount())
  })

  it('keeps data unchanged and reports rejected changes', () => {
    const onChange = vi.fn()
    const onRowChangeRejected = vi.fn()
    const { getTable, root } = renderTableHook({
      columns,
      initialData,
      rowKey: 'id',
      onChange,
      onRowChangeRejected,
      processRowChange: () => ({
        status: 'rejected',
        issues: [
          {
            columnKey: 'startTime',
            result: { level: 'error', message: 'This shift overlaps another shift' },
          },
        ],
      }),
    })

    act(() => getTable().__handleCellChange(0, 'startTime', '09:30'))

    expect(getTable().getData()).toEqual(initialData)
    expect(onChange).not.toHaveBeenCalled()
    expect(onRowChangeRejected).toHaveBeenCalledWith({
      source: 'edit',
      errors: [
        {
          rowIndex: 0,
          columnKey: 'startTime',
          result: { level: 'error', message: 'This shift overlaps another shift' },
        },
      ],
      rows: [
        {
          rowIndex: 0,
          previousRow: initialData[0],
          candidateRow: {
            id: 'shift-1',
            startTime: '09:30',
            endTime: '09:30',
          },
          issues: [
            {
              columnKey: 'startTime',
              result: { level: 'error', message: 'This shift overlaps another shift' },
            },
          ],
        },
      ],
    })

    act(() => root.unmount())
  })

  it('rejects a multi-row paste atomically', () => {
    const onChange = vi.fn()
    const onRowChangeRejected = vi.fn()
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
    const { getTable, root } = renderTableHook({
      columns,
      initialData,
      rowKey: 'id',
      onChange,
      onRowChangeRejected,
      processRowChange,
    })

    let result: ReturnType<InternalTableInstance<ShiftRow>['__handleBatchCellChanges']> | undefined
    act(() => {
      result = getTable().__handleBatchCellChanges([
        { rowIndex: 0, columnKey: 'startTime', value: '11:00' },
        { rowIndex: 1, columnKey: 'startTime', value: '11:30' },
      ])
    })

    expect(result?.committed).toBe(false)
    expect(getTable().getData()).toEqual(initialData)
    expect(onChange).not.toHaveBeenCalled()
    expect(onRowChangeRejected).toHaveBeenCalledWith({
      source: 'paste',
      errors: [
        {
          rowIndex: 1,
          columnKey: 'startTime',
          result: { level: 'error', message: 'This shift overlaps another shift' },
        },
      ],
      rows: [
        {
          rowIndex: 1,
          previousRow: initialData[1],
          candidateRow: {
            id: 'shift-2',
            startTime: '11:30',
            endTime: '10:30',
          },
          issues: [
            {
              columnKey: 'startTime',
              result: { level: 'error', message: 'This shift overlaps another shift' },
            },
          ],
        },
      ],
    })

    act(() => root.unmount())
  })

  it('reports a multi-row paste as one committed operation', () => {
    const onChange = vi.fn()
    const onRowChangeCommitted = vi.fn()
    const { getTable, root } = renderTableHook({
      columns,
      initialData,
      rowKey: 'id',
      onChange,
      onRowChangeCommitted,
    })

    act(() => {
      getTable().__handleBatchCellChanges([
        { rowIndex: 0, columnKey: 'startTime', value: '11:00' },
        { rowIndex: 1, columnKey: 'startTime', value: '11:30' },
      ])
    })

    expect(onChange).toHaveBeenCalledOnce()
    expect(onRowChangeCommitted).toHaveBeenCalledOnce()
    expect(onRowChangeCommitted).toHaveBeenCalledWith({
      source: 'paste',
      rows: [
        {
          rowIndex: 0,
          previousRow: initialData[0],
          row: { ...initialData[0], startTime: '11:00' },
          changes: [{ key: 'startTime', previousValue: '09:00', newValue: '11:00' }],
        },
        {
          rowIndex: 1,
          previousRow: initialData[1],
          row: { ...initialData[1], startTime: '11:30' },
          changes: [{ key: 'startTime', previousValue: '10:00', newValue: '11:30' }],
        },
      ],
    })

    act(() => root.unmount())
  })

  it('rejects a multi-cell clear atomically', () => {
    const onChange = vi.fn()
    const onRowChangeRejected = vi.fn()
    const processRowChange: ProcessRowChange<ShiftRow> = (candidate, _previous, context) => {
      if (context.rowIndex === 1) {
        return {
          status: 'rejected',
          issues: [
            {
              columnKey: 'startTime',
              result: { level: 'error', message: 'Assigned shifts cannot be cleared' },
            },
          ],
        }
      }
      return { status: 'accepted', row: candidate }
    }
    const { getTable, root } = renderTableHook({
      columns,
      initialData,
      rowKey: 'id',
      onChange,
      onRowChangeRejected,
      processRowChange,
    })

    let result: ReturnType<InternalTableInstance<ShiftRow>['__handleClearCells']> | undefined
    act(() => {
      result = getTable().__handleClearCells([
        { rowIndex: 0, columnKey: 'startTime', value: '' },
        { rowIndex: 1, columnKey: 'startTime', value: '' },
      ])
    })

    expect(result?.committed).toBe(false)
    expect(getTable().getData()).toEqual(initialData)
    expect(onChange).not.toHaveBeenCalled()
    expect(onRowChangeRejected).toHaveBeenCalledOnce()

    act(() => root.unmount())
  })

  it('commits a multi-cell clear as one undoable change', () => {
    const onChange = vi.fn()
    const { getTable, root } = renderTableHook({
      columns,
      initialData,
      rowKey: 'id',
      onChange,
      processRowChange: (candidate) => ({ status: 'accepted', row: candidate }),
    })

    act(() => {
      getTable().__handleClearCells([
        { rowIndex: 0, columnKey: 'startTime', value: '' },
        { rowIndex: 1, columnKey: 'startTime', value: '' },
      ])
    })

    expect(
      getTable()
        .getData()
        .map((row) => row.startTime),
    ).toEqual(['', ''])
    expect(onChange).toHaveBeenCalledOnce()

    act(() => getTable().undo())
    expect(getTable().getData()).toEqual(initialData)

    act(() => root.unmount())
  })
})
