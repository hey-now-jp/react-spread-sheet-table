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

describe('ListEditor', () => {
  // A select whose value matches no option falls back to showing the first one.
  // The operator then sees that option as chosen, so picking it changes nothing,
  // fires no change event and the edit can never be committed.
  it('keeps an unmatched value selected instead of falling back to the first option', () => {
    const { root, select } = renderEditor('')

    expect(select.value).toBe('')
    expect(select.selectedIndex).toBe(0)
    expect(select.options[0]?.value).toBe('')
    expect(select.options).toHaveLength(options.length + 1)

    unmount(root)
  })

  it('does not add a placeholder when the value matches an option', () => {
    const { root, select } = renderEditor('21')

    expect(select.value).toBe('21')
    expect(select.options).toHaveLength(options.length)

    unmount(root)
  })

  it('commits the choice when the operator picks the first option from an empty cell', () => {
    const { onChange, onCommit, root, select } = renderEditor('')

    act(() => {
      select.value = '11'
      select.dispatchEvent(new Event('change', { bubbles: true }))
    })

    expect(onChange).toHaveBeenCalledWith('11')
    expect(onCommit).toHaveBeenCalledOnce()

    unmount(root)
  })
})
