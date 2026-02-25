import type { DataColumnDef } from '../types/column'
import type { CellValidationError, ValidationResult } from '../types/validation'

export function validateCellValue<T>(
  value: unknown,
  column: DataColumnDef<T>,
  row: T,
): ValidationResult | null {
  // required check
  if (column.required && (value === null || value === undefined || value === '')) {
    return { level: 'error', message: 'This field is required' }
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
    return { level: 'error', message: `Maximum ${column.maxLength} characters allowed` }
  }
  if (column.pattern !== undefined && !column.pattern.test(str)) {
    return { level: 'error', message: 'Invalid format' }
  }
  return null
}

function validateNumber<T>(
  value: unknown,
  column: Extract<DataColumnDef<T>, { type: 'number' }>,
): ValidationResult | null {
  const num = typeof value === 'number' ? value : Number(value)

  if (Number.isNaN(num)) {
    return { level: 'error', message: 'Must be a number' }
  }
  if (column.min !== undefined && num < column.min) {
    return { level: 'error', message: `Minimum value is ${column.min}` }
  }
  if (column.max !== undefined && num > column.max) {
    return { level: 'error', message: `Maximum value is ${column.max}` }
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
    return { level: 'error', message: 'Invalid date' }
  }
  if (column.minDate !== undefined && str < column.minDate) {
    return { level: 'error', message: `Date must be on or after ${column.minDate}` }
  }
  if (column.maxDate !== undefined && str > column.maxDate) {
    return { level: 'error', message: `Date must be on or before ${column.maxDate}` }
  }
  return null
}

function validateTime<T>(
  value: unknown,
  column: Extract<DataColumnDef<T>, { type: 'time' }>,
): ValidationResult | null {
  const str = String(value)

  if (!/^\d{2}:\d{2}(:\d{2})?$/.test(str)) {
    return { level: 'error', message: 'Invalid time format (HH:MM)' }
  }
  if (column.minTime !== undefined && str < column.minTime) {
    return { level: 'error', message: `Time must be on or after ${column.minTime}` }
  }
  if (column.maxTime !== undefined && str > column.maxTime) {
    return { level: 'error', message: `Time must be on or before ${column.maxTime}` }
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
