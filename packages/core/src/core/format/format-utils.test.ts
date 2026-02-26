import { describe, expect, it } from 'vitest'
import type { DataColumnDef } from '../types'
import { parseAndValidateValue } from './format-utils'

type TestRow = {
  name: string
  age: number
  joinDate: string
  startTime: string
  active: boolean
  department: string
  skills: string[]
}

describe('parseAndValidateValue', () => {
  describe('text column', () => {
    const col: DataColumnDef<TestRow> = { key: 'name', header: 'Name', type: 'text' }

    it('accepts any string', () => {
      const result = parseAndValidateValue('hello', col)
      expect(result).toEqual({ ok: true, value: 'hello' })
    })

    it('accepts empty string', () => {
      const result = parseAndValidateValue('', col)
      expect(result).toEqual({ ok: true, value: '' })
    })
  })

  describe('number column', () => {
    const col: DataColumnDef<TestRow> = { key: 'age', header: 'Age', type: 'number' }

    it('parses valid integer', () => {
      const result = parseAndValidateValue('42', col)
      expect(result).toEqual({ ok: true, value: 42 })
    })

    it('parses valid decimal', () => {
      const result = parseAndValidateValue('3.14', col)
      expect(result).toEqual({ ok: true, value: 3.14 })
    })

    it('parses negative number', () => {
      const result = parseAndValidateValue('-10', col)
      expect(result).toEqual({ ok: true, value: -10 })
    })

    it('rejects non-numeric string', () => {
      const result = parseAndValidateValue('abc', col)
      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.message).toContain('数値')
      }
    })

    it('accepts empty string (required check deferred)', () => {
      const result = parseAndValidateValue('', col)
      expect(result).toEqual({ ok: true, value: '' })
    })

    it('rejects whitespace-only string', () => {
      const result = parseAndValidateValue('   ', col)
      expect(result.ok).toBe(false)
    })

    it('rejects Infinity', () => {
      const result = parseAndValidateValue('Infinity', col)
      expect(result.ok).toBe(false)
    })

    it('rejects hex literal', () => {
      const result = parseAndValidateValue('0x1f', col)
      expect(result.ok).toBe(false)
    })
  })

  describe('date column', () => {
    const col: DataColumnDef<TestRow> = { key: 'joinDate', header: 'Join Date', type: 'date' }

    it('accepts valid date format', () => {
      const result = parseAndValidateValue('2024-01-15', col)
      expect(result).toEqual({ ok: true, value: '2024-01-15' })
    })

    it('rejects invalid date format', () => {
      const result = parseAndValidateValue('not-a-date', col)
      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.message).toContain('date')
      }
    })

    it('rejects invalid date values', () => {
      const result = parseAndValidateValue('2024-13-45', col)
      expect(result.ok).toBe(false)
    })

    it('accepts empty string', () => {
      const result = parseAndValidateValue('', col)
      expect(result).toEqual({ ok: true, value: '' })
    })
  })

  describe('time column', () => {
    const col: DataColumnDef<TestRow> = { key: 'startTime', header: 'Start Time', type: 'time' }

    it('accepts HH:MM format', () => {
      const result = parseAndValidateValue('09:30', col)
      expect(result).toEqual({ ok: true, value: '09:30' })
    })

    it('accepts HH:MM:SS format', () => {
      const result = parseAndValidateValue('09:30:00', col)
      expect(result).toEqual({ ok: true, value: '09:30:00' })
    })

    it('rejects invalid time format', () => {
      const result = parseAndValidateValue('9:30', col)
      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.message).toContain('時刻')
      }
    })

    it('rejects invalid time values', () => {
      const result = parseAndValidateValue('25:99', col)
      expect(result.ok).toBe(false)
    })

    it('accepts empty string', () => {
      const result = parseAndValidateValue('', col)
      expect(result).toEqual({ ok: true, value: '' })
    })
  })

  describe('boolean column', () => {
    const col: DataColumnDef<TestRow> = { key: 'active', header: 'Active', type: 'boolean' }

    it('parses "true"', () => {
      const result = parseAndValidateValue('true', col)
      expect(result).toEqual({ ok: true, value: true })
    })

    it('parses "false"', () => {
      const result = parseAndValidateValue('false', col)
      expect(result).toEqual({ ok: true, value: false })
    })

    it('parses case-insensitive TRUE', () => {
      const result = parseAndValidateValue('TRUE', col)
      expect(result).toEqual({ ok: true, value: true })
    })

    it('rejects invalid boolean string', () => {
      const result = parseAndValidateValue('yes', col)
      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.message).toContain('true')
      }
    })
  })

  describe('list column', () => {
    const col: DataColumnDef<TestRow> = {
      key: 'department',
      header: 'Department',
      type: 'list',
      options: ['Engineering', 'Sales', 'HR'],
    }

    it('accepts valid option', () => {
      const result = parseAndValidateValue('Engineering', col)
      expect(result).toEqual({ ok: true, value: 'Engineering' })
    })

    it('rejects value not in options', () => {
      const result = parseAndValidateValue('Marketing', col)
      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.message).toContain('Marketing')
      }
    })

    it('accepts empty string', () => {
      const result = parseAndValidateValue('', col)
      expect(result).toEqual({ ok: true, value: '' })
    })
  })

  describe('multiList column', () => {
    const col: DataColumnDef<TestRow> = {
      key: 'skills',
      header: 'Skills',
      type: 'multiList',
      options: ['React', 'TypeScript', 'Python'],
    }

    it('parses JSON array of valid options', () => {
      const result = parseAndValidateValue('["React","TypeScript"]', col)
      expect(result).toEqual({ ok: true, value: ['React', 'TypeScript'] })
    })

    it('parses comma-separated string of valid options', () => {
      const result = parseAndValidateValue('React, Python', col)
      expect(result).toEqual({ ok: true, value: ['React', 'Python'] })
    })

    it('parses single value comma-separated', () => {
      const result = parseAndValidateValue('React', col)
      expect(result).toEqual({ ok: true, value: ['React'] })
    })

    it('rejects invalid option in JSON array', () => {
      const result = parseAndValidateValue('["React","Java"]', col)
      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.message).toContain('Java')
      }
    })

    it('rejects invalid option in comma-separated', () => {
      const result = parseAndValidateValue('React, Java', col)
      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.message).toContain('Java')
      }
    })

    it('returns empty array for empty string', () => {
      const result = parseAndValidateValue('', col)
      expect(result).toEqual({ ok: true, value: [] })
    })

    it('parses empty JSON array', () => {
      const result = parseAndValidateValue('[]', col)
      expect(result).toEqual({ ok: true, value: [] })
    })
  })
})
