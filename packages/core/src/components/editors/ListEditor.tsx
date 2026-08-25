import { memo, useCallback, useEffect, useRef } from 'react'
import type { ListOptionItem } from '../../core/types'
import styles from '../../styles/editor.module.css'

type ListEditorProps = {
  readonly value: string
  readonly options: readonly ListOptionItem[]
  readonly onChange: (value: string) => void
  readonly onCommit: () => void
  readonly onCancel: () => void
}

export const ListEditor = memo(function ListEditor({
  value,
  options,
  onChange,
  onCommit,
  onCancel,
}: ListEditorProps) {
  const selectRef = useRef<HTMLSelectElement>(null)

  useEffect(() => {
    const select = selectRef.current
    if (!select) return
    select.focus()
    try {
      select.showPicker()
    } catch {
      // showPicker not supported in this browser
    }
  }, [])

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      onChange(e.target.value)
      onCommit()
    },
    [onChange, onCommit],
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onCancel()
      } else if (e.key === 'Enter') {
        e.stopPropagation()
        onCommit()
      } else if (e.key === 'Tab') {
        e.stopPropagation()
        onCommit()
      }
    },
    [onCommit, onCancel],
  )

  // 選択肢に無い値（未選択の空文字など）を表す option。
  // これが無いと、value に一致する option を持たない select はブラウザが先頭の
  // option を表示してしまう。利用者にはその項目が選ばれて見えるため、同じ項目を
  // 選んでも値が変わらず change が発火せず、確定できない。
  const hasMatchingOption = options.some((opt) => opt.value === value)

  return (
    <select
      ref={selectRef}
      className={styles.selectEditor}
      value={value}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      onBlur={onCommit}
    >
      {!hasMatchingOption && <option value={value} />}
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  )
})
