import type { ReactNode } from 'react'

// ---------------------------------------------------------------------------
// Common base
// ---------------------------------------------------------------------------

type ColumnDefBase<T, K extends keyof T> = {
  readonly key: K
  readonly header: string
  readonly width?: number
  readonly readOnly?: boolean
  readonly required?: boolean
  readonly hidden?: boolean
}

// ---------------------------------------------------------------------------
// Data column variants (Discriminated Union)
// ---------------------------------------------------------------------------

export type TextColumnDef<T, K extends keyof T = keyof T> = ColumnDefBase<T, K> & {
  readonly type: 'text'
  readonly maxLength?: number
  readonly pattern?: RegExp
}

export type NumberColumnDef<T, K extends keyof T = keyof T> = ColumnDefBase<T, K> & {
  readonly type: 'number'
  readonly min?: number
  readonly max?: number
  readonly step?: number
  readonly precision?: number
}

export type DateColumnDef<T, K extends keyof T = keyof T> = ColumnDefBase<T, K> & {
  readonly type: 'date'
  readonly minDate?: string
  readonly maxDate?: string
}

export type TimeColumnDef<T, K extends keyof T = keyof T> = ColumnDefBase<T, K> & {
  readonly type: 'time'
  readonly minTime?: string
  readonly maxTime?: string
  readonly step?: number
}

export type BooleanColumnDef<T, K extends keyof T = keyof T> = ColumnDefBase<T, K> & {
  readonly type: 'boolean'
}

// ---------------------------------------------------------------------------
// List option item
// ---------------------------------------------------------------------------

/** 選択肢の定義。文字列または { value, label } ペア */
export type ListOptionItem = string | { readonly value: string; readonly label: string }

/** ListOptionItem から value を取得する */
export function getOptionValue(item: ListOptionItem): string {
  return typeof item === 'string' ? item : item.value
}

/** ListOptionItem から label を取得する */
export function getOptionLabel(item: ListOptionItem): string {
  return typeof item === 'string' ? item : item.label
}

/** options 配列から value に対応する label を検索する */
export function findOptionLabel(options: readonly ListOptionItem[], value: string): string {
  for (const opt of options) {
    if (typeof opt === 'string') {
      if (opt === value) return opt
    } else {
      if (opt.value === value) return opt.label
    }
  }
  return value
}

export type ListColumnDef<T, K extends keyof T = keyof T> = ColumnDefBase<T, K> & {
  readonly type: 'list'
  readonly options: readonly ListOptionItem[]
}

export type MultiListColumnDef<T, K extends keyof T = keyof T> = ColumnDefBase<T, K> & {
  readonly type: 'multiList'
  readonly options: readonly ListOptionItem[]
}

// ---------------------------------------------------------------------------
// Data column union
// ---------------------------------------------------------------------------

export type DataColumnDef<T, K extends keyof T = keyof T> =
  | TextColumnDef<T, K>
  | NumberColumnDef<T, K>
  | DateColumnDef<T, K>
  | TimeColumnDef<T, K>
  | BooleanColumnDef<T, K>
  | ListColumnDef<T, K>
  | MultiListColumnDef<T, K>

// ---------------------------------------------------------------------------
// Action column
// ---------------------------------------------------------------------------

export type ActionColumnDef<T> = {
  readonly type: 'action'
  readonly key: string
  readonly header?: string
  readonly width?: number
  readonly pin?: 'left' | 'right'
  readonly render: (row: T, rowIndex: number) => ReactNode
}

// ---------------------------------------------------------------------------
// Combined column definition
// ---------------------------------------------------------------------------

export type ColumnDef<T> = DataColumnDef<T> | ActionColumnDef<T>

// ---------------------------------------------------------------------------
// Type guard
// ---------------------------------------------------------------------------

export function isDataColumn<T>(col: ColumnDef<T>): col is DataColumnDef<T> {
  return col.type !== 'action'
}

export function isActionColumn<T>(col: ColumnDef<T>): col is ActionColumnDef<T> {
  return col.type === 'action'
}

// ---------------------------------------------------------------------------
// Data column type (utility for extracting type string)
// ---------------------------------------------------------------------------

export type DataColumnType = DataColumnDef<never>['type']
