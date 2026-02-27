import { describe, expect, it } from 'vitest'
import { remapIndex, reorderArray } from './reorder-utils'

describe('remapIndex', () => {
  it('from と to が同じなら from を返す', () => {
    expect(remapIndex(2, 2, 2)).toBe(2)
  })

  it('from の要素は to に移動する', () => {
    expect(remapIndex(1, 1, 3)).toBe(3)
  })

  it('from < to の場合、from と to の間のインデックスは -1 される', () => {
    // from=1, to=3: index 2 -> 1, index 3 -> 2
    expect(remapIndex(2, 1, 3)).toBe(1)
    expect(remapIndex(3, 1, 3)).toBe(2)
  })

  it('from > to の場合、to と from の間のインデックスは +1 される', () => {
    // from=3, to=1: index 1 -> 2, index 2 -> 3
    expect(remapIndex(1, 3, 1)).toBe(2)
    expect(remapIndex(2, 3, 1)).toBe(3)
  })

  it('範囲外のインデックスは不変', () => {
    // from=1, to=3: index 0 は範囲外なので不変
    expect(remapIndex(0, 1, 3)).toBe(0)
    expect(remapIndex(4, 1, 3)).toBe(4)
    // from=3, to=1: index 0, 4 は範囲外なので不変
    expect(remapIndex(0, 3, 1)).toBe(0)
    expect(remapIndex(4, 3, 1)).toBe(4)
  })
})

describe('reorderArray', () => {
  it('先頭から末尾に移動', () => {
    const arr = ['a', 'b', 'c', 'd']
    expect(reorderArray(arr, 0, 3)).toEqual(['b', 'c', 'd', 'a'])
  })

  it('末尾から先頭に移動', () => {
    const arr = ['a', 'b', 'c', 'd']
    expect(reorderArray(arr, 3, 0)).toEqual(['d', 'a', 'b', 'c'])
  })

  it('隣接する要素の入れ替え (前→後)', () => {
    const arr = ['a', 'b', 'c']
    expect(reorderArray(arr, 0, 1)).toEqual(['b', 'a', 'c'])
  })

  it('隣接する要素の入れ替え (後→前)', () => {
    const arr = ['a', 'b', 'c']
    expect(reorderArray(arr, 2, 1)).toEqual(['a', 'c', 'b'])
  })

  it('同じ位置に移動しても変わらない', () => {
    const arr = ['a', 'b', 'c']
    expect(reorderArray(arr, 1, 1)).toEqual(['a', 'b', 'c'])
  })

  it('元の配列は変更されない', () => {
    const arr = ['a', 'b', 'c']
    const result = reorderArray(arr, 0, 2)
    expect(arr).toEqual(['a', 'b', 'c'])
    expect(result).toEqual(['b', 'c', 'a'])
    expect(result).not.toBe(arr)
  })
})
