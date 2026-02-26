import type { SortState } from '../types'

export function applySortToIndices<T>(
  rows: ReadonlyArray<T>,
  indices: number[],
  sortState: SortState<T>,
): number[] {
  if (sortState === null) return indices

  const { key, direction } = sortState
  const multiplier = direction === 'asc' ? 1 : -1

  return [...indices].sort((a, b) => {
    const aVal = rows[a][key]
    const bVal = rows[b][key]
    return multiplier * compareValues(aVal, bVal)
  })
}

export function compareValues(a: unknown, b: unknown): number {
  if (a === b) return 0
  if (a == null) return -1
  if (b == null) return 1

  if (typeof a === 'string' && typeof b === 'string') {
    return a.localeCompare(b)
  }
  if (typeof a === 'number' && typeof b === 'number') {
    return a - b
  }
  if (typeof a === 'boolean' && typeof b === 'boolean') {
    return a === b ? 0 : a ? 1 : -1
  }

  return String(a).localeCompare(String(b))
}
