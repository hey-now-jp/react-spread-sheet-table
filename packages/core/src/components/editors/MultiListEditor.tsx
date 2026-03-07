import { memo, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import styles from '../../styles/editor.module.css'

type MultiListEditorProps = {
  readonly value: string
  readonly options: readonly string[]
  readonly onChange: (value: string) => void
  readonly onCommit: () => void
  readonly onCancel: () => void
  readonly anchorRef: React.RefObject<HTMLDivElement | null>
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
  anchorRef,
}: MultiListEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState<{ top: number; left: number; minWidth: number }>({
    top: 0,
    left: 0,
    minWidth: 0,
  })

  useLayoutEffect(() => {
    const anchor = anchorRef.current
    const container = containerRef.current
    if (!anchor || !container) return

    const updatePosition = () => {
      const anchorRect = anchor.getBoundingClientRect()
      const containerRect = container.getBoundingClientRect()

      let top = anchorRect.top
      const left = anchorRect.left

      // Flip upward if not enough space below
      if (top + containerRect.height > window.innerHeight) {
        top = anchorRect.bottom - containerRect.height
      }

      // Clamp so it doesn't go above viewport
      if (top < 4) {
        top = 4
      }

      setPosition({ top, left, minWidth: anchorRect.width })
    }

    updatePosition()

    window.addEventListener('scroll', updatePosition, true)
    window.addEventListener('resize', updatePosition)
    return () => {
      window.removeEventListener('scroll', updatePosition, true)
      window.removeEventListener('resize', updatePosition)
    }
  }, [anchorRef])

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

  const popover = (
    <div
      ref={containerRef}
      className={styles.multiListEditor}
      style={{ top: position.top, left: position.left, minWidth: position.minWidth }}
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

  return createPortal(popover, document.body)
})
