import { memo, useCallback, useEffect, useRef } from 'react'
import styles from '../../styles/editor.module.css'

type DateEditorProps = {
  readonly value: string
  readonly onChange: (value: string) => void
  readonly onCommit: () => void
  readonly onCancel: () => void
  readonly minDate?: string
  readonly maxDate?: string
}

export const DateEditor = memo(function DateEditor({
  value,
  onChange,
  onCommit,
  onCancel,
  minDate,
  maxDate,
}: DateEditorProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value),
    [onChange],
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
    <input
      ref={inputRef}
      className={styles.editorInput}
      type="date"
      value={value}
      min={minDate}
      max={maxDate}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      onBlur={onCommit}
    />
  )
})
