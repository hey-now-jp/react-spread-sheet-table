import { memo, useCallback, useEffect, useRef } from 'react'
import styles from '../../styles/editor.module.css'

type NumberEditorProps = {
  readonly value: string
  readonly onChange: (value: string) => void
  readonly onCommit: () => void
  readonly onCancel: () => void
  readonly min?: number
  readonly max?: number
  readonly step?: number
}

export const NumberEditor = memo(function NumberEditor({
  value,
  onChange,
  onCommit,
  onCancel,
  min,
  max,
  step,
}: NumberEditorProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
    inputRef.current?.select()
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
      className={`${styles.editorInput} ${styles.numberEditor}`}
      type="number"
      value={value}
      min={min}
      max={max}
      step={step}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      onBlur={onCommit}
    />
  )
})
