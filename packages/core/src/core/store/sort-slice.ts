import type { SortDirection, SortState } from '../types'

export type SortSlice<T> = {
  readonly sortState: SortState<T>
}

export function createSortSlice<T>(): SortSlice<T> {
  return { sortState: null }
}

export function setSort<T>(key: keyof T, direction: SortDirection): SortSlice<T> {
  return { sortState: { key, direction } }
}

export function clearSort<T>(): SortSlice<T> {
  return { sortState: null }
}

export function toggleSort<T>(slice: SortSlice<T>, key: keyof T): SortSlice<T> {
  if (slice.sortState === null || slice.sortState.key !== key) {
    return { sortState: { key, direction: 'asc' } }
  }
  if (slice.sortState.direction === 'asc') {
    return { sortState: { key, direction: 'desc' } }
  }
  return { sortState: null }
}
