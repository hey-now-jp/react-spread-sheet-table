import type { ColumnDef, ProcessRowChange } from '@heynow-jp/react-spread-sheet-table'
import { SpreadSheetTable, useSpreadSheetTable } from '@heynow-jp/react-spread-sheet-table'
import { useState } from 'react'

type Shift = {
  id: string
  staff: string
  startTime: string
  endTime: string
}

const shiftData: ReadonlyArray<Shift> = [
  { id: '1', staff: 'Tanaka', startTime: '09:00', endTime: '10:00' },
  { id: '2', staff: 'Suzuki', startTime: '11:00', endTime: '12:00' },
  { id: '3', staff: 'Sato', startTime: '13:00', endTime: '14:00' },
]

const columns: ReadonlyArray<ColumnDef<Shift>> = [
  { key: 'staff', header: '担当者', type: 'text' },
  { key: 'startTime', header: '開始', type: 'time', width: 120 },
  { key: 'endTime', header: '終了', type: 'time', width: 120 },
]

/** "HH:MM" を分に変換する。不正な形式なら null */
function toMinutes(time: string): number | null {
  const matched = /^(\d{2}):(\d{2})$/.exec(time)
  if (matched === null) return null
  return Number(matched[1]) * 60 + Number(matched[2])
}

/** 分を "HH:MM" に変換する (24時間で折り返す) */
function toTimeString(minutes: number): string {
  const wrapped = ((minutes % 1440) + 1440) % 1440
  const hours = String(Math.floor(wrapped / 60)).padStart(2, '0')
  return `${hours}:${String(wrapped % 60).padStart(2, '0')}`
}

const processRowChange: ProcessRowChange<Shift> = (candidate, previous, context) => {
  // クリア操作は担当者と開始時刻を必須として拒否する
  if (context.source === 'clear') {
    const clearedKey = (['staff', 'startTime'] as const).find(
      (key) => candidate[key] === '' && previous[key] !== '',
    )
    if (clearedKey !== undefined) {
      return {
        status: 'rejected',
        issues: [
          {
            columnKey: clearedKey,
            result: { level: 'error', message: 'この列はクリアできません' },
          },
        ],
      }
    }
  }

  const changedKeys = new Set(context.changes.map((change) => change.key))

  // 開始のみ変更されたら、元の所要時間を保って終了を補正する
  if (changedKeys.has('startTime') && !changedKeys.has('endTime')) {
    const previousStart = toMinutes(previous.startTime)
    const previousEnd = toMinutes(previous.endTime)
    const nextStart = toMinutes(candidate.startTime)
    if (previousStart !== null && previousEnd !== null && nextStart !== null) {
      const duration = previousEnd - previousStart
      return {
        status: 'accepted',
        row: { ...candidate, endTime: toTimeString(nextStart + duration) },
      }
    }
  }

  const start = toMinutes(candidate.startTime)
  const end = toMinutes(candidate.endTime)
  if (start !== null && end !== null && end <= start) {
    return {
      status: 'rejected',
      issues: [
        {
          columnKey: 'endTime',
          result: { level: 'error', message: '終了は開始より後にしてください' },
        },
      ],
    }
  }

  return { status: 'accepted', row: candidate }
}

export function RowChangeDemo() {
  const [rejected, setRejected] = useState<string | null>(null)
  const [committed, setCommitted] = useState<string | null>(null)
  const [commitCount, setCommitCount] = useState(0)

  const table = useSpreadSheetTable<Shift>({
    columns,
    initialData: shiftData,
    rowKey: 'id',
    processRowChange,
    onRowChangeCommitted: (commit) => {
      const rows = commit.rows.map((row) => {
        const changes = row.changes
          .map((change) => `${String(change.key)} ${change.previousValue}→${change.newValue}`)
          .join(', ')
        return `#${row.rowIndex} ${changes}`
      })
      setCommitted(`${commit.source}: ${rows.join(' / ')}`)
      setCommitCount((count) => count + 1)
    },
    onRowChangeRejected: (rejection) => {
      setRejected(rejection.errors.map((error) => error.result.message).join(' / '))
      setCommitted(null)
    },
    onChange: () => setRejected(null),
  })

  return (
    <div className="demo-container">
      <div className="demo-actions">
        <button type="button" onClick={() => table.undo()} disabled={!table.canUndo}>
          元に戻す
        </button>
        <span className="demo-status" data-testid="rejected-message" style={{ color: '#e53935' }}>
          {rejected ?? ''}
        </span>
        <span className="demo-status" data-testid="committed-message">
          {committed ?? ''}
        </span>
        <span className="demo-status" data-testid="commit-count">
          {commitCount}
        </span>
      </div>
      <SpreadSheetTable table={table} height={240} />
    </div>
  )
}
