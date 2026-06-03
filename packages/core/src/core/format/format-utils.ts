import type { DataColumnDef, ListOptionItem } from '../types'

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
    if (column.type === 'multiList') {
      return { ok: true, value: [] }
    }
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

    case 'multiList':
      return parseMultiList(rawValue, 'options' in column ? column.options : undefined)
  }
}

function parseNumber(raw: string): ParseResult {
  const trimmed = raw.trim()
  if (!/^-?\d+(\.\d+)?([eE][+-]?\d+)?$/.test(trimmed)) {
    return { ok: false, message: `"${raw}" は有効な数値ではありません` }
  }
  const num = Number(trimmed)
  if (!Number.isFinite(num)) {
    return { ok: false, message: `"${raw}" は有効な数値ではありません` }
  }
  return { ok: true, value: num }
}

function parseDate(raw: string): ParseResult {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return { ok: false, message: `"${raw}" は有効な日付ではありません (YYYY-MM-DD形式)` }
  }
  // Construct as local midnight to avoid UTC offset shifting the date
  const date = new Date(`${raw}T00:00:00`)
  if (Number.isNaN(date.getTime())) {
    return { ok: false, message: `"${raw}" は有効な日付ではありません` }
  }
  // Verify the parsed date matches the input (catches things like 2024-02-30)
  const [y, m, d] = raw.split('-').map(Number)
  if (date.getFullYear() !== y || date.getMonth() + 1 !== m || date.getDate() !== d) {
    return { ok: false, message: `"${raw}" は有効な日付ではありません` }
  }
  return { ok: true, value: raw }
}

function parseTime(raw: string): ParseResult {
  if (!/^\d{2}:\d{2}(:\d{2})?$/.test(raw)) {
    return { ok: false, message: `"${raw}" は有効な時刻ではありません (HH:MM形式)` }
  }
  const parts = raw.split(':').map(Number)
  const [hours, minutes] = parts
  const seconds = parts[2] ?? 0
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59 || seconds < 0 || seconds > 59) {
    return { ok: false, message: `"${raw}" は有効な時刻ではありません` }
  }
  return { ok: true, value: raw }
}

function parseBoolean(raw: string): ParseResult {
  const lower = raw.toLowerCase()
  if (lower === 'true') return { ok: true, value: true }
  if (lower === 'false') return { ok: true, value: false }
  return { ok: false, message: `"${raw}" は有効な真偽値ではありません (true/false)` }
}

function parseList(raw: string, options: readonly ListOptionItem[] | undefined): ParseResult {
  if (!options || options.length === 0) {
    return { ok: false, message: 'この列に有効な選択肢が定義されていません' }
  }
  if (options.some((opt) => opt.value === raw)) {
    return { ok: true, value: raw }
  }
  return { ok: false, message: `"${raw}" は有効な選択肢ではありません` }
}

function parseMultiList(raw: string, options: readonly ListOptionItem[] | undefined): ParseResult {
  if (!options || options.length === 0) {
    return { ok: false, message: 'この列に有効な選択肢が定義されていません' }
  }

  const validValues = new Set<string>()
  for (const opt of options) {
    validValues.add(opt.value)
  }

  // Try JSON parse first (internal format from editor)
  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) {
      const invalid = parsed.filter((v: unknown) => typeof v !== 'string' || !validValues.has(v))
      if (invalid.length > 0) {
        return { ok: false, message: `"${invalid.join(', ')}" は有効な選択肢ではありません` }
      }
      return { ok: true, value: parsed as string[] }
    }
  } catch {
    // Not JSON, try comma-separated (clipboard paste format)
  }

  // Comma-separated fallback (from clipboard paste)
  const values = raw
    .split(',')
    .map((v) => v.trim())
    .filter((v) => v !== '')
  const invalid = values.filter((v) => !validValues.has(v))
  if (invalid.length > 0) {
    return { ok: false, message: `"${invalid.join(', ')}" は有効な選択肢ではありません` }
  }
  return { ok: true, value: values }
}
