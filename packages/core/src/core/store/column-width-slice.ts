export type ColumnWidthSlice = {
  readonly widths: ReadonlyMap<string, number>
}

export function createColumnWidthSlice(): ColumnWidthSlice {
  return { widths: new Map() }
}

export function setColumnWidth(
  slice: ColumnWidthSlice,
  columnKey: string,
  width: number,
): ColumnWidthSlice {
  const next = new Map(slice.widths)
  next.set(columnKey, width)
  return { widths: next }
}
