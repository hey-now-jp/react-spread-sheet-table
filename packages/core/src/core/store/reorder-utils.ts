export function remapIndex(index: number, from: number, to: number): number {
  if (index === from) return to
  if (from < to) {
    if (index > from && index <= to) return index - 1
  } else {
    if (index >= to && index < from) return index + 1
  }
  return index
}

export function reorderArray<T>(arr: ReadonlyArray<T>, fromIndex: number, toIndex: number): T[] {
  const result = [...arr]
  const [moved] = result.splice(fromIndex, 1)
  result.splice(toIndex, 0, moved)
  return result
}
