import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterAll, afterEach, describe, expect, it, vi } from 'vitest'
import type { TableInstance } from '../core/types'
import { useSpreadSheetTable } from '../hooks/use-spread-sheet-table'
import { SpreadSheetTable } from './SpreadSheetTable'

type TestRow = {
  id: string
  minutes: number
}

type InternalTableInstance = TableInstance<TestRow> & {
  __handleCellChange: (
    rowIndex: number,
    columnKey: keyof TestRow,
    value: TestRow[keyof TestRow],
  ) => void
}

vi.hoisted(() => {
  class ResizeObserverStub {
    disconnect() {}
    observe() {}
    unobserve() {}
  }

  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  vi.stubGlobal('ResizeObserver', ResizeObserverStub)
})

afterAll(() => vi.unstubAllGlobals())

const renderRejectedEdit = (showValidationToast?: boolean) => {
  const container = document.createElement('div')
  const root = createRoot(container)
  const onRowChangeRejected = vi.fn()
  let table: InternalTableInstance | undefined

  const Harness = ({ showToast }: { showToast?: boolean }) => {
    table = useSpreadSheetTable<TestRow>({
      columns: [{ type: 'number', key: 'minutes', header: 'Minutes' }],
      initialData: [{ id: 'row-1', minutes: 30 }],
      rowKey: 'id',
      processRowChange: () => ({
        status: 'rejected',
        issues: [
          {
            columnKey: 'minutes',
            result: { level: 'error', message: 'Minutes are invalid' },
          },
        ],
      }),
      onRowChangeRejected,
    }) as InternalTableInstance

    return <SpreadSheetTable table={table} showValidationToast={showToast} />
  }

  act(() => root.render(<Harness showToast={showValidationToast} />))
  act(() => table?.__handleCellChange(0, 'minutes', 1000))

  return {
    container,
    onRowChangeRejected,
    root,
    rerender: (showToast?: boolean) => act(() => root.render(<Harness showToast={showToast} />)),
  }
}

const unmount = (root: Root) => act(() => root.unmount())

describe('SpreadSheetTable validation toast', () => {
  it('shows rejected edit errors by default', () => {
    const { container, root } = renderRejectedEdit()

    expect(container).toHaveTextContent('入力エラー')
    expect(container).toHaveTextContent('Minutes are invalid')

    unmount(root)
  })

  it('does not show rejected edit errors when the toast is disabled', () => {
    const { container, onRowChangeRejected, root } = renderRejectedEdit(false)

    expect(container).not.toHaveTextContent('入力エラー')
    expect(container).not.toHaveTextContent('Minutes are invalid')
    expect(onRowChangeRejected).toHaveBeenCalledOnce()

    unmount(root)
  })

  it('does not retain errors that occurred while the toast was disabled', () => {
    const { container, rerender, root } = renderRejectedEdit(false)

    rerender(true)

    expect(container).not.toHaveTextContent('入力エラー')
    expect(container).not.toHaveTextContent('Minutes are invalid')

    unmount(root)
  })
})

describe('SpreadSheetTable wrapper focus', () => {
  let cleanups: Array<() => void> = []

  afterEach(() => {
    for (const fn of cleanups) fn()
    cleanups = []
    vi.restoreAllMocks()
  })

  const renderTable = () => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    const root = createRoot(container)
    cleanups.push(() => {
      act(() => root.unmount())
      container.remove()
    })

    const Harness = () => {
      const table = useSpreadSheetTable({
        columns: [{ type: 'text', key: 'name', header: 'Name' }],
        initialData: [{ id: 'row-1', name: 'Alice' }],
        rowKey: 'id',
      })
      return <SpreadSheetTable table={table} />
    }

    act(() => root.render(<Harness />))

    const wrapper = container.querySelector<HTMLElement>('[tabindex="0"]')
    const cell = container.querySelector<HTMLElement>('[data-row="0"][data-col="0"]')
    if (!wrapper || !cell) throw new Error('table elements not found')
    return { wrapper, cell }
  }

  it('focuses the wrapper with preventScroll on cell mousedown', () => {
    const { wrapper, cell } = renderTable()
    const focusSpy = vi.spyOn(wrapper, 'focus')

    act(() => {
      cell.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, button: 0 }))
    })

    expect(focusSpy).toHaveBeenCalledExactlyOnceWith({ preventScroll: true })
  })

  it('refocuses the wrapper with preventScroll when editing ends', () => {
    const { wrapper, cell } = renderTable()

    act(() => {
      cell.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }))
    })
    const input = cell.querySelector('input')
    if (!input) throw new Error('editor input not found')

    const focusSpy = vi.spyOn(wrapper, 'focus')
    act(() => {
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    })

    expect(cell.querySelector('input')).toBeNull()
    expect(focusSpy).toHaveBeenCalledExactlyOnceWith({ preventScroll: true })
  })
})
