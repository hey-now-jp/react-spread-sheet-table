import { memo, useCallback, useEffect, useRef } from 'react'
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
      type="text"
      value={value}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      onBlur={onCommit}
    />
  )
})
