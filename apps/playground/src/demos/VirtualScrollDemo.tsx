import type { ColumnDef } from '@heynow/react-spread-sheet-table'
import { SpreadSheetTable, useSpreadSheetTable } from '@heynow/react-spread-sheet-table'
import { useMemo } from 'react'

type LargeRow = {
  id: string
  index: number
  name: string
  value: number
  active: boolean
}

const columns: ReadonlyArray<ColumnDef<LargeRow>> = [
  { key: 'index', header: '#', type: 'number', width: 80, readOnly: true },
  { key: 'name', header: 'Name', type: 'text' },
  { key: 'value', header: 'Value', type: 'number', min: 0, max: 10000 },
  { key: 'active', header: 'Active', type: 'boolean', width: 80 },
]

function generateData(count: number): ReadonlyArray<LargeRow> {
  return Array.from({ length: count }, (_, i) => ({
    id: String(i + 1),
    index: i + 1,
    name: `Row ${i + 1}`,
    value: Math.floor(Math.random() * 10000),
    active: Math.random() > 0.3,
  }))
}

export function VirtualScrollDemo() {
  const data = useMemo(() => generateData(10000), [])

  const table = useSpreadSheetTable<LargeRow>({
    columns,
    initialData: data,
    rowKey: 'id',
  })

  return (
    <div>
      <h2>Virtual Scroll (10,000 rows)</h2>
      <p style={{ color: '#666', marginBottom: 16 }}>
        Only visible rows are rendered in the DOM. Scroll to see virtual rendering in action.
      </p>
      <SpreadSheetTable table={table} height={600} />
    </div>
  )
}
