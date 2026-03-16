import { memo, useSyncExternalStore } from 'react'
import type { TableStore } from '../core/store/create-store'
import type { CellMeta, ColumnDef } from '../core/types'
import { isActionColumn, isDataColumn } from '../core/types'
import styles from '../styles/cell.module.css'
import { ActionCell } from './ActionCell'
import { Cell } from './Cell'

type TableRowProps<T> = {
  readonly columns: ReadonlyArray<ColumnDef<T>>
  readonly dataRowIndex: number
  readonly displayRowIndex: number
  readonly store: TableStore<T>
  readonly readOnly: boolean
  readonly onCellChange: (rowIndex: number, columnKey: keyof T, value: T[keyof T]) => void
  readonly frozenLeftOffsets: ReadonlyArray<number>
  readonly cellMeta?: (row: T, columnKey: keyof T, rowIndex: number) => CellMeta | undefined
}

function TableRowInner<T>({
  columns,
  dataRowIndex,
  displayRowIndex,
  store,
  readOnly,
  onCellChange,
  frozenLeftOffsets,
  cellMeta,
}: TableRowProps<T>) {
  useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot)
  const row = store.getRows()[dataRowIndex]

  return (
    <div
      className={`${styles.row} ${displayRowIndex % 2 === 0 ? styles.rowEven : styles.rowOdd}`}
      style={{ flex: 1 }}
      data-rowindex={displayRowIndex}
    >
      {columns.map((column, colIndex) => {
        const stickyLeft =
          colIndex < frozenLeftOffsets.length ? frozenLeftOffsets[colIndex] : undefined
        const isFrozenLast =
          frozenLeftOffsets.length > 0 &&
          colIndex === frozenLeftOffsets.length - 1 &&
          frozenLeftOffsets.length < columns.length

        if (isActionColumn(column)) {
          return (
            <ActionCell
              key={String(column.key)}
              column={column}
              row={row}
              rowIndex={dataRowIndex}
              colIndex={colIndex}
              store={store}
              stickyLeft={stickyLeft}
              isFrozenLast={isFrozenLast}
            />
          )
        }

        if (isDataColumn(column)) {
          return (
            <Cell
              key={String(column.key)}
              column={column}
              rowIndex={dataRowIndex}
              colIndex={colIndex}
              store={store}
              readOnly={readOnly}
              onCellChange={onCellChange}
              stickyLeft={stickyLeft}
              isFrozenLast={isFrozenLast}
              cellMeta={cellMeta}
            />
          )
        }

        return null
      })}
    </div>
  )
}

export const TableRow = memo(TableRowInner) as typeof TableRowInner
