import type { ColumnDef } from '@heynow/react-spread-sheet-table'
import { SpreadSheetTable, useSpreadSheetTable } from '@heynow/react-spread-sheet-table'
import { useState } from 'react'
import type { Employee } from './sample-data'
import { sampleData } from './sample-data'

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
    key: 'skills',
    header: 'スキル',
    type: 'multiList',
    options: ['React', 'TypeScript', 'Node.js', 'Python', 'Docker', 'SQL', 'Excel', 'PowerPoint'],
    width: 200,
  },
  {
    key: 'actions',
    type: 'action',
    header: '',
    width: 80,
    pin: 'right',
    render: (row) => (
      <button type="button" onClick={() => alert(`Detail: ${row.name}`)}>
        Detail
      </button>
    ),
  },
]

export function BasicDemo() {
  const [message, setMessage] = useState<string | null>(null)

  const table = useSpreadSheetTable<Employee>({
    columns,
    initialData: sampleData,
    rowKey: 'id',
    reorderable: true,
    onChange: (changedRows) => {
      console.log('Changed rows:', changedRows)
    },
    onReorder: (newData) => {
      setMessage(`${newData.length} 行を並び替えました`)
      setTimeout(() => setMessage(null), 2000)
    },
  })

  return (
    <div className="demo-container">
      <div className="demo-actions">
        <button type="button" onClick={() => table.resetToInitial()}>
          リセット
        </button>
        <button
          type="button"
          onClick={() => {
            table.markAsSaved()
            setMessage('保存しました')
            setTimeout(() => setMessage(null), 2000)
          }}
        >
          保存
        </button>
        <span className="demo-status" style={{ color: table.isDirty ? '#e53935' : '#4caf50' }}>
          {table.isDirty ? '未保存の変更あり' : '変更なし'}
        </span>
        {message && (
          <span className="demo-status" style={{ color: '#2196f3' }}>
            {message}
          </span>
        )}
      </div>
      <SpreadSheetTable table={table} height={500} />
    </div>
  )
}
