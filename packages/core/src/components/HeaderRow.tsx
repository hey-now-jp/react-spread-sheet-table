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
  readonly resizable: boolean
  readonly frozenLeftOffsets: ReadonlyArray<number>
}

function HeaderRowInner<T>({
  columns,
  store,
  sortable,
  filterable,
  resizable,
  frozenLeftOffsets,
}: HeaderRowProps<T>) {
  const handleSelectAll = useCallback(() => {
    const rows = store.getRows()
    if (rows.length === 0 || columns.length === 0) return
    store.setActiveCell({ rowIndex: 0, colIndex: 0 })
    store.extendSelection({ rowIndex: rows.length - 1, colIndex: columns.length - 1 })
  }, [store, columns])

  const selectAllClassName = `${rowHeaderStyles.selectAllCell} ${rowHeaderStyles.frozenSelectAllCell}`

  return (
    <div className={styles.headerRow}>
      <div className={selectAllClassName} onClick={handleSelectAll} />
      {columns.map((column, colIndex) => {
        const stickyLeft =
          colIndex < frozenLeftOffsets.length ? frozenLeftOffsets[colIndex] : undefined
        const isFrozenLast =
          frozenLeftOffsets.length > 0 &&
          colIndex === frozenLeftOffsets.length - 1 &&
          frozenLeftOffsets.length < columns.length

        return (
          <HeaderCell
            key={String(column.key)}
            column={column}
            colIndex={colIndex}
            store={store}
            sortable={sortable}
            filterable={filterable}
            resizable={resizable}
            stickyLeft={stickyLeft}
            isFrozenLast={isFrozenLast}
          />
        )
      })}
    </div>
  )
}

export const HeaderRow = memo(HeaderRowInner) as typeof HeaderRowInner
