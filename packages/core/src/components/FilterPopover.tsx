import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { TableStore } from '../core/store/create-store'
import type { DataColumnDef, FilterCondition, SortDirection } from '../core/types'
import { useVirtualScroll } from '../hooks/use-virtual-scroll'
import styles from '../styles/filter.module.css'

const FILTER_ITEM_HEIGHT = 28
const FILTER_LIST_HEIGHT = 200

type FilterPopoverProps<T> = {
  readonly column: DataColumnDef<T>
  readonly store: TableStore<T>
  readonly currentCondition: FilterCondition | undefined
  readonly onApply: (condition: FilterCondition) => void
  readonly onClear: () => void
  readonly onClose: () => void
  readonly filterable: boolean
  readonly sortable: boolean
  readonly currentSortDir: SortDirection | null
  readonly onSort: (direction: SortDirection | null) => void
  readonly anchorRef: React.RefObject<HTMLButtonElement | null>
}

function getSelectedSet(condition: FilterCondition | undefined): ReadonlySet<string> {
  if (!condition) return new Set()
  if (condition.type === 'in') {
    return new Set(condition.values.map((v) => String(v)))
  }
  if (condition.type === 'eq') {
    return new Set([String(condition.value)])
  }
  if (condition.type === 'contains') {
    return new Set([condition.value])
  }
  return new Set()
}

function FilterPopoverInner<T>({
  column,
  store,
  currentCondition,
  onApply,
  onClear,
  onClose,
  filterable,
  sortable,
  currentSortDir,
  onSort,
  anchorRef,
}: FilterPopoverProps<T>) {
  const popoverRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<ReadonlySet<string>>(() =>
    getSelectedSet(currentCondition),
  )
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null)

  // Calculate position relative to anchor, flip if needed
  useLayoutEffect(() => {
    const anchor = anchorRef.current
    const popover = popoverRef.current
    if (!anchor || !popover) return

    const updatePosition = () => {
      const anchorRect = anchor.getBoundingClientRect()
      const popoverRect = popover.getBoundingClientRect()
      const gap = 4

      let top = anchorRect.bottom + gap
      let left = anchorRect.right - popoverRect.width

      // Flip upward if not enough space below
      if (top + popoverRect.height > window.innerHeight) {
        top = anchorRect.top - popoverRect.height - gap
      }

      // Clamp so it doesn't go off-screen
      if (top < 4) {
        top = 4
      }
      if (left < 4) {
        left = 4
      }

      setPosition({ top, left })
    }

    updatePosition()

    window.addEventListener('scroll', updatePosition, true)
    window.addEventListener('resize', updatePosition)
    return () => {
      window.removeEventListener('scroll', updatePosition, true)
      window.removeEventListener('resize', updatePosition)
    }
  }, [anchorRef])

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

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  // Extract unique values from column data
  const uniqueValues = useMemo(() => {
    const rows = store.getRows()
    const key = column.key as keyof T
    const seen = new Set<string>()
    const values: string[] = []

    for (const row of rows) {
      const raw = row[key]
      if (Array.isArray(raw)) {
        for (const item of raw) {
          const str = item === null || item === undefined ? '' : String(item)
          if (str !== '' && !seen.has(str)) {
            seen.add(str)
            values.push(str)
          }
        }
      } else {
        const str = raw === null || raw === undefined ? '' : String(raw)
        if (str !== '' && !seen.has(str)) {
          seen.add(str)
          values.push(str)
        }
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

  // Auto-focus: input if filterable, otherwise the popover itself
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    } else {
      popoverRef.current?.focus()
    }
  }, [])

  const handleToggle = useCallback((value: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(value)) {
        next.delete(value)
      } else {
        next.add(value)
      }
      return next
    })
  }, [])

  const handleSelectAll = useCallback(() => {
    setSelected(new Set(suggestions))
  }, [suggestions])

  const handleDeselectAll = useCallback(() => {
    setSelected(new Set())
  }, [])

  const handleApply = useCallback(() => {
    if (selected.size === 0) {
      onClear()
    } else {
      const values = [...selected].map((v) => coerceValue(v, column))
      onApply({ type: 'in', values })
    }
    onClose()
  }, [selected, column, onApply, onClear, onClose])

  const handleClear = useCallback(() => {
    onClear()
    onClose()
  }, [onClear, onClose])

  const handleSortAsc = useCallback(() => {
    onSort(currentSortDir === 'asc' ? null : 'asc')
    onClose()
  }, [currentSortDir, onSort, onClose])

  const handleSortDesc = useCallback(() => {
    onSort(currentSortDir === 'desc' ? null : 'desc')
    onClose()
  }, [currentSortDir, onSort, onClose])

  const {
    containerRef: virtualContainerRef,
    totalHeight,
    offsetTop,
    visibleStart,
    visibleEnd,
  } = useVirtualScroll(suggestions.length, FILTER_ITEM_HEIGHT, FILTER_LIST_HEIGHT)

  const allVisible = suggestions.length > 0 && suggestions.every((v) => selected.has(v))

  const popover = (
    <div
      ref={popoverRef}
      className={styles.filterPopover}
      style={
        position ? { top: position.top, left: position.left } : { visibility: 'hidden' as const }
      }
      tabIndex={-1}
      onClick={(e) => e.stopPropagation()}
    >
      {sortable && (
        <div className={styles.sortSection}>
          <button
            type="button"
            className={`${styles.sortOption} ${currentSortDir === 'asc' ? styles.sortOptionActive : ''}`}
            onClick={handleSortAsc}
            aria-label="昇順でソート"
          >
            {'\u2191 昇順でソート'}
          </button>
          <button
            type="button"
            className={`${styles.sortOption} ${currentSortDir === 'desc' ? styles.sortOptionActive : ''}`}
            onClick={handleSortDesc}
            aria-label="降順でソート"
          >
            {'\u2193 降順でソート'}
          </button>
        </div>
      )}
      {filterable && (
        <>
          <input
            ref={inputRef}
            className={styles.filterInput}
            type="text"
            placeholder="検索..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className={styles.filterSelectActions}>
            <button
              type="button"
              className={styles.filterSelectButton}
              onClick={allVisible ? handleDeselectAll : handleSelectAll}
            >
              {allVisible ? '全解除' : '全選択'}
            </button>
            {selected.size > 0 && (
              <span className={styles.filterSelectedCount}>{selected.size}件選択中</span>
            )}
          </div>
          {suggestions.length > 0 && (
            <div
              ref={virtualContainerRef as React.RefObject<HTMLDivElement>}
              className={styles.suggestionList}
            >
              <div style={{ height: totalHeight, position: 'relative' }}>
                <div
                  style={{
                    position: 'absolute',
                    top: offsetTop,
                    left: 0,
                    right: 0,
                  }}
                >
                  {suggestions.slice(visibleStart, visibleEnd).map((value) => (
                    <label
                      key={value}
                      className={styles.filterCheckItem}
                      style={{ height: FILTER_ITEM_HEIGHT }}
                    >
                      <input
                        type="checkbox"
                        checked={selected.has(value)}
                        onChange={() => handleToggle(value)}
                      />
                      <span>{highlightText(value, query)}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
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
              onClick={handleApply}
            >
              検索
            </button>
          </div>
        </>
      )}
    </div>
  )

  return createPortal(popover, document.body)
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
