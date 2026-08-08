import { memo, useCallback, useEffect, useSyncExternalStore } from 'react'
import type { TableStore } from '../core/store/create-store'
import styles from '../styles/toast.module.css'

const AUTO_DISMISS_MS = 5000

type ToastProps<T> = {
  readonly store: TableStore<T>
  readonly visible?: boolean
}

function ToastInner<T>({ store, visible = true }: ToastProps<T>) {
  useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot)

  const messages = store.getToastMessages()
  const toastVersion = store.getToastVersion()
  const hasMessages = messages.length > 0

  // biome-ignore lint/correctness/useExhaustiveDependencies: toastVersion resets the dismiss timer when a new toast arrives while one is already visible
  useEffect(() => {
    if (!visible) {
      if (hasMessages) store.clearToast()
      return
    }
    if (!hasMessages) return
    const timer = setTimeout(() => {
      store.clearToast()
    }, AUTO_DISMISS_MS)
    return () => clearTimeout(timer)
  }, [hasMessages, toastVersion, store, visible])

  const handleClose = useCallback(() => {
    store.clearToast()
  }, [store])

  if (!visible || !hasMessages) return null

  return (
    <div className={styles.toastContainer}>
      <div className={styles.toast}>
        <button type="button" className={styles.toastClose} onClick={handleClose}>
          x
        </button>
        <div className={styles.toastTitle}>入力エラー</div>
        <ul className={styles.toastList}>
          {messages.map((msg) => (
            <li key={msg}>{msg}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export const Toast = memo(ToastInner) as typeof ToastInner
