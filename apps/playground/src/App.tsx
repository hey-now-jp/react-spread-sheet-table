import type { ColumnDef } from '@heynow/react-spread-sheet-table'
import type { Employee } from './sample-data'
import { sampleData } from './sample-data'

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

export function App() {
  return (
    <div style={{ padding: 24 }}>
      <h1>SpreadSheet Table Playground</h1>
      <p>Column definitions ready. Table component coming soon.</p>
      <pre>
        {JSON.stringify(
          columns.map((c) => ({ key: c.key, type: c.type })),
          null,
          2,
        )}
      </pre>
      <pre>{JSON.stringify(sampleData, null, 2)}</pre>
    </div>
  )
}
