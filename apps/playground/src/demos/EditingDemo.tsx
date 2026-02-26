import type { ColumnDef, ValidationResult } from '@heynow/react-spread-sheet-table'
import { SpreadSheetTable, useSpreadSheetTable } from '@heynow/react-spread-sheet-table'

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
  { key: 'category', header: 'Category', type: 'list', options: ['A', 'B', 'C', 'D'] },
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
      // biome-ignore lint: demo logging
      console.log('Validation errors:', errors)
    },
  })

  const errors = table.getValidationErrors()
  const errorCount = errors.filter((e) => e.result.level === 'error').length
  const warnCount = errors.filter((e) => e.result.level === 'warn').length

  return (
    <div>
      <h2>編集 & バリデーション</h2>
      <p style={{ color: '#666', marginBottom: 16 }}>
        組み込みバリデーション (必須、最小/最大、パターン) + カスタムバリデーション
        (高スコア警告)。エラーセルにホバーでツールチップ表示。
      </p>
      <div style={{ marginBottom: 12, display: 'flex', gap: 16 }}>
        <span style={{ color: '#e53935' }}>エラー: {errorCount}</span>
        <span style={{ color: '#f9a825' }}>警告: {warnCount}</span>
        <span>有効: {table.isValid() ? 'はい' : 'いいえ'}</span>
      </div>
      <SpreadSheetTable table={table} height={300} />
    </div>
  )
}
