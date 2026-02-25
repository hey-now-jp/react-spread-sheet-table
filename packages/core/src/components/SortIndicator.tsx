import { memo } from 'react'
import type { SortDirection } from '../core/types/sort'

type SortIndicatorProps = {
  readonly direction: SortDirection | null
}

export const SortIndicator = memo(function SortIndicator({ direction }: SortIndicatorProps) {
  if (direction === null) return null

  return <span aria-hidden="true">{direction === 'asc' ? '\u25B2' : '\u25BC'}</span>
})
