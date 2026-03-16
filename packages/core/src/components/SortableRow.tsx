import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { memo } from 'react'
import type { TableStore } from '../core/store/create-store'
import type { CellMeta, ColumnDef } from '../core/types'
import dragStyles from '../styles/drag.module.css'
import { RowHeader } from './RowHeader'
import { TableRow } from './TableRow'

type SortableRowProps<T> = {
  readonly id: string
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
  columns,
  dataRowIndex,
  displayRowIndex,
  store,
  readOnly,
  onCellChange,
  frozenLeftOffsets,
  cellMeta,
}: SortableRowProps<T>) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} className={dragStyles.sortableRow}>
      <RowHeader
        displayRowIndex={displayRowIndex}
        dataRowIndex={dataRowIndex}
        colCount={columns.length}
        store={store}
        draggable
        listeners={listeners}
        attributes={attributes}
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
