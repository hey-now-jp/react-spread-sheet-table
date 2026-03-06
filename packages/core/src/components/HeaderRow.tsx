import { memo, useCallback } from 'react'
import type { TableStore } from '../core/store/create-store'
import type { ColumnDef } from '../core/types'
import styles from '../styles/header.module.css'
import rowHeaderStyles from '../styles/row-header.module.css'
import { HeaderCell } from './HeaderCell'

type HeaderRowProps<T> = {
  readonly columns: ReadonlyArray<ColumnDef<T>>
  readonly store: TableStore<T>
  readonly sortable: boolean
  readonly filterable: boolean
  readonly reorderable?: boolean
}

function HeaderRowInner<T>({ columns, store, sortable, filterable }: HeaderRowProps<T>) {
  const handleSelectAll = useCallback(() => {
    const rows = store.getRows()
    if (rows.length === 0 || columns.length === 0) return
    store.setActiveCell({ rowIndex: 0, colIndex: 0 })
    store.extendSelection({ rowIndex: rows.length - 1, colIndex: columns.length - 1 })
  }, [store, columns])

  return (
    <div className={styles.headerRow}>
      <div className={rowHeaderStyles.selectAllCell} onClick={handleSelectAll} />
      {columns.map((column, colIndex) => (
        <HeaderCell
          key={String(column.key)}
          column={column}
          colIndex={colIndex}
          store={store}
          sortable={sortable}
          filterable={filterable}
        />
      ))}
    </div>
  )
}

export const HeaderRow = memo(HeaderRowInner) as typeof HeaderRowInner
