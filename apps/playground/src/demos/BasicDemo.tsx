import type { ColumnDef } from '@heynow/react-spread-sheet-table'
import { SpreadSheetTable, useSpreadSheetTable } from '@heynow/react-spread-sheet-table'
import type { Employee } from '../sample-data'
import { sampleData } from '../sample-data'

const columns: ReadonlyArray<ColumnDef<Employee>> = [
  { key: 'name', header: '名前', type: 'text', maxLength: 50 },
  { key: 'age', header: '年齢', type: 'number', min: 0, max: 150, width: 80 },
  { key: 'joinDate', header: '入社日', type: 'date' },
  { key: 'startTime', header: '始業時間', type: 'time', step: 900 },
  { key: 'active', header: '在籍', type: 'boolean', width: 80 },
  {
    key: 'department',
    header: '部署',
    type: 'list',
    options: ['Engineering', 'Sales', 'HR', 'Finance'],
  },
  {
    key: 'actions',
    type: 'action',
    header: '',
    width: 80,
    pin: 'right',
    render: (row) => (
      <button type="button" onClick={() => alert(`詳細: ${row.name}`)}>
        詳細
      </button>
    ),
  },
]

export function BasicDemo() {
  const table = useSpreadSheetTable<Employee>({
    columns,
    initialData: sampleData,
    rowKey: 'id',
    onChange: (changedRows) => {
      console.log('Changed rows:', changedRows)
    },
  })

  return (
    <div>
      <h2>基本テーブル</h2>
      <p style={{ color: '#666', marginBottom: 16 }}>
        全カラム型対応: ソート、フィルター、選択、セル編集、クリップボード、キーボード操作
      </p>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <button
          type="button"
          onClick={() => table.resetToInitial()}
          style={{ padding: '6px 12px' }}
        >
          リセット
        </button>
        <button
          type="button"
          onClick={() => {
            table.markAsSaved()
            alert('保存しました')
          }}
          style={{ padding: '6px 12px' }}
        >
          保存
        </button>
        <span style={{ padding: '6px 0', color: table.isDirty ? '#e53935' : '#4caf50' }}>
          {table.isDirty ? '未保存の変更あり' : '変更なし'}
        </span>
      </div>
      <SpreadSheetTable table={table} height={500} />
    </div>
  )
}
