import type { ColumnDef } from '@heynow/react-spread-sheet-table'

type Employee = {
  id: string
  name: string
  age: number
  joinDate: string
  active: boolean
  department: string
}

const columns: ReadonlyArray<ColumnDef<Employee>> = [
  { key: 'name', header: 'Name', type: 'text' },
  { key: 'age', header: 'Age', type: 'number', min: 0, max: 150 },
  { key: 'joinDate', header: 'Join Date', type: 'date' },
  { key: 'active', header: 'Active', type: 'boolean' },
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
      <button onClick={() => alert(`Detail: ${row.name}`)}>Detail</button>
    ),
  },
]

const sampleData: ReadonlyArray<Employee> = [
  { id: '1', name: 'Tanaka Taro', age: 28, joinDate: '2022-04-01', active: true, department: 'Engineering' },
  { id: '2', name: 'Suzuki Hanako', age: 32, joinDate: '2020-01-15', active: true, department: 'Sales' },
  { id: '3', name: 'Yamada Jiro', age: 45, joinDate: '2015-06-01', active: false, department: 'HR' },
]

export function App() {
  return (
    <div style={{ padding: 24 }}>
      <h1>SpreadSheet Table Playground</h1>
      <p>Column definitions ready. Table component coming soon.</p>
      <pre>{JSON.stringify(columns.map(c => ({ key: c.key, type: c.type })), null, 2)}</pre>
      <pre>{JSON.stringify(sampleData, null, 2)}</pre>
    </div>
  )
}
