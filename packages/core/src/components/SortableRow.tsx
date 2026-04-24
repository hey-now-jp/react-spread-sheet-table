import { useSortable } from '@dnd-kit/react/sortable'
import { memo } from 'react'
import type { TableStore } from '../core/store/create-store'
import type { CellMeta, ColumnDef } from '../core/types'
import dragStyles from '../styles/drag.module.css'
import { RowHeader } from './RowHeader'
import { TableRow } from './TableRow'

type SortableRowProps<T> = {
  readonly id: string
  readonly index: number
  readonly columns: ReadonlyArray<ColumnDef<T>>
  readonly dataRowIndex: number
  readonly displayRowIndex: number
  readonly store: TableStore<T>
  readonly readOnly: boolean
  readonly onCellChange: (rowIndex: number, columnKey: keyof T, value: T[keyof T]) => void
  readonly frozenLeftOffsets: ReadonlyArray<number>
  readonly cellMeta?: (row: T, columnKey: keyof T, rowIndex: number) => CellMeta | undefined
}

function SortableRowInner<T>({
  id,
  index,
  columns,
  dataRowIndex,
  displayRowIndex,
  store,
  readOnly,
  onCellChange,
  frozenLeftOffsets,
  cellMeta,
}: SortableRowProps<T>) {
  const { ref, handleRef, isDragging } = useSortable({
    id,
    index,
  })

  return (
    <div
      ref={ref}
      style={isDragging ? { opacity: 0.5 } : undefined}
      className={dragStyles.sortableRow}
    >
      <RowHeader
        displayRowIndex={displayRowIndex}
        dataRowIndex={dataRowIndex}
        colCount={columns.length}
        store={store}
        draggable
        handleRef={handleRef}
        frozen
      />
      <TableRow
        columns={columns}
        dataRowIndex={dataRowIndex}
        displayRowIndex={displayRowIndex}
        store={store}
        readOnly={readOnly}
        onCellChange={onCellChange}
        frozenLeftOffsets={frozenLeftOffsets}
        cellMeta={cellMeta}
      />
    </div>
  )
}

export const SortableRow = memo(SortableRowInner) as typeof SortableRowInner
