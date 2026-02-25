import { memo, useEffect, useRef } from 'react'
import styles from '../../styles/editor.module.css'

type TextEditorProps = {
  readonly value: string
  readonly onChange: (value: string) => void
  readonly onCommit: () => void
  readonly onCancel: () => void
}

export const TextEditor = memo(function TextEditor({
  value,
  onChange,
  onCommit,
  onCancel,
}: TextEditorProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [])

  return (
    <input
      ref={inputRef}
      className={styles.editorInput}
      type="text"
      value={value}
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
