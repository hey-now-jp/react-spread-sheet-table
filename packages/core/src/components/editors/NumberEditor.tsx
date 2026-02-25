import { memo, useEffect, useRef } from 'react'
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

  return (
    <input
      ref={inputRef}
      className={`${styles.editorInput} ${styles.numberEditor}`}
      type="number"
      value={value}
      min={min}
      max={max}
      step={step}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => {
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
      }}
      onBlur={onCommit}
    />
  )
})
