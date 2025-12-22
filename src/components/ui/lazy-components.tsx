import { useCallback, useRef, useEffect, useMemo } from 'react'
import { useIntersectionObserver } from '@/hooks/useOptimizedQueries'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

interface LazyImageProps {
  src: string
  alt: string
  className?: string
  placeholder?: React.ReactNode
  onLoad?: () => void
  onError?: () => void
}

/**
 * Composant d'image avec lazy loading optimisé
 */
export function LazyImage({
  src,
  alt,
  className,
  placeholder,
  onLoad,
  onError
}: LazyImageProps) {
  const imgRef = useRef<HTMLImageElement>(null)
  const [isLoaded, setIsLoaded] = React.useState(false)
  const [isVisible, setIsVisible] = React.useState(false)
  const [hasError, setHasError] = React.useState(false)

  // Intersection observer for lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { rootMargin: '200px', threshold: 0 }
    )

    if (imgRef.current) {
      observer.observe(imgRef.current)
    }

    return () => observer.disconnect()
  }, [])

  const handleLoad = useCallback(() => {
    setIsLoaded(true)
    onLoad?.()
  }, [onLoad])

  const handleError = useCallback(() => {
    setHasError(true)
    onError?.()
  }, [onError])

  return (
    <div ref={imgRef} className={cn("relative overflow-hidden", className)}>
      {/* Placeholder/Skeleton */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0">
          {placeholder || <Skeleton className="w-full h-full" />}
        </div>
      )}

      {/* Actual image */}
      {isVisible && !hasError && (
        <img
          src={src}
          alt={alt}
          className={cn(
            "w-full h-full object-cover transition-opacity duration-300",
            isLoaded ? "opacity-100" : "opacity-0"
          )}
          onLoad={handleLoad}
          onError={handleError}
          loading="lazy"
          decoding="async"
        />
      )}

      {/* Error state */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <span className="text-xs text-muted-foreground">Erreur</span>
        </div>
      )}
    </div>
  )
}

import React from 'react'

interface InfiniteScrollContainerProps {
  children: React.ReactNode
  onLoadMore: () => void
  hasMore: boolean
  isLoading: boolean
  loadingComponent?: React.ReactNode
  endComponent?: React.ReactNode
  threshold?: number
  className?: string
}

/**
 * Container pour l'infinite scroll
 */
export function InfiniteScrollContainer({
  children,
  onLoadMore,
  hasMore,
  isLoading,
  loadingComponent,
  endComponent,
  threshold = 200,
  className
}: InfiniteScrollContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const loadMoreRef = useRef<HTMLDivElement>(null)

  // Intersection observer for load more trigger
  useEffect(() => {
    if (!hasMore || isLoading) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          onLoadMore()
        }
      },
      { rootMargin: `${threshold}px`, threshold: 0 }
    )

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current)
    }

    return () => observer.disconnect()
  }, [hasMore, isLoading, onLoadMore, threshold])

  return (
    <div ref={containerRef} className={className}>
      {children}

      {/* Load more trigger */}
      <div ref={loadMoreRef} className="w-full">
        {isLoading && (
          loadingComponent || (
            <div className="flex justify-center py-8">
              <div className="flex items-center gap-2 text-muted-foreground">
                <div className="h-5 w-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                <span>Chargement...</span>
              </div>
            </div>
          )
        )}

        {!hasMore && !isLoading && endComponent}
      </div>
    </div>
  )
}

interface VirtualListProps<T> {
  items: T[]
  renderItem: (item: T, index: number) => React.ReactNode
  itemHeight: number
  containerHeight: number
  overscan?: number
  className?: string
  getItemKey?: (item: T, index: number) => string | number
}

/**
 * Liste virtualisée simple et performante
 */
export function VirtualList<T>({
  items,
  renderItem,
  itemHeight,
  containerHeight,
  overscan = 3,
  className,
  getItemKey
}: VirtualListProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scrollTop, setScrollTop] = React.useState(0)

  const handleScroll = useCallback(() => {
    if (containerRef.current) {
      setScrollTop(containerRef.current.scrollTop)
    }
  }, [])

  const { visibleItems, offsetY, totalHeight } = useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
    const endIndex = Math.min(
      items.length - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    )

    return {
      visibleItems: items.slice(startIndex, endIndex + 1).map((item, i) => ({
        item,
        index: startIndex + i
      })),
      offsetY: startIndex * itemHeight,
      totalHeight: items.length * itemHeight
    }
  }, [items, scrollTop, containerHeight, itemHeight, overscan])

  return (
    <div
      ref={containerRef}
      className={cn("overflow-auto", className)}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map(({ item, index }) => (
            <div
              key={getItemKey ? getItemKey(item, index) : index}
              style={{ height: itemHeight }}
            >
              {renderItem(item, index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
