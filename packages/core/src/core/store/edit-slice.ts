import type { CellPosition } from '../types'

export type EditSlice = {
  readonly editingCell: CellPosition | null
  readonly editingValue: string
}

export function createEditSlice(): EditSlice {
  return {
    editingCell: null,
    editingValue: '',
  }
}

export function startEditing(position: CellPosition, initialValue: string): EditSlice {
  return {
    editingCell: position,
    editingValue: initialValue,
  }
}

export function updateEditingValue(slice: EditSlice, value: string): EditSlice {
  return {
    ...slice,
    editingValue: value,
  }
}

export function stopEditing(): EditSlice {
  return {
    editingCell: null,
    editingValue: '',
  }
}
