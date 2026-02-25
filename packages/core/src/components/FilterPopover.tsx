import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { TableStore } from '../core/store/create-store'
import type { DataColumnDef } from '../core/types/column'
import type { FilterCondition } from '../core/types/filter'
import styles from '../styles/filter.module.css'

type FilterPopoverProps<T> = {
  readonly column: DataColumnDef<T>
  readonly store: TableStore<T>
  readonly currentCondition: FilterCondition | undefined
  readonly onApply: (condition: FilterCondition) => void
  readonly onClear: () => void
  readonly onClose: () => void
}

function FilterPopoverInner<T>({
  column,
  store,
  currentCondition,
  onApply,
  onClear,
  onClose,
}: FilterPopoverProps<T>) {
  const popoverRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState(() => {
    if (!currentCondition) return ''
    if (currentCondition.type === 'contains') return currentCondition.value
    if (currentCondition.type === 'eq') return String(currentCondition.value ?? '')
    return ''
  })
  const [highlightIndex, setHighlightIndex] = useState(-1)

  // Close on outside click
  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleMouseDown)
    return () => document.removeEventListener('mousedown', handleMouseDown)
  }, [onClose])

  // Extract unique values from column data
  const uniqueValues = useMemo(() => {
    const rows = store.getRows()
    const key = column.key as keyof T
    const seen = new Set<string>()
    const values: string[] = []

    for (const row of rows) {
      const raw = row[key]
      const str = raw === null || raw === undefined ? '' : String(raw)
      if (str !== '' && !seen.has(str)) {
        seen.add(str)
        values.push(str)
      }
    }

    values.sort((a, b) => a.localeCompare(b))
    return values
  }, [store, column.key])

  // Filter suggestions by query
  const suggestions = useMemo(() => {
    if (query.trim() === '') return uniqueValues
    const lower = query.toLowerCase()
    return uniqueValues.filter((v) => v.toLowerCase().includes(lower))
  }, [uniqueValues, query])

  // Auto-focus input on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // biome-ignore lint/correctness/useExhaustiveDependencies: suggestions change triggers highlight reset intentionally
  useEffect(() => {
    setHighlightIndex(-1)
  }, [suggestions])

  const applyContains = useCallback(
    (value: string) => {
      if (value.trim() === '') return
      if (column.type === 'text') {
        onApply({ type: 'contains', value: value.trim() })
      } else {
        onApply({ type: 'eq', value: coerceValue(value.trim(), column) })
      }
      onClose()
    },
    [column, onApply, onClose],
  )

  const applyExact = useCallback(
    (value: string) => {
      onApply({ type: 'eq', value: coerceValue(value, column) })
      onClose()
    },
    [column, onApply, onClose],
  )

  const handleClear = useCallback(() => {
    onClear()
    onClose()
  }, [onClear, onClose])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown': {
          e.preventDefault()
          setHighlightIndex((prev) => Math.min(prev + 1, suggestions.length - 1))
          break
        }
        case 'ArrowUp': {
          e.preventDefault()
          setHighlightIndex((prev) => Math.max(prev - 1, -1))
          break
        }
        case 'Enter': {
          e.preventDefault()
          if (highlightIndex >= 0 && highlightIndex < suggestions.length) {
            applyExact(suggestions[highlightIndex])
          } else {
            applyContains(query)
          }
          break
        }
        case 'Escape': {
          onClose()
          break
        }
      }
    },
    [suggestions, highlightIndex, query, applyExact, applyContains, onClose],
  )

  return (
    <div ref={popoverRef} className={styles.filterPopover} onClick={(e) => e.stopPropagation()}>
      <input
        ref={inputRef}
        className={styles.filterInput}
        type="text"
        placeholder="検索..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
      />
      {suggestions.length > 0 && (
        <ul className={styles.suggestionList}>
          {suggestions.map((value, i) => (
            <li key={value}>
              <button
                type="button"
                className={`${styles.suggestionItem} ${i === highlightIndex ? styles.suggestionHighlight : ''}`}
                onMouseEnter={() => setHighlightIndex(i)}
                onMouseDown={(e) => {
                  e.preventDefault()
                  applyExact(value)
                }}
              >
                {highlightText(value, query)}
              </button>
            </li>
          ))}
        </ul>
      )}
      {suggestions.length === 0 && query.trim() !== '' && (
        <div className={styles.noResults}>該当なし</div>
      )}
      <div className={styles.filterActions}>
        <button type="button" className={styles.filterActionButton} onClick={handleClear}>
          クリア
        </button>
        <button
          type="button"
          className={`${styles.filterActionButton} ${styles.filterApply}`}
          onClick={() => applyContains(query)}
        >
          適用
        </button>
      </div>
    </div>
  )
}

function coerceValue<T>(str: string, column: DataColumnDef<T>): unknown {
  switch (column.type) {
    case 'number': {
      const num = Number(str)
      return Number.isNaN(num) ? str : num
    }
    case 'boolean':
      return str.toLowerCase() === 'true'
    default:
      return str
  }
}

function highlightText(text: string, query: string): React.ReactNode {
  if (query.trim() === '') return text
  const lower = text.toLowerCase()
  const qLower = query.toLowerCase()
  const idx = lower.indexOf(qLower)
  if (idx === -1) return text

  return (
    <>
      {text.slice(0, idx)}
      <mark className={styles.highlightMark}>{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  )
}

export const FilterPopover = memo(FilterPopoverInner) as typeof FilterPopoverInner
