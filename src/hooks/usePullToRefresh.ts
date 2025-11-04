import { useEffect, useRef, useState } from 'react'
import { useGesture } from '@use-gesture/react'
import HapticService from '@/lib/haptic'

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void>
  threshold?: number
  enabled?: boolean
}

export function usePullToRefresh({
  onRefresh,
  threshold = 80,
  enabled = true
}: UsePullToRefreshOptions) {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)
  const [canRefresh, setCanRefresh] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const bind = useGesture({
    onDrag: ({ down, movement: [, my], velocity: [, vy], direction: [, dy] }) => {
      if (!enabled || !containerRef.current) return

      const container = containerRef.current
      const isAtTop = container.scrollTop === 0

      // Only allow pull-to-refresh when at the top of the scroll
      if (!isAtTop || my < 0) {
        setPullDistance(0)
        setCanRefresh(false)
        return
      }

      if (down && dy > 0) {
        // Calculate pull distance with diminishing returns
        const distance = Math.min(my * 0.5, threshold * 1.5)
        setPullDistance(distance)
        setCanRefresh(distance >= threshold)

        // Haptic feedback when threshold is reached
        if (distance >= threshold && !canRefresh) {
          HapticService.medium()
        }
      } else if (!down && canRefresh && !isRefreshing) {
        // Trigger refresh
        handleRefresh()
      } else {
        // Reset state
        setPullDistance(0)
        setCanRefresh(false)
      }
    }
  }, {
    drag: {
      axis: 'y',
      filterTaps: true,
      rubberband: true
    }
  })

  const handleRefresh = async () => {
    if (isRefreshing) return

    setIsRefreshing(true)
    HapticService.success()

    try {
      await onRefresh()
    } catch (error) {
      console.error('Refresh failed:', error)
      HapticService.error()
    } finally {
      setIsRefreshing(false)
      setPullDistance(0)
      setCanRefresh(false)
    }
  }

  const refreshProgress = Math.min(pullDistance / threshold, 1)

  return {
    bind,
    containerRef,
    isRefreshing,
    pullDistance,
    canRefresh,
    refreshProgress,
    handleRefresh
  }
}