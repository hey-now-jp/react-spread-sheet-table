import type { DataColumnDef } from '../types/column'

export type ParseSuccess = {
  readonly ok: true
  readonly value: unknown
}

export type ParseFailure = {
  readonly ok: false
  readonly message: string
}

export type ParseResult = ParseSuccess | ParseFailure

/**
 * Validate a raw string value against a column's type and parse it to the appropriate type.
 * Empty strings are always accepted (required checks are handled separately by validation).
 */
export function parseAndValidateValue<T>(rawValue: string, column: DataColumnDef<T>): ParseResult {
  if (rawValue === '') {
    return { ok: true, value: '' }
  }

  switch (column.type) {
    case 'text':
      return { ok: true, value: rawValue }

    case 'number':
      return parseNumber(rawValue)

    case 'date':
      return parseDate(rawValue)

    case 'time':
      return parseTime(rawValue)

    case 'boolean':
      return parseBoolean(rawValue)

    case 'list':
      return parseList(rawValue, 'options' in column ? column.options : undefined)
  }
}

function parseNumber(raw: string): ParseResult {
  const trimmed = raw.trim()
  if (!/^-?\d+(\.\d+)?([eE][+-]?\d+)?$/.test(trimmed)) {
    return { ok: false, message: `"${raw}" is not a valid number` }
  }
  const num = Number(trimmed)
  if (!Number.isFinite(num)) {
    return { ok: false, message: `"${raw}" is not a valid number` }
  }
  return { ok: true, value: num }
}

function parseDate(raw: string): ParseResult {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return { ok: false, message: `"${raw}" is not a valid date (expected YYYY-MM-DD)` }
  }
  // Construct as local midnight to avoid UTC offset shifting the date
  const date = new Date(`${raw}T00:00:00`)
  if (Number.isNaN(date.getTime())) {
    return { ok: false, message: `"${raw}" is not a valid date` }
  }
  // Verify the parsed date matches the input (catches things like 2024-02-30)
  const [y, m, d] = raw.split('-').map(Number)
  if (date.getFullYear() !== y || date.getMonth() + 1 !== m || date.getDate() !== d) {
    return { ok: false, message: `"${raw}" is not a valid date` }
  }
  return { ok: true, value: raw }
}

function parseTime(raw: string): ParseResult {
  if (!/^\d{2}:\d{2}(:\d{2})?$/.test(raw)) {
    return { ok: false, message: `"${raw}" is not a valid time (expected HH:MM)` }
  }
  const parts = raw.split(':').map(Number)
  const [hours, minutes] = parts
  const seconds = parts[2] ?? 0
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59 || seconds < 0 || seconds > 59) {
    return { ok: false, message: `"${raw}" is not a valid time` }
  }
  return { ok: true, value: raw }
}

function parseBoolean(raw: string): ParseResult {
  const lower = raw.toLowerCase()
  if (lower === 'true') return { ok: true, value: true }
  if (lower === 'false') return { ok: true, value: false }
  return { ok: false, message: `"${raw}" is not a valid boolean (expected true/false)` }
}

function parseList(raw: string, options: readonly string[] | undefined): ParseResult {
  if (!options || options.length === 0) {
    return { ok: false, message: 'No valid options defined for this column' }
  }
  if (options.includes(raw)) {
    return { ok: true, value: raw }
  }
  return { ok: false, message: `"${raw}" is not a valid option` }
}
