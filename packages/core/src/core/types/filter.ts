// ---------------------------------------------------------------------------
// Filter condition
// ---------------------------------------------------------------------------

export type FilterCondition =
  | { readonly type: 'eq'; readonly value: unknown }
  | { readonly type: 'contains'; readonly value: string }
  | { readonly type: 'range'; readonly min?: number; readonly max?: number }
  | { readonly type: 'in'; readonly values: readonly unknown[] }

// ---------------------------------------------------------------------------
// Filter state (per column)
// ---------------------------------------------------------------------------

export type FilterState<T> = ReadonlyMap<keyof T, FilterCondition>
