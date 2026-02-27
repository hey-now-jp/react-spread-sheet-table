import { memo } from 'react'
import type { TableStore } from '../core/store/create-store'
import type { ColumnDef } from '../core/types'
import dragStyles from '../styles/drag.module.css'
import styles from '../styles/header.module.css'
import { HeaderCell } from './HeaderCell'

type HeaderRowProps<T> = {
  readonly columns: ReadonlyArray<ColumnDef<T>>
  readonly store: TableStore<T>
  readonly sortable: boolean
  readonly filterable: boolean
  readonly reorderable?: boolean
}

function HeaderRowInner<T>({
  columns,
  store,
  sortable,
  filterable,
  reorderable,
}: HeaderRowProps<T>) {
  return (
    <div className={styles.headerRow}>
      {reorderable && <div className={dragStyles.dragHandleHeader} />}
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
