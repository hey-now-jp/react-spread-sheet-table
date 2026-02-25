import { memo, useCallback, useState } from 'react'
import type { TableStore } from '../core/store/create-store'
import type { ColumnDef, DataColumnDef } from '../core/types/column'
import { isActionColumn, isDataColumn } from '../core/types/column'
import type { FilterCondition } from '../core/types/filter'
import type { SortDirection } from '../core/types/sort'
import styles from '../styles/header.module.css'
import { FilterPopover } from './FilterPopover'
import { SortIndicator } from './SortIndicator'

type HeaderCellProps<T> = {
  readonly column: ColumnDef<T>
  readonly colIndex: number
  readonly store: TableStore<T>
  readonly sortable: boolean
  readonly filterable: boolean
}

function HeaderCellInner<T>({ column, store, sortable, filterable }: HeaderCellProps<T>) {
  const [filterOpen, setFilterOpen] = useState(false)

  const isAction = isActionColumn(column)
  const isData = isDataColumn(column)
  const canSort = sortable && isData
  const canFilter = filterable && isData

  const sortState = store.getSortState()
  const currentSortDir: SortDirection | null =
    sortState !== null && isData && sortState.key === (column as DataColumnDef<T>).key
      ? sortState.direction
      : null

  const filterState = store.getFilterState()
  const currentFilter: FilterCondition | undefined = isData
    ? filterState.get((column as DataColumnDef<T>).key as keyof T)
    : undefined

  const handleSort = useCallback(() => {
    if (!canSort || !isData) return
    store.toggleSort((column as DataColumnDef<T>).key as keyof T)
  }, [canSort, isData, store, column])

  const handleFilterApply = useCallback(
    (condition: FilterCondition) => {
      if (!isData) return
      store.setFilter((column as DataColumnDef<T>).key as keyof T, condition)
    },
    [isData, store, column],
  )

  const handleFilterClear = useCallback(() => {
    if (!isData) return
    store.clearFilter((column as DataColumnDef<T>).key as keyof T)
  }, [isData, store, column])

  const width = column.width ?? 150

  return (
    <div
      className={`${styles.headerCell} ${canSort ? styles.sortable : ''}`}
      style={{ width, minWidth: width }}
      onClick={handleSort}
      onKeyDown={(e) => {
        if (canSort && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault()
          handleSort()
        }
      }}
      tabIndex={canSort ? 0 : undefined}
      data-sort={currentSortDir ?? undefined}
    >
      <div className={styles.headerContent}>
        <span className={styles.headerLabel}>
          {isAction ? (column.header ?? '') : (column as DataColumnDef<T>).header}
        </span>
        {canSort && <SortIndicator direction={currentSortDir} />}
      </div>
      {canFilter && (
        <div style={{ position: 'relative' }}>
          <button
            type="button"
            className={`${styles.filterButton} ${currentFilter ? styles.filterActive : ''}`}
            onClick={(e) => {
              e.stopPropagation()
              setFilterOpen(!filterOpen)
            }}
            aria-label="Filter"
          >
            {'\u25BC'}
          </button>
          {filterOpen && (
            <FilterPopover
              column={column as DataColumnDef<T>}
              currentCondition={currentFilter}
              onApply={handleFilterApply}
              onClear={handleFilterClear}
              onClose={() => setFilterOpen(false)}
            />
          )}
        </div>
      )}
    </div>
  )
}

export const HeaderCell = memo(HeaderCellInner) as typeof HeaderCellInner
