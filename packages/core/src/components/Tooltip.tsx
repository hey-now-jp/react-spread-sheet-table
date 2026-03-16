import { memo, type ReactNode, type RefObject, useLayoutEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import styles from '../styles/tooltip.module.css'

type TooltipProps = {
  readonly anchorRef: RefObject<HTMLElement | null>
  readonly children: ReactNode
}

function TooltipInner({ anchorRef, children }: TooltipProps) {
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null)

  useLayoutEffect(() => {
    const anchor = anchorRef.current
    if (!anchor) return
    const rect = anchor.getBoundingClientRect()
    setPosition({
      top: rect.top + window.scrollY,
      left: rect.left + rect.width / 2 + window.scrollX,
    })
  }, [anchorRef])

  if (!position) return null

  return createPortal(
    <div
      className={styles.tooltip}
      style={{ top: position.top, left: position.left }}
      data-testid="sst-tooltip"
    >
      {children}
    </div>,
    document.body,
  )
}

export const Tooltip = memo(TooltipInner)
