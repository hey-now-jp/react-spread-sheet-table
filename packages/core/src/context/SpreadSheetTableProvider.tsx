import { type ReactNode, useMemo, useRef } from 'react'
import {
  type ClipboardOwner,
  SpreadSheetTableContext,
  type SpreadSheetTableContextValue,
} from './SpreadSheetTableContext'

type Props = {
  readonly children: ReactNode
}

export function ReactSpreadSheetTableProvider({ children }: Props) {
  const currentOwnerRef = useRef<ClipboardOwner | null>(null)

  const value = useMemo<SpreadSheetTableContextValue>(
    () => ({
      notifyClipboardCopy: (owner) => {
        if (currentOwnerRef.current !== null && currentOwnerRef.current !== owner) {
          currentOwnerRef.current.clearClipboardRange()
        }
        currentOwnerRef.current = owner
      },
      notifyClipboardClear: (owner) => {
        if (currentOwnerRef.current === owner) {
          currentOwnerRef.current = null
        }
      },
    }),
    [],
  )

  return (
    <SpreadSheetTableContext.Provider value={value}>{children}</SpreadSheetTableContext.Provider>
  )
}
