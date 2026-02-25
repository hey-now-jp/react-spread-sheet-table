import { memo, useCallback, useMemo, useState } from 'react'
import type { TableStore } from '../core/store/create-store'
import type { DataColumnDef } from '../core/types/column'
import type { CellPosition } from '../core/types/selection'
import { isActiveCell, isInSelection } from '../core/types/selection'
import type { CellValidationError } from '../core/types/validation'
import styles from '../styles/cell.module.css'
import { BooleanEditor } from './editors/BooleanEditor'
import { DateEditor } from './editors/DateEditor'
import { ListEditor } from './editors/ListEditor'
import { NumberEditor } from './editors/NumberEditor'
import { TextEditor } from './editors/TextEditor'
import { TimeEditor } from './editors/TimeEditor'

type CellProps<T> = {
  readonly column: DataColumnDef<T>
  readonly rowIndex: number
  readonly colIndex: number
  readonly store: TableStore<T>
  readonly readOnly: boolean
  readonly onCellChange: (rowIndex: number, columnKey: keyof T, value: T[keyof T]) => void
}

function CellInner<T>({ column, rowIndex, colIndex, store, readOnly, onCellChange }: CellProps<T>) {
  const [showTooltip, setShowTooltip] = useState(false)

  const value = store.getCellValue(rowIndex, column.key as keyof T)
  const selection = store.getSelection()
  const editingCell = store.getEditingCell()
  const editingValue = store.getEditingValue()

  const isEditing =
    editingCell !== null && editingCell.rowIndex === rowIndex && editingCell.colIndex === colIndex

  const isSelected = isInSelection(selection, rowIndex, colIndex)
  const isActive = isActiveCell(selection, rowIndex, colIndex)

  const validationErrors = store.getValidationErrors()
  const cellError = useMemo(
    () =>
      validationErrors.find(
        (e: CellValidationError) => e.rowIndex === rowIndex && e.columnKey === String(column.key),
      ),
    [validationErrors, rowIndex, column.key],
  )

  const isReadOnly = readOnly || column.readOnly === true
  const width = column.width ?? 150

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      const position: CellPosition = { rowIndex, colIndex }
      if (e.shiftKey) {
        store.extendSelection(position)
      } else {
        store.setActiveCell(position)
      }
    },
    [store, rowIndex, colIndex],
  )

  const handleDoubleClick = useCallback(() => {
    if (isReadOnly) return
    if (column.type === 'boolean') return
    store.startEditing({ rowIndex, colIndex }, String(value ?? ''))
  }, [store, rowIndex, colIndex, isReadOnly, column.type, value])

  const handleCommit = useCallback(() => {
    if (!isEditing) return
    const newValue = parseValue(editingValue, column)
    onCellChange(rowIndex, column.key as keyof T, newValue as T[keyof T])
    store.stopEditing()
  }, [isEditing, editingValue, column, onCellChange, rowIndex, store])

  const handleCancel = useCallback(() => {
    store.stopEditing()
  }, [store])

  const handleEditChange = useCallback(
    (val: string) => {
      store.updateEditingValue(val)
    },
    [store],
  )

  const handleBooleanChange = useCallback(
    (checked: boolean) => {
      onCellChange(rowIndex, column.key as keyof T, checked as T[keyof T])
    },
    [onCellChange, rowIndex, column.key],
  )

  const cellClassName = [
    styles.cell,
    isSelected && !isActive ? styles.selected : '',
    isActive ? styles.activeCell : '',
    cellError?.result.level === 'error' ? styles.errorCell : '',
    cellError?.result.level === 'warn' ? styles.warnCell : '',
    column.type === 'boolean' ? styles.booleanCell : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div
      className={cellClassName}
      style={{ width, minWidth: width }}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onMouseEnter={() => cellError && setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      tabIndex={-1}
      data-row={rowIndex}
      data-col={colIndex}
    >
      {isEditing ? (
        renderEditor(column, editingValue, handleEditChange, handleCommit, handleCancel)
      ) : column.type === 'boolean' ? (
        <BooleanEditor
          value={Boolean(value)}
          onChange={handleBooleanChange}
          readOnly={isReadOnly}
        />
      ) : (
        <span className={styles.cellContent}>{formatDisplayValue(value, column)}</span>
      )}
      {showTooltip && cellError && <div className={styles.tooltip}>{cellError.result.message}</div>}
    </div>
  )
}

function renderEditor<T>(
  column: DataColumnDef<T>,
  editingValue: string,
  onChange: (val: string) => void,
  onCommit: () => void,
  onCancel: () => void,
) {
  switch (column.type) {
    case 'text':
      return (
        <TextEditor
          value={editingValue}
          onChange={onChange}
          onCommit={onCommit}
          onCancel={onCancel}
        />
      )
    case 'number':
      return (
        <NumberEditor
          value={editingValue}
          onChange={onChange}
          onCommit={onCommit}
          onCancel={onCancel}
          min={column.min}
          max={column.max}
          step={column.step}
        />
      )
    case 'date':
      return (
        <DateEditor
          value={editingValue}
          onChange={onChange}
          onCommit={onCommit}
          onCancel={onCancel}
          minDate={column.minDate}
          maxDate={column.maxDate}
        />
      )
    case 'time':
      return (
        <TimeEditor
          value={editingValue}
          onChange={onChange}
          onCommit={onCommit}
          onCancel={onCancel}
          step={column.step}
        />
      )
    case 'list':
      return (
        <ListEditor
          value={editingValue}
          options={column.options as string[]}
          onChange={onChange}
          onCommit={onCommit}
          onCancel={onCancel}
        />
      )
    case 'boolean':
      return null
  }
}

function parseValue<T>(stringValue: string, column: DataColumnDef<T>): unknown {
  switch (column.type) {
    case 'number': {
      const num = Number(stringValue)
      return Number.isNaN(num) ? stringValue : num
    }
    case 'boolean':
      return stringValue === 'true'
    default:
      return stringValue
  }
}

function formatDisplayValue<T>(value: unknown, column: DataColumnDef<T>): string {
  if (value === null || value === undefined) return ''
  if (column.type === 'boolean') return String(value)
  if (column.type === 'number' && column.precision !== undefined) {
    return Number(value).toFixed(column.precision)
  }
  return String(value)
}

export const Cell = memo(CellInner) as typeof CellInner
