import { memo, useCallback, useEffect, useRef } from 'react'
import styles from '../../styles/editor.module.css'

type ListEditorProps = {
  readonly value: string
  readonly options: readonly string[]
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

  return (
    <select
      ref={selectRef}
      className={styles.selectEditor}
      value={value}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      onBlur={onCommit}
    >
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  )
})
