import type { ColumnDef } from '@heynow/react-spread-sheet-table'
import { SpreadSheetTable, useSpreadSheetTable } from '@heynow/react-spread-sheet-table'
import type { Employee } from '../sample-data'
import { sampleData } from '../sample-data'

const columns: ReadonlyArray<ColumnDef<Employee>> = [
  { key: 'name', header: 'Name', type: 'text', maxLength: 50 },
  { key: 'age', header: 'Age', type: 'number', min: 0, max: 150, width: 80 },
  { key: 'joinDate', header: 'Join Date', type: 'date' },
  { key: 'startTime', header: 'Start Time', type: 'time', step: 900 },
  { key: 'active', header: 'Active', type: 'boolean', width: 80 },
  {
    key: 'department',
    header: 'Department',
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
      <button type="button" onClick={() => alert(`Detail: ${row.name}`)}>
        Detail
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
      // biome-ignore lint: demo logging
      console.log('Changed rows:', changedRows)
    },
  })

  return (
    <div>
      <h2>Basic Table</h2>
      <p style={{ color: '#666', marginBottom: 16 }}>
        All column types with sort, filter, selection, cell editing, clipboard, and keyboard
        navigation.
      </p>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <button
          type="button"
          onClick={() => table.resetToInitial()}
          style={{ padding: '6px 12px' }}
        >
          Reset
        </button>
        <button
          type="button"
          onClick={() => {
            table.markAsSaved()
            alert('Saved!')
          }}
          style={{ padding: '6px 12px' }}
        >
          Save
        </button>
        <span style={{ padding: '6px 0', color: table.isDirty ? '#e53935' : '#4caf50' }}>
          {table.isDirty ? 'Unsaved changes' : 'No changes'}
        </span>
      </div>
      <SpreadSheetTable table={table} height={500} />
    </div>
  )
}
