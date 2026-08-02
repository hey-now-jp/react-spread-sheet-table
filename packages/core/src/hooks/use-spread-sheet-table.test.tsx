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
    const { getTable, root } = renderTableHook({
      columns,
      initialData,
      rowKey: 'id',
      onChange,
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
    expect(onRowChangeRejected).toHaveBeenCalledWith([
      {
        rowIndex: 0,
        columnKey: 'startTime',
        result: { level: 'error', message: 'This shift overlaps another shift' },
      },
    ])

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
    expect(onRowChangeRejected).toHaveBeenCalledWith([
      {
        rowIndex: 1,
        columnKey: 'startTime',
        result: { level: 'error', message: 'This shift overlaps another shift' },
      },
    ])

    act(() => root.unmount())
  })
})
