// Serviço para otimizações de performance
export class PerformanceService {
  private static instance: PerformanceService;
  private observer: IntersectionObserver | null = null;
  private imageCache = new Map<string, HTMLImageElement>();
  private componentCache = new Map<string, Promise<any>>();

  static getInstance(): PerformanceService {
    if (!PerformanceService.instance) {
      PerformanceService.instance = new PerformanceService();
    }
    return PerformanceService.instance;
  }

  // Lazy loading de imagens
  initImageLazyLoading(): void {
    if (!('IntersectionObserver' in window)) {
      return;
    }

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          const src = img.dataset.src;
          
          if (src) {
            this.loadImage(src).then((loadedImg) => {
              img.src = loadedImg.src;
              img.classList.remove('lazy');
              img.classList.add('loaded');
            }).catch(() => {
              img.classList.add('error');
            });
          }
          
          this.observer?.unobserve(img);
        }
      });
    }, {
      rootMargin: '50px 0px',
      threshold: 0.01
    });

    // Observar todas as imagens lazy
    document.querySelectorAll('img[data-src]').forEach((img) => {
      this.observer?.observe(img);
    });
  }

  // Carregar imagem com cache
  private async loadImage(src: string): Promise<HTMLImageElement> {
    if (this.imageCache.has(src)) {
      return this.imageCache.get(src)!;
    }

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        this.imageCache.set(src, img);
        resolve(img);
      };
      img.onerror = reject;
      img.src = src;
    });
  }

  // Lazy loading de componentes React
  lazyLoadComponent<T = any>(importFn: () => Promise<{ default: T }>): Promise<{ default: T }> {
    const key = importFn.toString();
    
    if (this.componentCache.has(key)) {
      return this.componentCache.get(key)!;
    }

    const promise = importFn().then((module) => {
      // Pre-carregar dependências críticas
      this.preloadCriticalResources();
      return module;
    });

    this.componentCache.set(key, promise);
    return promise;
  }

  // Pre-carregar recursos críticos
  private preloadCriticalResources(): void {
    const criticalResources: string[] = [
      // Adicione aqui recursos críticos para pre-carregar
    ];

    criticalResources.forEach((resource) => {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = resource;
      document.head.appendChild(link);
    });
  }

  // Otimizar renderização com requestIdleCallback
  scheduleWork(callback: () => void, options?: { timeout?: number }): void {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(callback, options);
    } else {
      // Fallback para navegadores sem suporte
      setTimeout(callback, 1);
    }
  }

  // Debounce para otimizar eventos frequentes
  debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;
    
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }

  // Throttle para limitar execução
  throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    let inThrottle: boolean;
    
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  // Medir performance de componentes
  measureComponentPerformance(componentName: string, renderFn: () => void): void {
    if ('performance' in window && 'mark' in performance) {
      const startMark = `${componentName}-start`;
      const endMark = `${componentName}-end`;
      const measureName = `${componentName}-render`;

      performance.mark(startMark);
      renderFn();
      performance.mark(endMark);
      
      performance.measure(measureName, startMark, endMark);
      
      // Log performance em desenvolvimento
      if (process.env.NODE_ENV === 'development') {
        const measure = performance.getEntriesByName(measureName)[0];
        console.log(`${componentName} render time: ${measure.duration.toFixed(2)}ms`);
      }
    } else {
      renderFn();
    }
  }

  // Otimizar scroll com passive listeners
  addPassiveScrollListener(
    element: Element | Window,
    handler: (event: Event) => void
  ): () => void {
    const options = { passive: true };
    element.addEventListener('scroll', handler, options);
    
    return () => {
      element.removeEventListener('scroll', handler);
    };
  }

  // Cleanup
  destroy(): void {
    this.observer?.disconnect();
    this.observer = null;
    this.imageCache.clear();
    this.componentCache.clear();
  }
}

// Hook para usar o serviço de performance
export function usePerformance() {
  const service = PerformanceService.getInstance();

  return {
    scheduleWork: service.scheduleWork.bind(service),
    debounce: service.debounce.bind(service),
    throttle: service.throttle.bind(service),
    measurePerformance: service.measureComponentPerformance.bind(service),
    addPassiveScrollListener: service.addPassiveScrollListener.bind(service),
    lazyLoadComponent: service.lazyLoadComponent.bind(service)
  };
}