import { memo, useEffect, useRef } from 'react'
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
    selectRef.current?.focus()
  }, [])

  return (
    <select
      ref={selectRef}
      className={styles.selectEditor}
      value={value}
      onChange={(e) => {
        onChange(e.target.value)
        onCommit()
      }}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          e.stopPropagation()
          onCancel()
        } else if (e.key === 'Tab') {
          e.stopPropagation()
          onCommit()
        }
      }}
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
