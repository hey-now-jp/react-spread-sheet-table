import { memo, useEffect, useRef } from 'react'
import styles from '../../styles/editor.module.css'

type TimeEditorProps = {
  readonly value: string
  readonly onChange: (value: string) => void
  readonly onCommit: () => void
  readonly onCancel: () => void
  readonly step?: number
}

export const TimeEditor = memo(function TimeEditor({
  value,
  onChange,
  onCommit,
  onCancel,
  step,
}: TimeEditorProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  return (
    <input
      ref={inputRef}
      className={styles.editorInput}
      type="time"
      value={value}
      step={step}
      onChange={(e) => {
        onChange(e.target.value)
      }}
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
