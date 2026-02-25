import { memo } from 'react'
import type { ActionColumnDef } from '../core/types/column'
import styles from '../styles/cell.module.css'

type ActionCellProps<T> = {
  readonly column: ActionColumnDef<T>
  readonly row: T
  readonly rowIndex: number
}

function ActionCellInner<T>({ column, row, rowIndex }: ActionCellProps<T>) {
  const width = column.width ?? 150

  return (
    <div className={styles.cell} style={{ width, minWidth: width }}>
      {column.render(row, rowIndex)}
    </div>
  )
}

export const ActionCell = memo(ActionCellInner) as typeof ActionCellInner
