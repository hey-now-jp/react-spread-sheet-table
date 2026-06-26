import type { CellMeta, ColumnDef, ValidationResult } from '@heynow-jp/react-spread-sheet-table'
import { SpreadSheetTable, useSpreadSheetTable } from '@heynow-jp/react-spread-sheet-table'
import { useCallback } from 'react'

type FormRow = {
  id: string
  email: string
  score: number
  startDate: string
  approved: boolean
  category: string
}

const formData: ReadonlyArray<FormRow> = [
  {
    id: '1',
    email: 'alice@example.com',
    score: 85,
    startDate: '2024-01-15',
    approved: true,
    category: 'A',
  },
  { id: '2', email: '', score: -5, startDate: '2023-06-01', approved: false, category: 'B' },
  {
    id: '3',
    email: 'invalid-email',
    score: 110,
    startDate: '2025-12-31',
    approved: true,
    category: 'C',
  },
]

const columns: ReadonlyArray<ColumnDef<FormRow>> = [
  {
    key: 'email',
    header: 'Email',
    type: 'text',
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
  { key: 'score', header: 'Score (0-100)', type: 'number', min: 0, max: 100 },
  { key: 'startDate', header: 'Start Date', type: 'date', minDate: '2024-01-01' },
  { key: 'approved', header: 'Approved', type: 'boolean', width: 100 },
  {
    key: 'category',
    header: 'Category',
    type: 'list',
    options: [
      { value: 'A', label: 'A' },
      { value: 'B', label: 'B' },
      { value: 'C', label: 'C' },
      { value: 'D', label: 'D' },
    ],
  },
]

function customValidate(
  value: unknown,
  _row: FormRow,
  columnKey: keyof FormRow,
): ValidationResult | null {
  if (columnKey === 'score' && typeof value === 'number' && value > 80) {
    return { level: 'warn', message: '高スコアです - 再確認してください' }
  }
  return null
}

export function EditingDemo() {
  const table = useSpreadSheetTable<FormRow>({
    columns,
    initialData: formData,
    rowKey: 'id',
    validate: customValidate,
    onValidationError: (errors) => {
      console.log('Validation errors:', errors)
    },
  })

  const cellMeta = useCallback((row: FormRow, columnKey: keyof FormRow): CellMeta | undefined => {
    // approved が false のセルにツールチップ表示
    if (columnKey === 'approved' && !row.approved) {
      return { tooltip: '未承認です - 確認してください' }
    }
    // category が "C" のセルを強調
    if (columnKey === 'category' && row.category === 'C') {
      return {
        className: 'cell-highlight',
        tooltip: 'カテゴリ C は要レビュー対象です',
      }
    }
    // score が 50 未満のセルを強調
    if (columnKey === 'score' && row.score < 50) {
      return {
        className: 'cell-low-score',
        tooltip: `スコアが低いです (${row.score})`,
      }
    }
    return undefined
  }, [])

  const errors = table.getValidationErrors()
  const errorCount = errors.filter((e) => e.result.level === 'error').length
  const warnCount = errors.filter((e) => e.result.level === 'warn').length

  return (
    <div className="demo-container">
      <div className="demo-stats">
        <span style={{ color: '#e53935' }}>エラー: {errorCount}</span>
        <span style={{ color: '#f9a825' }}>警告: {warnCount}</span>
        <span>有効: {table.isValid() ? 'はい' : 'いいえ'}</span>
      </div>
      <div className="demo-actions">
        <button type="button" onClick={() => table.undo()} disabled={!table.canUndo}>
          元に戻す
        </button>
        <button type="button" onClick={() => table.redo()} disabled={!table.canRedo}>
          やり直し
        </button>
      </div>
      <SpreadSheetTable table={table} height={300} cellMeta={cellMeta} />
    </div>
  )
}
