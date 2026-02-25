import type { FilterCondition, FilterState } from '../types/filter'

export type FilterSlice<T> = {
  readonly filterState: FilterState<T>
}

export function createFilterSlice<T>(): FilterSlice<T> {
  return { filterState: new Map() }
}

export function setFilter<T>(
  slice: FilterSlice<T>,
  key: keyof T,
  condition: FilterCondition,
): FilterSlice<T> {
  const newState = new Map(slice.filterState)
  newState.set(key, condition)
  return { filterState: newState }
}

export function clearFilter<T>(slice: FilterSlice<T>, key?: keyof T): FilterSlice<T> {
  if (key === undefined) {
    return { filterState: new Map() }
  }
  const newState = new Map(slice.filterState)
  newState.delete(key)
  return { filterState: newState }
}
