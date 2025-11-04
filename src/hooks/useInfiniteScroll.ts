import { useEffect, useRef, useState, useCallback } from 'react'

interface UseInfiniteScrollOptions {
  hasMore: boolean
  isLoading: boolean
  onLoadMore: () => Promise<void>
  threshold?: number
  enabled?: boolean
}

export function useInfiniteScroll({
  hasMore,
  isLoading,
  onLoadMore,
  threshold = 200,
  enabled = true
}: UseInfiniteScrollOptions) {
  const [isFetching, setIsFetching] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const sentinelRef = useRef<HTMLDivElement>(null)

  const handleLoadMore = useCallback(async () => {
    if (isFetching || isLoading || !hasMore || !enabled) return

    setIsFetching(true)
    try {
      await onLoadMore()
    } catch (error) {
      console.error('Failed to load more:', error)
    } finally {
      setIsFetching(false)
    }
  }, [isFetching, isLoading, hasMore, enabled, onLoadMore])

  // Intersection Observer for infinite scroll
  useEffect(() => {
    if (!enabled || !sentinelRef.current) return

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const [entry] = entries
        if (entry.isIntersecting && hasMore && !isLoading && !isFetching) {
          handleLoadMore()
        }
      },
      {
        rootMargin: `${threshold}px`,
        threshold: 0.1
      }
    )

    observerRef.current.observe(sentinelRef.current)

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [enabled, hasMore, isLoading, isFetching, threshold, handleLoadMore])

  // Manual scroll detection as fallback
  useEffect(() => {
    if (!enabled || !containerRef.current) return

    const container = containerRef.current

    const handleScroll = () => {
      if (!hasMore || isLoading || isFetching) return

      const { scrollTop, scrollHeight, clientHeight } = container
      const isNearBottom = scrollTop + clientHeight >= scrollHeight - threshold

      if (isNearBottom) {
        handleLoadMore()
      }
    }

    container.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      container.removeEventListener('scroll', handleScroll)
    }
  }, [enabled, hasMore, isLoading, isFetching, threshold, handleLoadMore])

  return {
    containerRef,
    sentinelRef,
    isFetching: isFetching || isLoading,
    handleLoadMore
  }
}