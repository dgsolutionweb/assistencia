import { useCallback, useEffect, useRef, useState } from 'react';

// Hook para debounce
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Hook para throttle
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const lastRun = useRef(Date.now());

  return useCallback(
    ((...args) => {
      if (Date.now() - lastRun.current >= delay) {
        callback(...args);
        lastRun.current = Date.now();
      }
    }) as T,
    [callback, delay]
  );
}

// Hook para memoização avançada
export function useMemoCompare<T>(
  next: T,
  compare: (previous: T | undefined, next: T) => boolean
): T {
  const previousRef = useRef<T>();
  const previous = previousRef.current;

  const isEqual = compare(previous, next);

  useEffect(() => {
    if (!isEqual) {
      previousRef.current = next;
    }
  });

  return isEqual ? previous! : next;
}

// Hook para lazy loading de imagens
export function useLazyImage(src: string, options?: IntersectionObserverInit) {
  const [imageSrc, setImageSrc] = useState<string>('');
  const [imageRef, setImageRef] = useState<HTMLImageElement | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    if (!imageRef || !src) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          setImageSrc(src);
          observer.disconnect();
        }
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
        ...options
      }
    );

    observer.observe(imageRef);

    return () => observer.disconnect();
  }, [imageRef, src, options]);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
  }, []);

  return {
    setImageRef,
    imageSrc,
    isLoaded,
    isInView,
    handleLoad
  };
}

// Hook para monitoramento de performance
export function usePerformanceMonitor() {
  const [metrics, setMetrics] = useState<{
    renderTime: number;
    memoryUsage?: number;
    fps: number;
  }>({
    renderTime: 0,
    fps: 0
  });

  const renderStartTime = useRef<number>(0);
  const frameCount = useRef<number>(0);
  const lastTime = useRef<number>(0);

  // Marcar início do render
  const startRender = useCallback(() => {
    renderStartTime.current = performance.now();
  }, []);

  // Marcar fim do render
  const endRender = useCallback(() => {
    const renderTime = performance.now() - renderStartTime.current;
    setMetrics(prev => ({ ...prev, renderTime }));
  }, []);

  // Monitorar FPS
  useEffect(() => {
    let animationId: number;

    const measureFPS = (currentTime: number) => {
      frameCount.current++;
      
      if (currentTime - lastTime.current >= 1000) {
        const fps = Math.round((frameCount.current * 1000) / (currentTime - lastTime.current));
        setMetrics(prev => ({ ...prev, fps }));
        frameCount.current = 0;
        lastTime.current = currentTime;
      }

      animationId = requestAnimationFrame(measureFPS);
    };

    animationId = requestAnimationFrame(measureFPS);

    return () => cancelAnimationFrame(animationId);
  }, []);

  // Monitorar uso de memória (se disponível)
  useEffect(() => {
    const measureMemory = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        setMetrics(prev => ({
          ...prev,
          memoryUsage: Math.round(memory.usedJSHeapSize / 1024 / 1024)
        }));
      }
    };

    const interval = setInterval(measureMemory, 5000);
    return () => clearInterval(interval);
  }, []);

  return {
    metrics,
    startRender,
    endRender
  };
}

// Hook para otimização de scroll
export function useScrollOptimization() {
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout>();

  const handleScroll = useThrottle(() => {
    setIsScrolling(true);
    
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    
    scrollTimeoutRef.current = setTimeout(() => {
      setIsScrolling(false);
    }, 150);
  }, 16); // ~60fps

  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  return {
    isScrolling,
    handleScroll
  };
}

// Hook para preload de recursos
export function usePreload() {
  const preloadedResources = useRef<Set<string>>(new Set());

  const preloadImage = useCallback((src: string): Promise<void> => {
    if (preloadedResources.current.has(src)) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        preloadedResources.current.add(src);
        resolve();
      };
      img.onerror = reject;
      img.src = src;
    });
  }, []);

  const preloadScript = useCallback((src: string): Promise<void> => {
    if (preloadedResources.current.has(src)) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.onload = () => {
        preloadedResources.current.add(src);
        resolve();
      };
      script.onerror = reject;
      script.src = src;
      document.head.appendChild(script);
    });
  }, []);

  const preloadCSS = useCallback((href: string): Promise<void> => {
    if (preloadedResources.current.has(href)) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.onload = () => {
        preloadedResources.current.add(href);
        resolve();
      };
      link.onerror = reject;
      link.href = href;
      document.head.appendChild(link);
    });
  }, []);

  return {
    preloadImage,
    preloadScript,
    preloadCSS,
    isPreloaded: (src: string) => preloadedResources.current.has(src)
  };
}

// Hook para cache inteligente
export function useSmartCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: {
    ttl?: number; // Time to live em ms
    staleWhileRevalidate?: boolean;
  } = {}
) {
  const { ttl = 5 * 60 * 1000, staleWhileRevalidate = true } = options;
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastFetch, setLastFetch] = useState<number>(0);

  const fetchData = useCallback(async (force = false) => {
    const now = Date.now();
    const isStale = now - lastFetch > ttl;

    if (!force && !isStale && data) {
      return data;
    }

    if (!staleWhileRevalidate || !data) {
      setIsLoading(true);
    }

    try {
      const result = await fetcher();
      setData(result);
      setLastFetch(now);
      setError(null);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro desconhecido'));
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [fetcher, ttl, staleWhileRevalidate, data, lastFetch]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    isLoading,
    error,
    refetch: () => fetchData(true),
    isStale: Date.now() - lastFetch > ttl
  };
}