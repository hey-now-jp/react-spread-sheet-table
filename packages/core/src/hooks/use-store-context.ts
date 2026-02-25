import { createContext, useContext } from 'react'
import type { TableStore } from '../core/store/create-store'

// biome-ignore lint/suspicious/noExplicitAny: generic store context requires any
const StoreContext = createContext<TableStore<any> | null>(null)

export const StoreProvider = StoreContext.Provider

export function useStoreContext<T>(): TableStore<T> {
  const store = useContext(StoreContext)
  if (store === null) {
    throw new Error('useStoreContext must be used within a StoreProvider (SpreadSheetTable)')
  }
  return store as TableStore<T>
}
