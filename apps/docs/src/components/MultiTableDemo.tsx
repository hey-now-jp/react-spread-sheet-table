import type { ColumnDef } from '@hey-now-jp/react-spread-sheet-table'
import {
  ReactSpreadSheetTableProvider,
  SpreadSheetTable,
  useSpreadSheetTable,
} from '@hey-now-jp/react-spread-sheet-table'

const priorityOptions = ['High', 'Medium', 'Low'] as const

// ---------------------------------------------------------------------------
// Table A: 社員一覧 (3 columns)
// ---------------------------------------------------------------------------

type Staff = {
  id: string
  name: string
  priority: string
}

const staffData: ReadonlyArray<Staff> = [
  { id: '1', name: 'Tanaka Taro', priority: 'High' },
  { id: '2', name: 'Suzuki Hanako', priority: 'Medium' },
  { id: '3', name: 'Yamada Jiro', priority: 'Low' },
  { id: '4', name: 'Sato Yuki', priority: 'High' },
  { id: '5', name: 'Takahashi Ren', priority: 'Medium' },
]

const staffColumns: ReadonlyArray<ColumnDef<Staff>> = [
  { key: 'name', header: '名前', type: 'text', width: 160 },
  {
    key: 'priority',
    header: '優先度',
    type: 'list',
    options: [...priorityOptions],
    width: 100,
  },
]

// ---------------------------------------------------------------------------
// Table B: タスク一覧 (5 columns)
// ---------------------------------------------------------------------------

type Task = {
  id: string
  title: string
  assignee: string
  priority: string
  deadline: string
  done: boolean
}

const taskData: ReadonlyArray<Task> = [
  {
    id: 't1',
    title: 'API設計',
    assignee: 'Tanaka',
    priority: 'High',
    deadline: '2026-04-15',
    done: false,
  },
  {
    id: 't2',
    title: 'DB移行',
    assignee: 'Suzuki',
    priority: 'Medium',
    deadline: '2026-05-01',
    done: false,
  },
  {
    id: 't3',
    title: 'テスト追加',
    assignee: 'Yamada',
    priority: 'Low',
    deadline: '2026-04-30',
    done: true,
  },
  {
    id: 't4',
    title: 'CI修正',
    assignee: 'Sato',
    priority: 'High',
    deadline: '2026-03-31',
    done: false,
  },
  {
    id: 't5',
    title: 'ドキュメント',
    assignee: 'Takahashi',
    priority: 'Low',
    deadline: '2026-06-01',
    done: true,
  },
]

const taskColumns: ReadonlyArray<ColumnDef<Task>> = [
  { key: 'title', header: 'タスク', type: 'text', width: 140 },
  { key: 'assignee', header: '担当', type: 'text', width: 100 },
  {
    key: 'priority',
    header: '優先度',
    type: 'list',
    options: [...priorityOptions],
    width: 100,
  },
  { key: 'deadline', header: '期限', type: 'date', width: 130 },
  { key: 'done', header: '完了', type: 'boolean', width: 60 },
]

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StaffTable() {
  const table = useSpreadSheetTable<Staff>({
    columns: staffColumns,
    initialData: staffData,
    rowKey: 'id',
    sortable: true,
    filterable: true,
  })

  return (
    <div>
      <h3 className="multi-table-heading">社員一覧</h3>
      <SpreadSheetTable table={table} autoWidth />
    </div>
  )
}

function TaskTable() {
  const table = useSpreadSheetTable<Task>({
    columns: taskColumns,
    initialData: taskData,
    rowKey: 'id',
    sortable: true,
    filterable: true,
  })

  return (
    <div>
      <h3 className="multi-table-heading">タスク一覧</h3>
      <SpreadSheetTable table={table} autoWidth />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main demo
// ---------------------------------------------------------------------------

export function MultiTableDemo() {
  return (
    <ReactSpreadSheetTableProvider>
      <div className="demo-container">
        <StaffTable />
        <div style={{ marginTop: 24 }} />
        <TaskTable />
      </div>
    </ReactSpreadSheetTableProvider>
  )
}
