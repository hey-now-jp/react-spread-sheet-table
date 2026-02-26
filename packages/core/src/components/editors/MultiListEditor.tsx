import { memo, useCallback, useEffect, useRef } from 'react'
import styles from '../../styles/editor.module.css'

type MultiListEditorProps = {
  readonly value: string
  readonly options: readonly string[]
  readonly onChange: (value: string) => void
  readonly onCommit: () => void
  readonly onCancel: () => void
}

function parseSelected(value: string): readonly string[] {
  try {
    const parsed = JSON.parse(value)
    if (Array.isArray(parsed)) return parsed
  } catch {
    // fallback
  }
  if (value === '') return []
  return value
    .split(',')
    .map((v) => v.trim())
    .filter((v) => v !== '')
}

export const MultiListEditor = memo(function MultiListEditor({
  value,
  options,
  onChange,
  onCommit,
  onCancel,
}: MultiListEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    containerRef.current?.focus()
  }, [])

  const selected = parseSelected(value)

  const handleToggle = useCallback(
    (option: string) => {
      const current = parseSelected(value)
      const next = current.includes(option)
        ? current.filter((v) => v !== option)
        : [...current, option]
      onChange(JSON.stringify(next))
    },
    [value, onChange],
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
    <div
      ref={containerRef}
      className={styles.multiListEditor}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <div className={styles.multiListOptions}>
        {options.map((opt) => (
          <label key={opt} className={styles.multiListOption}>
            <input
              type="checkbox"
              checked={selected.includes(opt)}
              onChange={() => handleToggle(opt)}
            />
            <span>{opt}</span>
          </label>
        ))}
      </div>
      <div className={styles.multiListActions}>
        <button type="button" className={styles.multiListDone} onClick={onCommit}>
          OK
        </button>
      </div>
    </div>
  )
})
