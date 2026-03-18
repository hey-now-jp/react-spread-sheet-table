import { createContext } from 'react'

export type ClipboardOwner = {
  readonly clearClipboardRange: () => void
}

export type SpreadSheetTableContextValue = {
  readonly notifyClipboardCopy: (owner: ClipboardOwner) => void
  readonly notifyClipboardClear: (owner: ClipboardOwner) => void
}

export const SpreadSheetTableContext = createContext<SpreadSheetTableContextValue | null>(null)
