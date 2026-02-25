import { useCallback, useEffect, useRef, useState } from 'react'

export type VirtualScrollResult = {
  readonly containerRef: React.RefObject<HTMLDivElement>
  readonly totalHeight: number
  readonly offsetTop: number
  readonly visibleStart: number
  readonly visibleEnd: number
}

const BUFFER_SIZE = 5

export function useVirtualScroll(
  rowCount: number,
  rowHeight: number,
  containerHeight: number,
): VirtualScrollResult {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [scrollTop, setScrollTop] = useState(0)

  const totalHeight = rowCount * rowHeight

  const visibleStart = Math.max(0, Math.floor(scrollTop / rowHeight) - BUFFER_SIZE)
  const visibleEnd = Math.min(
    rowCount,
    Math.ceil((scrollTop + containerHeight) / rowHeight) + BUFFER_SIZE,
  )
  const offsetTop = visibleStart * rowHeight

  const handleScroll = useCallback(() => {
    const container = containerRef.current
    if (container) {
      setScrollTop(container.scrollTop)
    }
  }, [])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    container.addEventListener('scroll', handleScroll, { passive: true })
    return () => container.removeEventListener('scroll', handleScroll)
  }, [handleScroll])

  return {
    containerRef,
    totalHeight,
    offsetTop,
    visibleStart,
    visibleEnd,
  }
}
