const MAX_HISTORY_SIZE = 25

export type HistoryChange<T> = {
  readonly rowIndex: number
  readonly columnKey: keyof T
  readonly previousValue: T[keyof T]
  readonly newValue: T[keyof T]
}

export type CellChangesEntry<T> = {
  readonly type: 'cellChanges'
  readonly changes: ReadonlyArray<HistoryChange<T>>
}

export type ReorderEntry = {
  readonly type: 'reorder'
  readonly fromIndex: number
  readonly toIndex: number
}

export type HistoryEntry<T> = CellChangesEntry<T> | ReorderEntry

export type HistorySlice<T> = {
  readonly undoStack: ReadonlyArray<HistoryEntry<T>>
  readonly redoStack: ReadonlyArray<HistoryEntry<T>>
}

export function createHistorySlice<T>(): HistorySlice<T> {
  return {
    undoStack: [],
    redoStack: [],
  }
}

export function pushEntry<T>(slice: HistorySlice<T>, entry: HistoryEntry<T>): HistorySlice<T> {
  if (entry.type === 'cellChanges' && entry.changes.length === 0) return slice

  const undoStack =
    slice.undoStack.length >= MAX_HISTORY_SIZE
      ? [...slice.undoStack.slice(1), entry]
      : [...slice.undoStack, entry]

  return {
    undoStack,
    redoStack: [],
  }
}

export type UndoResult<T> = {
  readonly slice: HistorySlice<T>
  readonly entry: HistoryEntry<T>
} | null

export function undoEntry<T>(slice: HistorySlice<T>): UndoResult<T> {
  if (slice.undoStack.length === 0) return null

  const entry = slice.undoStack[slice.undoStack.length - 1]
  return {
    slice: {
      undoStack: slice.undoStack.slice(0, -1),
      redoStack: [...slice.redoStack, entry],
    },
    entry,
  }
}

export type RedoResult<T> = {
  readonly slice: HistorySlice<T>
  readonly entry: HistoryEntry<T>
} | null

export function redoEntry<T>(slice: HistorySlice<T>): RedoResult<T> {
  if (slice.redoStack.length === 0) return null

  const entry = slice.redoStack[slice.redoStack.length - 1]
  return {
    slice: {
      undoStack: [...slice.undoStack, entry],
      redoStack: slice.redoStack.slice(0, -1),
    },
    entry,
  }
}
