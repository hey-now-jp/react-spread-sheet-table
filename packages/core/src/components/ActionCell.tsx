import { memo, useSyncExternalStore } from 'react'
import type { TableStore } from '../core/store/create-store'
import type { ActionColumnDef } from '../core/types'
import { getSelectionEdges, isActiveCell, isInSelection } from '../core/types'
import styles from '../styles/cell.module.css'

type ActionCellProps<T> = {
  readonly column: ActionColumnDef<T>
  readonly row: T
  readonly rowIndex: number
  readonly colIndex: number
  readonly store: TableStore<T>
  readonly stickyLeft?: number
  readonly isFrozenLast?: boolean
}

function ActionCellInner<T>({
  column,
  row,
  rowIndex,
  colIndex,
  store,
  stickyLeft,
  isFrozenLast,
}: ActionCellProps<T>) {
  useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot)
  const defaultWidth = column.width ?? 150
  const dynamicWidth = store.getColumnWidth(String(column.key))
  const width = dynamicWidth ?? defaultWidth

  const selection = store.getSelection()
  const isSelected = isInSelection(selection, rowIndex, colIndex)
  const isActive = isActiveCell(selection, rowIndex, colIndex)
  const edges = getSelectionEdges(selection, rowIndex, colIndex)

  const isFrozen = stickyLeft !== undefined

  const cellClassName = [
    styles.cell,
    isSelected && !isActive ? styles.selected : '',
    isActive ? styles.activeCell : '',
    edges.top ? styles.selectionTop : '',
    edges.bottom ? styles.selectionBottom : '',
    edges.left ? styles.selectionLeft : '',
    edges.right ? styles.selectionRight : '',
    styles.readOnlyCell,
    isFrozen ? styles.frozenCell : '',
    isFrozenLast ? styles.frozenLastCell : '',
  ]
    .filter(Boolean)
    .join(' ')

  const cellStyle: React.CSSProperties = {
    width,
    minWidth: width,
    ...(isFrozen ? { left: stickyLeft } : undefined),
  }

  return (
    <div className={cellClassName} style={cellStyle} data-row={rowIndex} data-col={colIndex}>
      {column.render(row, rowIndex)}
    </div>
  )
}

export const ActionCell = memo(ActionCellInner) as typeof ActionCellInner
