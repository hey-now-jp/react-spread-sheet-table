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
  const selectRow = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      const lastCol = colCount - 1

      if (e.shiftKey && store.getSelection().activeCell !== null) {
        const active = store.getSelection().activeCell
        if (active) {
          store.setActiveCell({ rowIndex: active.rowIndex, colIndex: 0 })
          store.extendSelection({ rowIndex: dataRowIndex, colIndex: lastCol })
        }
      } else {
        store.setActiveCell({ rowIndex: dataRowIndex, colIndex: 0 })
        if (lastCol > 0) {
          store.extendSelection({ rowIndex: dataRowIndex, colIndex: lastCol })
        }
      }
    },
    [store, dataRowIndex, colCount],
  )

  return (
    <div
      className={`${styles.rowHeader} ${draggable ? styles.draggable : ''}`}
      onMouseDown={draggable ? undefined : selectRow}
      onClick={draggable ? selectRow : undefined}
      {...(draggable ? listeners : undefined)}
      {...(draggable ? attributes : undefined)}
    >
      {displayRowIndex + 1}
    </div>
  )
}

export const RowHeader = memo(RowHeaderInner) as typeof RowHeaderInner
