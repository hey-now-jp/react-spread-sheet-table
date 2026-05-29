import { memo, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { ListOptionItem } from '../../core/types'
import styles from '../../styles/editor.module.css'

type MultiListEditorProps = {
  readonly value: string
  readonly options: readonly ListOptionItem[]
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
  const [focusIndex, setFocusIndex] = useState(0)
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

  // Close on outside click
  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onCommit()
      }
    }
    document.addEventListener('mousedown', handleMouseDown)
    return () => document.removeEventListener('mousedown', handleMouseDown)
  }, [onCommit])

  const selected = parseSelected(value)

  const handleToggle = useCallback(
    (optionValue: string) => {
      const current = parseSelected(value)
      const next = current.includes(optionValue)
        ? current.filter((v) => v !== optionValue)
        : [...current, optionValue]
      onChange(JSON.stringify(next))
    },
    [value, onChange],
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case 'Escape': {
          e.preventDefault()
          e.stopPropagation()
          onCancel()
          break
        }
        case 'Enter':
        case 'Tab': {
          e.preventDefault()
          e.stopPropagation()
          onCommit()
          break
        }
        case 'ArrowDown': {
          e.preventDefault()
          setFocusIndex((prev) => Math.min(prev + 1, options.length - 1))
          break
        }
        case 'ArrowUp': {
          e.preventDefault()
          setFocusIndex((prev) => Math.max(prev - 1, 0))
          break
        }
        case ' ': {
          e.preventDefault()
          const opt = options[focusIndex]
          if (opt) {
            handleToggle(opt.value)
          }
          break
        }
      }
    },
    [onCommit, onCancel, options, focusIndex, handleToggle],
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
        {options.map((opt, i) => (
          <label
            key={opt.value}
            className={`${styles.multiListOption} ${i === focusIndex ? styles.multiListOptionFocused : ''}`}
          >
            <input
              type="checkbox"
              checked={selected.includes(opt.value)}
              onChange={() => handleToggle(opt.value)}
              tabIndex={-1}
            />
            <span>{opt.label}</span>
          </label>
        ))}
      </div>
      <div className={styles.multiListActions}>
        <span className={styles.multiListCount}>
          {selected.length > 0 ? `${selected.length}件選択中` : '未選択'}
        </span>
        <button type="button" className={styles.multiListDone} onClick={onCommit} tabIndex={-1}>
          OK
        </button>
      </div>
    </div>
  )

  return createPortal(popover, document.body)
})
