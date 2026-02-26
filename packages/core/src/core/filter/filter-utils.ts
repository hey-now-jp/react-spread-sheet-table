import type { FilterCondition, FilterState } from '../types'

export function applyFiltersToIndices<T>(
  rows: ReadonlyArray<T>,
  indices: number[],
  filterState: FilterState<T>,
): number[] {
  if (filterState.size === 0) return indices

  return indices.filter((rowIndex) => {
    const row = rows[rowIndex]
    for (const [key, condition] of filterState) {
      if (!matchesFilter(row[key], condition)) return false
    }
    return true
  })
}

export function matchesFilter(value: unknown, condition: FilterCondition): boolean {
  switch (condition.type) {
    case 'eq':
      return value === condition.value
    case 'contains':
      return String(value ?? '')
        .toLowerCase()
        .includes(condition.value.toLowerCase())
    case 'range': {
      const num = typeof value === 'number' ? value : Number(value)
      if (Number.isNaN(num)) return false
      if (condition.min !== undefined && num < condition.min) return false
      if (condition.max !== undefined && num > condition.max) return false
      return true
    }
    case 'in':
      return condition.values.includes(value)
  }
}
