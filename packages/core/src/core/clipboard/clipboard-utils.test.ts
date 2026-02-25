import { describe, expect, it } from 'vitest'
import { deserializeTsv, serializeToTsv } from './clipboard-utils'

describe('serializeToTsv', () => {
  it('serializes simple values', () => {
    const data = [
      ['Alice', 30, true],
      ['Bob', 25, false],
    ]
    expect(serializeToTsv(data)).toBe('Alice\t30\ttrue\nBob\t25\tfalse')
  })

  it('handles null and undefined', () => {
    const data = [[null, undefined, '']]
    expect(serializeToTsv(data)).toBe('\t\t')
  })

  it('quotes values with tabs', () => {
    const data = [['hello\tworld']]
    expect(serializeToTsv(data)).toBe('"hello\tworld"')
  })

  it('quotes values with newlines', () => {
    const data = [['hello\nworld']]
    expect(serializeToTsv(data)).toBe('"hello\nworld"')
  })

  it('escapes double quotes', () => {
    const data = [['say "hello"']]
    expect(serializeToTsv(data)).toBe('"say ""hello"""')
  })
})

describe('deserializeTsv', () => {
  it('deserializes simple TSV', () => {
    const result = deserializeTsv('Alice\t30\nBob\t25')
    expect(result).toEqual([
      ['Alice', '30'],
      ['Bob', '25'],
    ])
  })

  it('handles single cell', () => {
    const result = deserializeTsv('hello')
    expect(result).toEqual([['hello']])
  })

  it('handles quoted values with tabs', () => {
    const result = deserializeTsv('"hello\tworld"\t42')
    expect(result).toEqual([['hello\tworld', '42']])
  })

  it('handles escaped double quotes', () => {
    const result = deserializeTsv('"say ""hello"""')
    expect(result).toEqual([['say "hello"']])
  })

  it('handles empty string', () => {
    const result = deserializeTsv('')
    expect(result).toEqual([])
  })

  it('handles Windows line endings', () => {
    const result = deserializeTsv('a\t1\r\nb\t2')
    expect(result).toEqual([
      ['a', '1'],
      ['b', '2'],
    ])
  })
})
