import { memo } from 'react'
import type { SortDirection } from '../core/types'
import styles from '../styles/header.module.css'

type SortIndicatorProps = {
  readonly direction: SortDirection | null
}

export const SortIndicator = memo(function SortIndicator({ direction }: SortIndicatorProps) {
  return (
    <span className={styles.sortIndicator} aria-hidden="true">
      <span className={direction === 'asc' ? styles.sortArrowActive : styles.sortArrow}>
        {'\u25B2'}
      </span>
      <span className={direction === 'desc' ? styles.sortArrowActive : styles.sortArrow}>
        {'\u25BC'}
      </span>
    </span>
  )
})
