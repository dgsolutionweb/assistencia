import React, { useState, useEffect, useRef, useCallback } from 'react';

interface VirtualListProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  className?: string;
  overscan?: number; // Número de itens extras para renderizar fora da viewport
  onScroll?: (scrollTop: number) => void;
}

export function VirtualList<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  className = '',
  overscan = 5,
  onScroll
}: VirtualListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const scrollElementRef = useRef<HTMLDivElement>(null);

  // Calcular quais itens devem ser renderizados
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    items.length - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  );

  const visibleItems = items.slice(startIndex, endIndex + 1);

  // Handler para scroll
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const newScrollTop = e.currentTarget.scrollTop;
    setScrollTop(newScrollTop);
    onScroll?.(newScrollTop);
  }, [onScroll]);

  // Scroll para um item específico
  const scrollToItem = useCallback((index: number) => {
    if (scrollElementRef.current) {
      const scrollTop = index * itemHeight;
      scrollElementRef.current.scrollTop = scrollTop;
      setScrollTop(scrollTop);
    }
  }, [itemHeight]);

  // Scroll suave para um item
  const scrollToItemSmooth = useCallback((index: number) => {
    if (scrollElementRef.current) {
      const scrollTop = index * itemHeight;
      scrollElementRef.current.scrollTo({
        top: scrollTop,
        behavior: 'smooth'
      });
    }
  }, [itemHeight]);

  return (
    <div
      ref={scrollElementRef}
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: items.length * itemHeight, position: 'relative' }}>
        <div
          style={{
            transform: `translateY(${startIndex * itemHeight}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0
          }}
        >
          {visibleItems.map((item, index) => (
            <div
              key={startIndex + index}
              style={{ height: itemHeight }}
              className="flex items-center"
            >
              {renderItem(item, startIndex + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Hook para usar com VirtualList
export function useVirtualList<T>(
  items: T[],
  itemHeight: number,
  containerHeight: number
) {
  const [scrollTop, setScrollTop] = useState(0);
  
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - 5);
  const endIndex = Math.min(
    items.length - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + 5
  );

  const visibleItems = items.slice(startIndex, endIndex + 1);

  return {
    visibleItems,
    startIndex,
    endIndex,
    scrollTop,
    setScrollTop,
    totalHeight: items.length * itemHeight
  };
}

// Componente de lista virtual otimizada para mobile
interface MobileVirtualListProps<T> extends VirtualListProps<T> {
  pullToRefresh?: boolean;
  onRefresh?: () => Promise<void>;
  refreshing?: boolean;
}

export function MobileVirtualList<T>({
  pullToRefresh = false,
  onRefresh,
  refreshing = false,
  ...props
}: MobileVirtualListProps<T>) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const touchStartY = useRef(0);
  const scrollElementRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!pullToRefresh || !scrollElementRef.current) return;
    
    if (scrollElementRef.current.scrollTop === 0) {
      touchStartY.current = e.touches[0].clientY;
      setIsPulling(true);
    }
  }, [pullToRefresh]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isPulling || !pullToRefresh) return;

    const currentY = e.touches[0].clientY;
    const distance = Math.max(0, currentY - touchStartY.current);
    
    if (distance > 0) {
      e.preventDefault();
      setPullDistance(Math.min(distance * 0.5, 100));
    }
  }, [isPulling, pullToRefresh]);

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling || !pullToRefresh) return;

    setIsPulling(false);
    
    if (pullDistance > 60 && onRefresh) {
      await onRefresh();
    }
    
    setPullDistance(0);
  }, [isPulling, pullDistance, pullToRefresh, onRefresh]);

  return (
    <div className="relative">
      {pullToRefresh && (
        <div
          className="absolute top-0 left-0 right-0 flex items-center justify-center bg-blue-50 transition-all duration-200 z-10"
          style={{
            height: pullDistance,
            transform: `translateY(-${Math.max(0, 100 - pullDistance)}px)`
          }}
        >
          {pullDistance > 60 ? (
            <span className="text-blue-600 text-sm font-medium">
              {refreshing ? 'Atualizando...' : 'Solte para atualizar'}
            </span>
          ) : (
            <span className="text-gray-500 text-sm">
              Puxe para atualizar
            </span>
          )}
        </div>
      )}
      
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ transform: `translateY(${pullDistance}px)` }}
      >
        <VirtualList {...props} />
      </div>
    </div>
  );
}

export default VirtualList;