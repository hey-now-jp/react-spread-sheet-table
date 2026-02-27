import { describe, expect, it } from 'vitest'
import { deserializeTsv, expandClipboardData, serializeToTsv } from './clipboard-utils'

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

describe('expandClipboardData', () => {
  it('1x1 を 3x3 に展開 (単一値フィル)', () => {
    const parsed = [['A']]
    const result = expandClipboardData(parsed, 3, 3)
    expect(result).toEqual([
      ['A', 'A', 'A'],
      ['A', 'A', 'A'],
      ['A', 'A', 'A'],
    ])
  })

  it('2x2 を 4x4 に展開 (タイリング)', () => {
    const parsed = [
      ['A', 'B'],
      ['C', 'D'],
    ]
    const result = expandClipboardData(parsed, 4, 4)
    expect(result).toEqual([
      ['A', 'B', 'A', 'B'],
      ['C', 'D', 'C', 'D'],
      ['A', 'B', 'A', 'B'],
      ['C', 'D', 'C', 'D'],
    ])
  })

  it('1x3 を 3x3 に展開 (行のタイリング)', () => {
    const parsed = [['A', 'B', 'C']]
    const result = expandClipboardData(parsed, 3, 3)
    expect(result).toEqual([
      ['A', 'B', 'C'],
      ['A', 'B', 'C'],
      ['A', 'B', 'C'],
    ])
  })

  it('3x1 を 3x3 に展開 (列のタイリング)', () => {
    const parsed = [['A'], ['B'], ['C']]
    const result = expandClipboardData(parsed, 3, 3)
    expect(result).toEqual([
      ['A', 'A', 'A'],
      ['B', 'B', 'B'],
      ['C', 'C', 'C'],
    ])
  })

  it('2x2 を 3x3 に展開 (端数ありタイリング)', () => {
    const parsed = [
      ['A', 'B'],
      ['C', 'D'],
    ]
    const result = expandClipboardData(parsed, 3, 3)
    expect(result).toEqual([
      ['A', 'B', 'A'],
      ['C', 'D', 'C'],
      ['A', 'B', 'A'],
    ])
  })

  it('不均等な行長の入力を処理', () => {
    const parsed = [['A', 'B', 'C'], ['D']]
    const result = expandClipboardData(parsed, 2, 3)
    expect(result).toEqual([
      ['A', 'B', 'C'],
      ['D', '', ''],
    ])
  })

  it('ソースと同サイズのターゲットではそのまま返す', () => {
    const parsed = [
      ['A', 'B'],
      ['C', 'D'],
    ]
    const result = expandClipboardData(parsed, 2, 2)
    expect(result).toEqual([
      ['A', 'B'],
      ['C', 'D'],
    ])
  })
})
