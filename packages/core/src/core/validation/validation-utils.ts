import type { DataColumnDef } from '../types/column'
import type { CellValidationError, ValidationResult } from '../types/validation'

export function validateCellValue<T>(
  value: unknown,
  column: DataColumnDef<T>,
  _row: T,
): ValidationResult | null {
  // required check
  if (column.required && (value === null || value === undefined || value === '')) {
    return { level: 'error', message: 'この項目は必須です' }
  }

  // Skip further checks if value is empty and not required
  if (value === null || value === undefined || value === '') {
    return null
  }

  // Type-specific validation
  switch (column.type) {
    case 'text':
      return validateText(value, column)
    case 'number':
      return validateNumber(value, column)
    case 'date':
      return validateDate(value, column)
    case 'time':
      return validateTime(value, column)
    case 'boolean':
    case 'list':
      return null
  }
}

function validateText<T>(
  value: unknown,
  column: Extract<DataColumnDef<T>, { type: 'text' }>,
): ValidationResult | null {
  const str = String(value)

  if (column.maxLength !== undefined && str.length > column.maxLength) {
    return { level: 'error', message: `最大${column.maxLength}文字までです` }
  }
  if (column.pattern !== undefined && !column.pattern.test(str)) {
    return { level: 'error', message: '形式が正しくありません' }
  }
  return null
}

function validateNumber<T>(
  value: unknown,
  column: Extract<DataColumnDef<T>, { type: 'number' }>,
): ValidationResult | null {
  const num = typeof value === 'number' ? value : Number(value)

  if (Number.isNaN(num)) {
    return { level: 'error', message: '数値を入力してください' }
  }
  if (column.min !== undefined && num < column.min) {
    return { level: 'error', message: `最小値は${column.min}です` }
  }
  if (column.max !== undefined && num > column.max) {
    return { level: 'error', message: `最大値は${column.max}です` }
  }
  return null
}

function validateDate<T>(
  value: unknown,
  column: Extract<DataColumnDef<T>, { type: 'date' }>,
): ValidationResult | null {
  const str = String(value)
  const date = new Date(str)

  if (Number.isNaN(date.getTime())) {
    return { level: 'error', message: '無効な日付です' }
  }
  if (column.minDate !== undefined && str < column.minDate) {
    return { level: 'error', message: `${column.minDate}以降の日付を入力してください` }
  }
  if (column.maxDate !== undefined && str > column.maxDate) {
    return { level: 'error', message: `${column.maxDate}以前の日付を入力してください` }
  }
  return null
}

function validateTime<T>(
  value: unknown,
  column: Extract<DataColumnDef<T>, { type: 'time' }>,
): ValidationResult | null {
  const str = String(value)

  if (!/^\d{2}:\d{2}(:\d{2})?$/.test(str)) {
    return { level: 'error', message: '無効な時刻形式です (HH:MM)' }
  }
  if (column.minTime !== undefined && str < column.minTime) {
    return { level: 'error', message: `${column.minTime}以降の時刻を入力してください` }
  }
  if (column.maxTime !== undefined && str > column.maxTime) {
    return { level: 'error', message: `${column.maxTime}以前の時刻を入力してください` }
  }
  return null
}

export function runValidation<T>(
  rows: ReadonlyArray<T>,
  columns: ReadonlyArray<DataColumnDef<T>>,
  customValidate?: (value: unknown, row: T, columnKey: keyof T) => ValidationResult | null,
): ReadonlyArray<CellValidationError> {
  const errors: CellValidationError[] = []

  for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
    const row = rows[rowIndex]
    for (const column of columns) {
      const value = row[column.key as keyof T]

      const builtInResult = validateCellValue(value, column, row)
      if (builtInResult !== null) {
        errors.push({
          rowIndex,
          columnKey: String(column.key),
          result: builtInResult,
        })
        continue
      }

      if (customValidate) {
        const customResult = customValidate(value, row, column.key as keyof T)
        if (customResult !== null) {
          errors.push({
            rowIndex,
            columnKey: String(column.key),
            result: customResult,
          })
        }
      }
    }
  }

  return errors
}
