import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterAll, describe, expect, it, vi } from 'vitest'
import type { ListOptionItem } from '../../core/types'
import { ListEditor } from './ListEditor'

vi.hoisted(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
})

afterAll(() => vi.unstubAllGlobals())

const options: readonly ListOptionItem[] = [
  { value: '11', label: 'Doctor A' },
  { value: '21', label: 'Doctor B' },
]

const renderEditor = (value: string) => {
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container)
  const onChange = vi.fn()
  const onCommit = vi.fn()

  act(() =>
    root.render(
      <ListEditor
        value={value}
        options={options}
        onChange={onChange}
        onCommit={onCommit}
        onCancel={vi.fn()}
      />,
    ),
  )

  const select = container.querySelector('select')
  if (!select) throw new Error('select was not rendered')

  return { container, onChange, onCommit, root, select }
}

const unmount = (root: Root) => act(() => root.unmount())

const pick = (select: HTMLSelectElement, value: string) =>
  act(() => {
    select.value = value
    select.dispatchEvent(new Event('change', { bubbles: true }))
  })

describe('ListEditor', () => {
  // A select whose value matches no option falls back to showing the first one.
  // The operator then sees that option as chosen, so picking it changes nothing,
  // fires no change event and the edit can never be committed.
  it('shows the empty option instead of the first one when the cell is empty', () => {
    const { root, select } = renderEditor('')

    expect(select.value).toBe('')
    expect(select.selectedIndex).toBe(0)
    expect(select.options[0]?.value).toBe('')
    expect(select.options).toHaveLength(options.length + 1)

    unmount(root)
  })

  it('keeps the empty option available once a value is chosen', () => {
    const { root, select } = renderEditor('21')

    expect(select.value).toBe('21')
    expect(select.options[0]?.value).toBe('')
    expect(select.options).toHaveLength(options.length + 1)

    unmount(root)
  })

  it('commits the choice when the operator picks the first option from an empty cell', () => {
    const { onChange, onCommit, root, select } = renderEditor('')

    pick(select, '11')

    expect(onChange).toHaveBeenCalledWith('11')
    expect(onCommit).toHaveBeenCalledOnce()

    unmount(root)
  })

  it('commits an empty value when the operator clears the cell', () => {
    const { onChange, onCommit, root, select } = renderEditor('21')

    pick(select, '')

    expect(onChange).toHaveBeenCalledWith('')
    expect(onCommit).toHaveBeenCalledOnce()

    unmount(root)
  })
})
