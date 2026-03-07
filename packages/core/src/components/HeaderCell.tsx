import { memo, useCallback, useRef, useSyncExternalStore } from 'react'
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
  const menuButtonRef = useRef<HTMLButtonElement>(null)

  const columnKey = isDataColumn(column) ? String((column as DataColumnDef<T>).key) : ''
  const menuOpen = store.getOpenFilterKey() === columnKey

  const isAction = isActionColumn(column)
  const isData = isDataColumn(column)
  const canSort = sortable && isData
  const canFilter = filterable && isData
  const hasMenu = canSort || canFilter

  const sortState = store.getSortState()
  const currentSortDir: SortDirection | null =
    sortState !== null && isData && sortState.key === (column as DataColumnDef<T>).key
      ? sortState.direction
      : null

  const filterState = store.getFilterState()
  const currentFilter: FilterCondition | undefined = isData
    ? filterState.get((column as DataColumnDef<T>).key as keyof T)
    : undefined

  const isActive = currentSortDir !== null || currentFilter !== undefined

  const handleColumnSelect = useCallback(() => {
    const rows = store.getRows()
    if (rows.length === 0) return
    store.setActiveCell({ rowIndex: 0, colIndex })
    if (rows.length > 1) {
      store.extendSelection({ rowIndex: rows.length - 1, colIndex })
    }
  }, [store, colIndex])

  const handleSort = useCallback(
    (direction: SortDirection | null) => {
      if (!isData) return
      const key = (column as DataColumnDef<T>).key as keyof T
      if (direction === null) {
        store.clearSort()
      } else {
        store.setSort(key, direction)
      }
    },
    [isData, column, store],
  )

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
      {hasMenu && (
        <>
          <button
            ref={menuButtonRef}
            type="button"
            className={`${styles.menuButton} ${isActive ? styles.menuButtonActive : ''}`}
            onClick={(e) => {
              e.stopPropagation()
              const opening = !menuOpen
              store.setOpenFilterKey(opening ? columnKey : null)
              if (opening) {
                store.clearSelection()
              }
            }}
            aria-label="列メニュー"
          >
            {'\u25BC'}
          </button>
          {menuOpen && (
            <FilterPopover
              column={column as DataColumnDef<T>}
              store={store}
              currentCondition={currentFilter}
              onApply={handleFilterApply}
              onClear={handleFilterClear}
              onClose={() => store.setOpenFilterKey(null)}
              filterable={canFilter}
              sortable={canSort}
              currentSortDir={currentSortDir}
              onSort={handleSort}
              anchorRef={menuButtonRef}
            />
          )}
        </>
      )}
    </div>
  )
}

export const HeaderCell = memo(HeaderCellInner) as typeof HeaderCellInner
