import type { DraggableAttributes } from '@dnd-kit/core'
import type { SyntheticListenerMap } from '@dnd-kit/core/dist/hooks/utilities'
import { memo, useCallback } from 'react'
import type { TableStore } from '../core/store/create-store'
import styles from '../styles/row-header.module.css'

type RowHeaderProps<T> = {
  readonly displayRowIndex: number
  readonly dataRowIndex: number
  readonly colCount: number
  readonly store: TableStore<T>
  readonly draggable?: boolean
  readonly listeners?: SyntheticListenerMap
  readonly attributes?: DraggableAttributes
}

function RowHeaderInner<T>({
  displayRowIndex,
  dataRowIndex,
  colCount,
  store,
  draggable,
  listeners,
  attributes,
}: RowHeaderProps<T>) {
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (draggable) return
      e.stopPropagation()
      store.setActiveCell({ rowIndex: dataRowIndex, colIndex: 0 })
      if (colCount > 1) {
        store.extendSelection({ rowIndex: dataRowIndex, colIndex: colCount - 1 })
      }
    },
    [store, dataRowIndex, colCount, draggable],
  )

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (!draggable) return
      e.stopPropagation()
      store.setActiveCell({ rowIndex: dataRowIndex, colIndex: 0 })
      if (colCount > 1) {
        store.extendSelection({ rowIndex: dataRowIndex, colIndex: colCount - 1 })
      }
    },
    [store, dataRowIndex, colCount, draggable],
  )

  return (
    <div
      className={`${styles.rowHeader} ${draggable ? styles.draggable : ''}`}
      onMouseDown={draggable ? undefined : handleMouseDown}
      onClick={draggable ? handleClick : undefined}
      {...(draggable ? listeners : undefined)}
      {...(draggable ? attributes : undefined)}
    >
      {displayRowIndex + 1}
    </div>
  )
}

export const RowHeader = memo(RowHeaderInner) as typeof RowHeaderInner
