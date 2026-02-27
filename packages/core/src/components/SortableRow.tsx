import type { DraggableAttributes } from '@dnd-kit/core'
import type { SyntheticListenerMap } from '@dnd-kit/core/dist/hooks/utilities'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { memo } from 'react'
import type { TableStore } from '../core/store/create-store'
import type { ColumnDef } from '../core/types'
import dragStyles from '../styles/drag.module.css'
import { TableRow } from './TableRow'

type DragHandleProps = {
  readonly listeners: SyntheticListenerMap | undefined
  readonly attributes: DraggableAttributes
}

function DragHandle({ listeners, attributes }: DragHandleProps) {
  return (
    <div className={dragStyles.dragHandle} {...listeners} {...attributes}>
      <div className={dragStyles.gripIcon}>
        <span className={dragStyles.gripDot} />
        <span className={dragStyles.gripDot} />
        <span className={dragStyles.gripDot} />
      </div>
    </div>
  )
}

type SortableRowProps<T> = {
  readonly id: string
  readonly columns: ReadonlyArray<ColumnDef<T>>
  readonly dataRowIndex: number
  readonly displayRowIndex: number
  readonly store: TableStore<T>
  readonly readOnly: boolean
  readonly onCellChange: (rowIndex: number, columnKey: keyof T, value: T[keyof T]) => void
}

function SortableRowInner<T>({
  id,
  columns,
  dataRowIndex,
  displayRowIndex,
  store,
  readOnly,
  onCellChange,
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
      <DragHandle listeners={listeners} attributes={attributes} />
      <TableRow
        columns={columns}
        dataRowIndex={dataRowIndex}
        displayRowIndex={displayRowIndex}
        store={store}
        readOnly={readOnly}
        onCellChange={onCellChange}
      />
    </div>
  )
}

export const SortableRow = memo(SortableRowInner) as typeof SortableRowInner
