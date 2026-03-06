import { memo, useCallback, useSyncExternalStore } from 'react'
import type { TableStore } from '../core/store/create-store'
import type { ColumnDef, DataColumnDef, FilterCondition, SortDirection } from '../core/types'
import { isActionColumn, isDataColumn } from '../core/types'
import styles from '../styles/header.module.css'
import { FilterPopover } from './FilterPopover'

type HeaderCellProps<T> = {
  readonly column: ColumnDef<T>
  readonly colIndex: number
  readonly store: TableStore<T>
  readonly sortable: boolean
  readonly filterable: boolean
}

function HeaderCellInner<T>({ column, colIndex, store, sortable, filterable }: HeaderCellProps<T>) {
  useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot)

  const columnKey = isDataColumn(column) ? String((column as DataColumnDef<T>).key) : ''
  const filterOpen = store.getOpenFilterKey() === columnKey

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

  const handleColumnSelect = useCallback(() => {
    const rows = store.getRows()
    if (rows.length === 0) return
    store.setActiveCell({ rowIndex: 0, colIndex })
    if (rows.length > 1) {
      store.extendSelection({ rowIndex: rows.length - 1, colIndex })
    }
  }, [store, colIndex])

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
      className={`${styles.headerCell} ${currentFilter ? styles.headerFiltered : ''}`}
      style={{ width, minWidth: width }}
      onClick={handleColumnSelect}
      data-sort={currentSortDir ?? undefined}
    >
      <div className={styles.headerContent}>
        <span className={styles.headerLabel}>
          {isAction ? (column.header ?? '') : (column as DataColumnDef<T>).header}
        </span>
      </div>
      <div className={styles.headerActions}>
        {canSort && (
          <button
            type="button"
            className={`${styles.sortButton} ${currentSortDir ? styles.sortActive : ''}`}
            onClick={(e) => {
              e.stopPropagation()
              handleSort()
            }}
            aria-label="ソート"
          >
            {currentSortDir === 'asc' ? '\u25B2' : currentSortDir === 'desc' ? '\u25BC' : '\u25B2'}
          </button>
        )}
        {canFilter && (
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              className={`${styles.filterButton} ${currentFilter ? styles.filterActive : ''}`}
              onClick={(e) => {
                e.stopPropagation()
                const opening = !filterOpen
                store.setOpenFilterKey(opening ? columnKey : null)
                if (opening) {
                  store.clearSelection()
                }
              }}
              aria-label="フィルター"
            >
              {'\u2630'}
            </button>
            {filterOpen && (
              <FilterPopover
                column={column as DataColumnDef<T>}
                store={store}
                currentCondition={currentFilter}
                onApply={handleFilterApply}
                onClear={handleFilterClear}
                onClose={() => store.setOpenFilterKey(null)}
              />
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export const HeaderCell = memo(HeaderCellInner) as typeof HeaderCellInner
