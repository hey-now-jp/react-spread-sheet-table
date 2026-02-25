import { memo, useCallback, useState } from 'react'
import type { DataColumnDef } from '../core/types/column'
import type { FilterCondition } from '../core/types/filter'
import styles from '../styles/filter.module.css'

type FilterPopoverProps<T> = {
  readonly column: DataColumnDef<T>
  readonly currentCondition: FilterCondition | undefined
  readonly onApply: (condition: FilterCondition) => void
  readonly onClear: () => void
  readonly onClose: () => void
}

function FilterPopoverInner<T>({
  column,
  currentCondition,
  onApply,
  onClear,
  onClose,
}: FilterPopoverProps<T>) {
  const [filterValue, setFilterValue] = useState(() => {
    if (!currentCondition) return ''
    if (currentCondition.type === 'contains') return currentCondition.value
    if (currentCondition.type === 'eq') return String(currentCondition.value ?? '')
    return ''
  })

  const [rangeMin, setRangeMin] = useState(() => {
    if (currentCondition?.type === 'range') return String(currentCondition.min ?? '')
    return ''
  })

  const [rangeMax, setRangeMax] = useState(() => {
    if (currentCondition?.type === 'range') return String(currentCondition.max ?? '')
    return ''
  })

  const handleApply = useCallback(() => {
    switch (column.type) {
      case 'text': {
        if (filterValue.trim()) {
          onApply({ type: 'contains', value: filterValue.trim() })
        }
        break
      }
      case 'number': {
        const min = rangeMin !== '' ? Number(rangeMin) : undefined
        const max = rangeMax !== '' ? Number(rangeMax) : undefined
        if (min !== undefined || max !== undefined) {
          onApply({ type: 'range', min, max })
        }
        break
      }
      case 'boolean': {
        if (filterValue !== '') {
          onApply({ type: 'eq', value: filterValue === 'true' })
        }
        break
      }
      case 'list': {
        if (filterValue.trim()) {
          onApply({ type: 'eq', value: filterValue })
        }
        break
      }
      case 'date':
      case 'time': {
        if (filterValue.trim()) {
          onApply({ type: 'eq', value: filterValue.trim() })
        }
        break
      }
    }
    onClose()
  }, [column.type, filterValue, rangeMin, rangeMax, onApply, onClose])

  const handleClear = useCallback(() => {
    onClear()
    onClose()
  }, [onClear, onClose])

  return (
    <div
      className={styles.filterPopover}
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose()
      }}
    >
      {column.type === 'number' ? (
        <>
          <input
            className={styles.filterInput}
            type="number"
            placeholder="Min"
            value={rangeMin}
            onChange={(e) => setRangeMin(e.target.value)}
            style={{ marginBottom: 4 }}
          />
          <input
            className={styles.filterInput}
            type="number"
            placeholder="Max"
            value={rangeMax}
            onChange={(e) => setRangeMax(e.target.value)}
          />
        </>
      ) : column.type === 'boolean' ? (
        <select
          className={styles.filterInput}
          value={filterValue}
          onChange={(e) => setFilterValue(e.target.value)}
        >
          <option value="">All</option>
          <option value="true">True</option>
          <option value="false">False</option>
        </select>
      ) : column.type === 'list' ? (
        <select
          className={styles.filterInput}
          value={filterValue}
          onChange={(e) => setFilterValue(e.target.value)}
        >
          <option value="">All</option>
          {column.options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      ) : (
        <input
          className={styles.filterInput}
          type={column.type === 'date' ? 'date' : column.type === 'time' ? 'time' : 'text'}
          placeholder="Filter..."
          value={filterValue}
          onChange={(e) => setFilterValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleApply()
          }}
        />
      )}
      <div className={styles.filterActions}>
        <button type="button" className={styles.filterActionButton} onClick={handleClear}>
          Clear
        </button>
        <button
          type="button"
          className={`${styles.filterActionButton} ${styles.filterApply}`}
          onClick={handleApply}
        >
          Apply
        </button>
      </div>
    </div>
  )
}

export const FilterPopover = memo(FilterPopoverInner) as typeof FilterPopoverInner
